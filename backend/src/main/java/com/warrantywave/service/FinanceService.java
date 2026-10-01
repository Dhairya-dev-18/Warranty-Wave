package com.warrantywave.service;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.warrantywave.common.exception.BusinessRuleException;
import com.warrantywave.common.exception.ResourceNotFoundException;
import com.warrantywave.dto.FinanceDto;
import com.warrantywave.model.*;
import com.warrantywave.repository.*;
import com.warrantywave.security.UserPrincipal;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional
public class FinanceService {
    private final FinanceApplicationRepository applications;
    private final FinanceContractRepository contracts;
    private final RepaymentScheduleRepository schedules;
    private final VehicleRepository vehicles;
    private final UserRepository users;
    private final RateConfigRepository rateConfigs;
    private final ObjectMapper mapper;

    @Transactional(readOnly = true)
    public List<FinanceDto.ApplicationResponse> list(String status, UserPrincipal actor) {
        boolean customer = has(actor, "ROLE_CUSTOMER");
        List<FinanceApplication> rows = customer ? applications.findByCustomerIdWithDetails(actor.getId()) : applications.findAllWithDetails();
        return rows.stream().filter(a -> status == null || status.equals(a.getStatus())).map(this::appDto).toList();
    }

    @Transactional(readOnly = true)
    public FinanceDto.ApplicationResponse get(Long id) {
        FinanceApplication a = applications.findById(id).orElseThrow(() -> new ResourceNotFoundException("Finance application", id));
        return appDto(a);
    }

    public FinanceDto.ApplicationResponse create(FinanceDto.ApplicationRequest req, UserPrincipal actor) {
        if (req.getDownPayment() >= req.getAmount()) throw new BusinessRuleException("INVALID_AMOUNT", "Down payment must be less than vehicle price");
        Vehicle v = vehicles.findById(req.getVehicleId()).orElseThrow(() -> new ResourceNotFoundException("Vehicle", req.getVehicleId()));
        if (v.getOwner() == null || !v.getOwner().getId().equals(actor.getId())) throw new BusinessRuleException("VEHICLE_FORBIDDEN", "You can only apply using your own vehicle");
        User customer = users.findById(actor.getId()).orElseThrow(() -> new ResourceNotFoundException("User", actor.getId()));
        RateConfig cfg = config();
        double principal = req.getAmount() - req.getDownPayment();
        double indicative = monthly(principal, cfg.getBandB(), req.getTenureMonths());
        double dti = (req.getExistingEmi() + indicative) / req.getMonthlyIncome();
        int dtiPts = dti < .30 ? 150 : dti <= .45 ? 80 : -100;
        int bureauPts = (int)Math.round((Math.min(900, Math.max(300, req.getCreditHistoryScore())) - 300) / 600.0 * 200);
        int downPts = req.getDownPayment() / req.getAmount() >= .20 ? 50 : 0;
        List<FinanceDto.Reason> reasons = List.of(new FinanceDto.Reason("Base score",300,"Every applicant starts at 300"),
                new FinanceDto.Reason("Debt-to-income",dtiPts,String.format("DTI %.1f%% (existing + new EMI vs income)", dti*100)),
                new FinanceDto.Reason("Credit bureau score",bureauPts,"Bureau score mapped to 0-200"),
                new FinanceDto.Reason("Down payment",downPts,"20% of vehicle price needed for points"),
                new FinanceDto.Reason("Income stability",req.isStableIncome()?50:0,req.isStableIncome()?"Stable income":"Income not marked stable"));
        int score = reasons.stream().mapToInt(FinanceDto.Reason::getPoints).sum();
        String decision = score >= cfg.getApproveThreshold() ? "APPROVE" : score >= cfg.getReviewThreshold() ? "REVIEW" : "REJECT";
        String status = "APPROVE".equals(decision) ? "APPROVED" : "REVIEW".equals(decision) ? "MANUAL_REVIEW" : "REJECTED";
        FinanceApplication a = FinanceApplication.builder().customer(customer).vehicle(v).type(req.getType()).amount(req.getAmount()).downPayment(req.getDownPayment()).tenureMonths(req.getTenureMonths()).monthlyIncome(req.getMonthlyIncome()).existingEmi(req.getExistingEmi()).creditHistoryScore(req.getCreditHistoryScore()).stableIncome(req.isStableIncome()).score(score).riskBand(score >= 750 ? "A" : score >= 650 ? "B" : "C").decision(decision).decisionNote("").status(status).reasonsJson(writeReasons(reasons)).build();
        a = applications.save(a);
        if ("APPROVED".equals(status)) openContract(a);
        return appDto(a);
    }

    public FinanceDto.ApplicationResponse decide(Long id, FinanceDto.DecisionRequest req) {
        FinanceApplication a = applications.findById(id).orElseThrow(() -> new ResourceNotFoundException("Finance application", id));
        if (!"MANUAL_REVIEW".equals(a.getStatus())) throw new BusinessRuleException("INVALID_APPLICATION_STATE", "Application is not awaiting manual review");
        if (!req.isApprove() && (req.getNote() == null || req.getNote().isBlank())) throw new BusinessRuleException("NOTE_REQUIRED", "A note is required to reject an application");
        a.setDecision(req.isApprove() ? "APPROVE" : "REJECT"); a.setStatus(req.isApprove() ? "APPROVED" : "REJECTED"); a.setDecisionNote(req.getNote());
        if (req.isApprove()) openContract(a);
        return appDto(a);
    }

    @Transactional(readOnly = true)
    public FinanceDto.ContractResponse contract(Long id, UserPrincipal actor) {
        FinanceContract c = contracts.findById(id).orElseThrow(() -> new ResourceNotFoundException("Contract", id));
        assertOwner(c, actor);
        return contractDto(c);
    }

    @Transactional(readOnly = true)
    public List<FinanceDto.ScheduleResponse> schedule(Long id, UserPrincipal actor) {
        FinanceContract c = contracts.findById(id).orElseThrow(() -> new ResourceNotFoundException("Contract", id)); assertOwner(c, actor);
        return schedules.findByContractIdOrderByInstallmentNoAsc(id).stream().map(this::scheduleDto).toList();
    }

    public FinanceDto.PayResponse pay(Long id, UserPrincipal actor) {
        FinanceContract c = contracts.findById(id).orElseThrow(() -> new ResourceNotFoundException("Contract", id)); assertOwner(c, actor);
        if (!"ACTIVE".equals(c.getStatus())) throw new BusinessRuleException("CONTRACT_INACTIVE", "Contract is not active");
        List<RepaymentSchedule> rows = schedules.findByContractIdOrderByInstallmentNoAsc(id);
        RepaymentSchedule row = rows.stream().filter(x -> !"PAID".equals(x.getStatus())).findFirst().orElseThrow(() -> new BusinessRuleException("NO_UNPAID_INSTALLMENTS", "No unpaid installments"));
        row.setStatus("PAID"); row.setPaidDate(LocalDate.now());
        if (rows.stream().allMatch(x -> x == row || "PAID".equals(x.getStatus()))) c.setStatus("CLOSED");
        return FinanceDto.PayResponse.builder().paid(Math.round((row.getAmount()+row.getLateFee())*100.0)/100.0).contract(contractDto(c)).build();
    }

    private RateConfig config() { return rateConfigs.findAll().stream().findFirst().orElseGet(() -> RateConfig.builder().bandA(8.5).bandB(11).bandC(14).approveThreshold(700).reviewThreshold(550).lateFeePercent(2).build()); }
    private void openContract(FinanceApplication a) {
        if (contracts.findByApplicationId(a.getId()).isPresent()) return;
        RateConfig cfg=config(); double rate="A".equals(a.getRiskBand())?cfg.getBandA():"B".equals(a.getRiskBand())?cfg.getBandB():cfg.getBandC();
        double principal=a.getAmount()-a.getDownPayment(); double emi=monthly(principal,rate,a.getTenureMonths()); LocalDate start=LocalDate.now();
        FinanceContract c=contracts.save(FinanceContract.builder().application(a).principal(principal).interestRate(rate).tenureMonths(a.getTenureMonths()).emi(emi).startDate(start).status("ACTIVE").build());
        double balance=principal, monthlyRate=rate/1200.0;
        for(int i=1;i<=a.getTenureMonths();i++){ double interest=round2(balance*monthlyRate); double principalPart=round2(Math.min(balance,emi-interest)); double amount=round2(principalPart+interest); balance=round2(balance-principalPart); schedules.save(RepaymentSchedule.builder().contract(c).installmentNo(i).dueDate(start.plusMonths(i)).principalPart(principalPart).interestPart(interest).amount(amount).lateFee(0).status("PENDING").build()); }
    }
    private double monthly(double principal,double annualRate,int months){ double r=annualRate/1200.0; return round2(r==0?principal/months:principal*r*Math.pow(1+r,months)/(Math.pow(1+r,months)-1)); }
    private double round2(double n){return Math.round(n*100.0)/100.0;}
    private void assertOwner(FinanceContract c,UserPrincipal actor){if(!c.getApplication().getCustomer().getId().equals(actor.getId())&&!has(actor,"ROLE_ADMIN"))throw new BusinessRuleException("CONTRACT_FORBIDDEN","You do not have access to this contract");}
    private boolean has(UserPrincipal actor,String role){return actor.getAuthorities().stream().anyMatch(a->a.getAuthority().equals(role));}
    private String writeReasons(List<FinanceDto.Reason> r){try{return mapper.writeValueAsString(r);}catch(Exception e){throw new IllegalStateException(e);}}
    private List<FinanceDto.Reason> readReasons(String json){try{return json==null?new ArrayList<>():mapper.readValue(json,new TypeReference<>(){});}catch(Exception e){return new ArrayList<>();}}
    private FinanceDto.ApplicationResponse appDto(FinanceApplication a){return FinanceDto.ApplicationResponse.builder().id(a.getId()).customerId(a.getCustomer().getId()).vehicleId(a.getVehicle().getId()).type(a.getType()).amount(a.getAmount()).downPayment(a.getDownPayment()).tenureMonths(a.getTenureMonths()).monthlyIncome(a.getMonthlyIncome()).existingEmi(a.getExistingEmi()).creditHistoryScore(a.getCreditHistoryScore()).stableIncome(a.isStableIncome()).score(a.getScore()).riskBand(a.getRiskBand()).decision(a.getDecision()).reasons(readReasons(a.getReasonsJson())).decisionNote(a.getDecisionNote()).status(a.getStatus()).createdAt(a.getCreatedAt()).vehicleVin(a.getVehicle().getVin()).customerName(a.getCustomer().getName()).contractId(contracts.findByApplicationId(a.getId()).map(FinanceContract::getId).orElse(null)).build();}
    private FinanceDto.ContractResponse contractDto(FinanceContract c){List<RepaymentSchedule> all=schedules.findByContractId(c.getId());return FinanceDto.ContractResponse.builder().id(c.getId()).applicationId(c.getApplication().getId()).principal(c.getPrincipal()).interestRate(c.getInterestRate()).tenureMonths(c.getTenureMonths()).emi(c.getEmi()).startDate(c.getStartDate()).status(c.getStatus()).vehicleVin(c.getApplication().getVehicle().getVin()).paidCount((int)all.stream().filter(x->"PAID".equals(x.getStatus())).count()).outstanding(round2(all.stream().filter(x->!"PAID".equals(x.getStatus())).mapToDouble(RepaymentSchedule::getPrincipalPart).sum())).build();}
    private FinanceDto.ScheduleResponse scheduleDto(RepaymentSchedule r){return FinanceDto.ScheduleResponse.builder().id(r.getId()).contractId(r.getContract().getId()).installmentNo(r.getInstallmentNo()).dueDate(r.getDueDate()).principalPart(r.getPrincipalPart()).interestPart(r.getInterestPart()).amount(r.getAmount()).lateFee(r.getLateFee()).status(r.getStatus()).paidDate(r.getPaidDate()).build();}
}

package com.warrantywave.service;

import com.warrantywave.common.exception.ResourceNotFoundException;
import com.warrantywave.common.exception.BusinessRuleException;
import com.warrantywave.dto.AuthDto;
import com.warrantywave.dto.DashboardSummaryDto;
import com.warrantywave.dto.RateConfigDto;
import com.warrantywave.model.*;
import com.warrantywave.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
@Transactional
public class AdminService {
    private final UserRepository users;
    private final RateConfigRepository rates;
    private final ClaimRepository claims;
    private final FinanceApplicationRepository applications;
    private final FinanceContractRepository contracts;
    private final RepaymentScheduleRepository schedules;

    @Transactional(readOnly = true)
    public List<AuthDto.UserResponse> users() {
        return users.findAll().stream().map(u -> new AuthDto.UserResponse(u.getId(), u.getName(), u.getEmail(), u.getRole())).toList();
    }

    public void updateRole(Long id, AuthDto.UpdateRoleRequest request) {
        User u = users.findById(id).orElseThrow(() -> new ResourceNotFoundException("User", id));
        u.setRole(request.getRole());
    }

    @Transactional(readOnly = true)
    public RateConfigDto rates() {
        RateConfig r = rates.findAll().stream().findFirst().orElse(null);
        if (r == null) return new RateConfigDto(8.5, 11.0, 14.0, 700, 550, 2.0);
        return new RateConfigDto(r.getBandA(), r.getBandB(), r.getBandC(), r.getApproveThreshold(), r.getReviewThreshold(), r.getLateFeePercent());
    }

    public RateConfigDto saveRates(RateConfigDto dto) {
        if (dto.getReviewThreshold() >= dto.getApproveThreshold()) throw new BusinessRuleException("INVALID_RATE_THRESHOLDS", "Review threshold must be below approve threshold");
        RateConfig r = rates.findAll().stream().findFirst().orElseGet(RateConfig::new);
        r.setBandA(dto.getBandA()); r.setBandB(dto.getBandB()); r.setBandC(dto.getBandC()); r.setApproveThreshold(dto.getApproveThreshold()); r.setReviewThreshold(dto.getReviewThreshold()); r.setLateFeePercent(dto.getLateFeePercent());
        rates.save(r);
        return dto;
    }

    @Transactional(readOnly = true)
    public DashboardSummaryDto dashboard() {
        Map<String, Long> by = new LinkedHashMap<>();
        for (String state : List.of("SUBMITTED", "UNDER_REVIEW", "APPROVED", "REJECTED", "SETTLED")) by.put(state, claims.countByStatus(state));
        long total = claims.count();
        long decided = by.get("APPROVED") + by.get("SETTLED") + by.get("REJECTED");
        int approval = decided == 0 ? 0 : (int)Math.round((by.get("APPROVED") + by.get("SETTLED")) * 100.0 / decided);
        List<FinanceContract> active = contracts.findByStatus("ACTIVE");
        double outstanding = 0;
        for (FinanceContract c : active) for (RepaymentSchedule row : schedules.findByContractId(c.getId())) if (!"PAID".equals(row.getStatus())) outstanding += row.getPrincipalPart();
        return DashboardSummaryDto.builder().claimsByStatus(by).totalClaims(total).approvalRate(approval).activeContracts(active.size()).outstandingLoans(outstanding).overdueEmis(schedules.countByStatus("OVERDUE")).pendingCreditReviews(applications.countByStatus("MANUAL_REVIEW")).build();
    }
}

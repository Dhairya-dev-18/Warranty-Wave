package com.warrantywave.service;

import com.warrantywave.common.exception.BusinessRuleException;
import com.warrantywave.common.exception.ResourceNotFoundException;
import com.warrantywave.dto.ClaimDto;
import com.warrantywave.model.*;
import com.warrantywave.repository.*;
import com.warrantywave.security.UserPrincipal;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.time.LocalDate;
import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional
public class ClaimService {
    private final ClaimRepository claims;
    private final WarrantyRepository warranties;
    private final UserRepository users;

    @Transactional(readOnly = true)
    public List<ClaimDto.Response> list(String status, UserPrincipal actor) {
        boolean staff = actor.getAuthorities().stream().anyMatch(a -> a.getAuthority().equals("ROLE_ADJUSTER") || a.getAuthority().equals("ROLE_ADMIN"));
        List<Claim> found = staff ? (status == null ? claims.findAllWithDetails() : claims.findByStatusWithDetails(status))
                : (status == null ? claims.findByCustomerIdWithDetails(actor.getId()) : claims.findByCustomerIdAndStatusWithDetails(actor.getId(), status));
        return found.stream().map(this::dto).toList();
    }

    public ClaimDto.Response create(ClaimDto.CreateRequest req, UserPrincipal actor) {
        Warranty warranty = warranties.findById(req.getWarrantyId()).orElseThrow(() -> new ResourceNotFoundException("Warranty", req.getWarrantyId()));
        if (warranty.getVehicle().getOwner() == null || !warranty.getVehicle().getOwner().getId().equals(actor.getId())) throw new BusinessRuleException("WARRANTY_FORBIDDEN", "You can only claim against your own warranty");
        WarrantyPlan plan = warranty.getPlan();
        String rejection = null;
        if (!"ACTIVE".equals(warranty.getStatus()) || LocalDate.now().isAfter(warranty.getEndDate())) rejection = "Warranty is expired or inactive";
        else if (warranty.getVehicle().getCurrentMileage() > plan.getKmLimit()) rejection = "Vehicle mileage exceeds the plan limit of " + plan.getKmLimit() + " km";
        else if (!List.of(plan.getCoveredParts().toUpperCase().split("\\s*,\\s*")).contains(req.getPart().trim().toUpperCase())) rejection = req.getPart() + " is not covered by the " + plan.getName() + " plan";
        Claim c = Claim.builder().warranty(warranty).part(req.getPart().trim().toUpperCase()).description(req.getDescription().trim()).costEstimate(req.getCostEstimate())
                .status(rejection == null ? "UNDER_REVIEW" : "REJECTED").decisionNote(rejection == null ? null : "Auto-rejected: " + rejection).build();
        return dto(claims.save(c));
    }

    public ClaimDto.Response action(Long id, String action, String note) {
        Claim c = claims.findById(id).orElseThrow(() -> new ResourceNotFoundException("Claim", id));
        if ("settle".equals(action)) {
            if (!"APPROVED".equals(c.getStatus())) throw new BusinessRuleException("INVALID_CLAIM_STATE", "Only approved claims can be settled");
            c.setStatus("SETTLED");
        } else {
            if (!"UNDER_REVIEW".equals(c.getStatus())) throw new BusinessRuleException("INVALID_CLAIM_STATE", "Claim is not under review");
            if ("reject".equals(action) && (note == null || note.isBlank())) throw new BusinessRuleException("NOTE_REQUIRED", "A note is required to reject a claim");
            c.setStatus("approve".equals(action) ? "APPROVED" : "REJECTED");
            c.setDecisionNote(note);
        }
        return dto(c);
    }

    private ClaimDto.Response dto(Claim c) {
        Vehicle v = c.getWarranty().getVehicle();
        return ClaimDto.Response.builder().id(c.getId()).warrantyId(c.getWarranty().getId()).part(c.getPart()).description(c.getDescription()).costEstimate(c.getCostEstimate()).status(c.getStatus()).decisionNote(c.getDecisionNote()).createdAt(c.getCreatedAt()).vehicleVin(v.getVin()).customerName(v.getOwner() == null ? null : v.getOwner().getName()).build();
    }
}

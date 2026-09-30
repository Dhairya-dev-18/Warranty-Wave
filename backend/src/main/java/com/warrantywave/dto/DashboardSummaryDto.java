package com.warrantywave.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Map;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DashboardSummaryDto {
    private Map<String, Long> claimsByStatus;
    private long totalClaims;
    private int approvalRate;
    private long activeContracts;
    private double outstandingLoans;
    private long overdueEmis;
    private long pendingCreditReviews;
}

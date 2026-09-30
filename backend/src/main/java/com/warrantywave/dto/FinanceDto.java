package com.warrantywave.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;
import java.time.LocalDate;
import java.util.List;

public class FinanceDto {

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class Reason {
        private String factor;
        private int points;
        private String note;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ApplicationRequest {
        @NotNull
        private Long vehicleId;

        @NotBlank
        private String type; // LOAN or LEASE

        @NotNull
        @Min(1)
        private Double amount;

        @NotNull
        @Min(0)
        private Double downPayment;

        @NotNull
        private Integer tenureMonths;

        @NotNull
        @Min(1)
        private Double monthlyIncome;

        @NotNull
        @Min(0)
        private Double existingEmi;

        @NotNull
        @Min(300)
        @Max(900)
        private Integer creditHistoryScore;

        private boolean stableIncome;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class DecisionRequest {
        private boolean approve;
        private String note;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class ApplicationResponse {
        private Long id;
        private Long customerId;
        private Long vehicleId;
        private String type;
        private double amount;
        private double downPayment;
        private int tenureMonths;
        private double monthlyIncome;
        private double existingEmi;
        private int creditHistoryScore;
        private boolean stableIncome;
        private int score;
        private String riskBand;
        private String decision;
        private List<Reason> reasons;
        private String decisionNote;
        private String status;
        private Instant createdAt;
        private String vehicleVin;
        private String customerName;
        private Long contractId;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class ContractResponse {
        private Long id;
        private Long applicationId;
        private double principal;
        private double interestRate;
        private int tenureMonths;
        private double emi;
        private LocalDate startDate;
        private String status;
        private String vehicleVin;
        private int paidCount;
        private double outstanding;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class ScheduleResponse {
        private Long id;
        private Long contractId;
        private int installmentNo;
        private LocalDate dueDate;
        private double principalPart;
        private double interestPart;
        private double amount;
        private double lateFee;
        private String status;
        private LocalDate paidDate;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class PayResponse {
        private double paid;
        private ContractResponse contract;
    }
}

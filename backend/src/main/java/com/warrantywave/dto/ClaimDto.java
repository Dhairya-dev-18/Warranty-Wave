package com.warrantywave.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;

public class ClaimDto {

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class CreateRequest {
        @NotNull
        private Long warrantyId;

        @NotBlank
        private String part;

        @NotNull
        @Min(1)
        private Double costEstimate;

        @NotBlank
        private String description;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ActionRequest {
        private String note;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class Response {
        private Long id;
        private Long warrantyId;
        private String part;
        private String description;
        private double costEstimate;
        private String status;
        private String decisionNote;
        private Instant createdAt;
        private String vehicleVin;
        private String customerName;
    }
}

package com.warrantywave.dto;

import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

public class WarrantyDto {

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class CreateRequest {
        @NotNull
        private Long vehicleId;

        @NotNull
        private Long planId;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class Response {
        private Long id;
        private Long vehicleId;
        private Long planId;
        private LocalDate startDate;
        private LocalDate endDate;
        private String status;
        private String vehicleVin;
        private String vehicleName;
        private String planName;
        private String coveredParts;
    }
}

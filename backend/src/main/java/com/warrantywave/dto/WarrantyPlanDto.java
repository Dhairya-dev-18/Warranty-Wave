package com.warrantywave.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class WarrantyPlanDto {
    private Long id;

    @NotBlank
    private String name;

    @Min(1)
    private int durationMonths;

    @Min(1)
    private int kmLimit;

    @NotBlank
    private String coveredParts;

    @Min(0)
    private double price;
}

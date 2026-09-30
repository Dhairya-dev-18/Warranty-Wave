package com.warrantywave.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class VehicleDto {
    private Long id;

    @NotBlank
    @Pattern(regexp = "^[A-HJ-NPR-Za-hj-npr-z0-9]{17}$", message = "Enter a valid 17-character VIN")
    private String vin;

    @NotBlank
    private String make;

    @NotBlank
    private String model;

    @Min(1990)
    @Max(2100)
    private int year;

    @Min(0)
    private int currentMileage;

    private Long ownerId;
}

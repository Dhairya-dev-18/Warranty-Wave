package com.warrantywave.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RateConfigDto {

    @NotNull
    @Min(0)
    private Double bandA;

    @NotNull
    @Min(0)
    private Double bandB;

    @NotNull
    @Min(0)
    private Double bandC;

    @NotNull
    @Min(0)
    private Integer approveThreshold;

    @NotNull
    @Min(0)
    private Integer reviewThreshold;

    @NotNull
    @Min(0)
    private Double lateFeePercent;
}

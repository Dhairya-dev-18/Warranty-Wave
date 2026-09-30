package com.warrantywave.model;

import com.warrantywave.common.audit.BaseEntity;
import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "rate_config")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RateConfig extends BaseEntity {

    @Column(name = "band_a", nullable = false)
    private double bandA;

    @Column(name = "band_b", nullable = false)
    private double bandB;

    @Column(name = "band_c", nullable = false)
    private double bandC;

    @Column(name = "approve_threshold", nullable = false)
    private int approveThreshold;

    @Column(name = "review_threshold", nullable = false)
    private int reviewThreshold;

    @Column(name = "late_fee_percent", nullable = false)
    private double lateFeePercent;
}

package com.warrantywave.model;

import com.warrantywave.common.audit.BaseEntity;
import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "warranty_plan")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class WarrantyPlan extends BaseEntity {

    @Column(nullable = false, unique = true, length = 100)
    private String name;

    @Column(name = "duration_months", nullable = false)
    private int durationMonths;

    @Column(name = "km_limit", nullable = false)
    private int kmLimit;

    @Column(name = "covered_parts", nullable = false, length = 500)
    private String coveredParts;

    @Column(nullable = false)
    private double price;

    @Builder.Default
    @Column(nullable = false)
    private boolean active = true;
}

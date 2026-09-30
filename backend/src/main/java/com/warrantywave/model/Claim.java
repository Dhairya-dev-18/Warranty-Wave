package com.warrantywave.model;

import com.warrantywave.common.audit.BaseEntity;
import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "warranty_claim")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Claim extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "policy_id", nullable = false)
    private Warranty warranty;

    @Column(nullable = false, length = 60)
    private String part;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(name = "repair_cost", nullable = false)
    private double costEstimate;

    @Builder.Default
    @Column(nullable = false, length = 30)
    private String status = "UNDER_REVIEW";

    @Column(name = "decision_reason", columnDefinition = "TEXT")
    private String decisionNote;
}

package com.warrantywave.model;

import com.warrantywave.common.audit.BaseEntity;
import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "finance_application")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class FinanceApplication extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "customer_id", nullable = false)
    private User customer;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "vehicle_id", nullable = false)
    private Vehicle vehicle;

    @Column(name = "product_type", nullable = false, length = 20)
    private String type;

    @Column(nullable = false)
    private double amount;

    @Column(name = "down_payment", nullable = false)
    private double downPayment;

    @Column(name = "tenure_months", nullable = false)
    private int tenureMonths;

    @Column(name = "monthly_income", nullable = false)
    private double monthlyIncome;

    @Column(name = "existing_emi", nullable = false)
    private double existingEmi;

    @Column(name = "credit_history_score", nullable = false)
    private int creditHistoryScore;

    @Column(name = "stable_income", nullable = false)
    private boolean stableIncome;

    @Column(nullable = false)
    private int score;

    @Column(name = "risk_band", nullable = false, length = 10)
    private String riskBand;

    @Column(nullable = false, length = 20)
    private String decision;

    @Column(name = "decision_note", columnDefinition = "TEXT")
    private String decisionNote;

    @Column(nullable = false, length = 30)
    private String status;

    @Column(name = "reasons_json", columnDefinition = "TEXT")
    private String reasonsJson;
}

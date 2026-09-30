package com.warrantywave.model;

import com.warrantywave.common.audit.BaseEntity;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDate;

@Entity
@Table(name = "finance_contract")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class FinanceContract extends BaseEntity {

    @OneToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "application_id", nullable = false, unique = true)
    private FinanceApplication application;

    @Column(nullable = false)
    private double principal;

    @Column(name = "interest_rate", nullable = false)
    private double interestRate;

    @Column(name = "tenure_months", nullable = false)
    private int tenureMonths;

    @Column(nullable = false)
    private double emi;

    @Column(name = "start_date", nullable = false)
    private LocalDate startDate;

    @Builder.Default
    @Column(nullable = false, length = 30)
    private String status = "ACTIVE";
}

package com.warrantywave.model;

import com.warrantywave.common.audit.BaseEntity;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDate;

@Entity
@Table(name = "repayment_schedule", indexes = {
    @Index(name = "idx_schedule_contract", columnList = "contract_id"),
    @Index(name = "idx_schedule_status", columnList = "status")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RepaymentSchedule extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "contract_id", nullable = false)
    private FinanceContract contract;

    @Column(name = "installment_no", nullable = false)
    private int installmentNo;

    @Column(name = "due_date", nullable = false)
    private LocalDate dueDate;

    @Column(name = "principal_part", nullable = false)
    private double principalPart;

    @Column(name = "interest_part", nullable = false)
    private double interestPart;

    @Column(nullable = false)
    private double amount;

    @Builder.Default
    @Column(name = "late_fee", nullable = false)
    private double lateFee = 0.0;

    @Builder.Default
    @Column(nullable = false, length = 20)
    private String status = "PENDING";

    @Column(name = "paid_date")
    private LocalDate paidDate;
}

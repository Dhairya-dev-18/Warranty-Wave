package com.warrantywave.repository;

import com.warrantywave.model.RepaymentSchedule;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface RepaymentScheduleRepository extends JpaRepository<RepaymentSchedule, Long> {
    List<RepaymentSchedule> findByContractIdOrderByInstallmentNoAsc(Long contractId);
    List<RepaymentSchedule> findByContractId(Long contractId);
    long countByStatus(String status);
}

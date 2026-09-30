package com.warrantywave.repository;

import com.warrantywave.model.FinanceContract;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface FinanceContractRepository extends JpaRepository<FinanceContract, Long> {

    @Query("SELECT c FROM FinanceContract c JOIN FETCH c.application a JOIN FETCH a.vehicle v JOIN FETCH a.customer cust WHERE cust.id = :customerId ORDER BY c.id DESC")
    List<FinanceContract> findByCustomerIdWithDetails(@Param("customerId") Long customerId);

    @Query("SELECT c FROM FinanceContract c JOIN FETCH c.application a JOIN FETCH a.vehicle v JOIN FETCH a.customer cust ORDER BY c.id DESC")
    List<FinanceContract> findAllWithDetails();

    Optional<FinanceContract> findByApplicationId(Long applicationId);

    List<FinanceContract> findByStatus(String status);
}

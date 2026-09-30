package com.warrantywave.repository;

import com.warrantywave.model.FinanceApplication;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface FinanceApplicationRepository extends JpaRepository<FinanceApplication, Long> {

    @Query("SELECT a FROM FinanceApplication a JOIN FETCH a.customer c JOIN FETCH a.vehicle v ORDER BY a.id DESC")
    List<FinanceApplication> findAllWithDetails();

    @Query("SELECT a FROM FinanceApplication a JOIN FETCH a.customer c JOIN FETCH a.vehicle v WHERE a.status = :status ORDER BY a.id DESC")
    List<FinanceApplication> findByStatusWithDetails(@Param("status") String status);

    @Query("SELECT a FROM FinanceApplication a JOIN FETCH a.customer c JOIN FETCH a.vehicle v WHERE a.customer.id = :customerId ORDER BY a.id DESC")
    List<FinanceApplication> findByCustomerIdWithDetails(@Param("customerId") Long customerId);

    @Query("SELECT a FROM FinanceApplication a JOIN FETCH a.customer c JOIN FETCH a.vehicle v WHERE a.customer.id = :customerId AND a.status = :status ORDER BY a.id DESC")
    List<FinanceApplication> findByCustomerIdAndStatusWithDetails(@Param("customerId") Long customerId, @Param("status") String status);

    long countByStatus(String status);
}

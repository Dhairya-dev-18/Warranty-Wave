package com.warrantywave.repository;

import com.warrantywave.model.Claim;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ClaimRepository extends JpaRepository<Claim, Long> {

    @Query("SELECT c FROM Claim c JOIN FETCH c.warranty w JOIN FETCH w.vehicle v JOIN FETCH v.owner u ORDER BY c.id DESC")
    List<Claim> findAllWithDetails();

    @Query("SELECT c FROM Claim c JOIN FETCH c.warranty w JOIN FETCH w.vehicle v JOIN FETCH v.owner u WHERE c.status = :status ORDER BY c.id DESC")
    List<Claim> findByStatusWithDetails(@Param("status") String status);

    @Query("SELECT c FROM Claim c JOIN FETCH c.warranty w JOIN FETCH w.vehicle v JOIN FETCH v.owner u WHERE v.owner.id = :customerId ORDER BY c.id DESC")
    List<Claim> findByCustomerIdWithDetails(@Param("customerId") Long customerId);

    @Query("SELECT c FROM Claim c JOIN FETCH c.warranty w JOIN FETCH w.vehicle v JOIN FETCH v.owner u WHERE v.owner.id = :customerId AND c.status = :status ORDER BY c.id DESC")
    List<Claim> findByCustomerIdAndStatusWithDetails(@Param("customerId") Long customerId, @Param("status") String status);

    long countByStatus(String status);
}

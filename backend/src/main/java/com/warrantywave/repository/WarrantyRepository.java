package com.warrantywave.repository;

import com.warrantywave.model.User;
import com.warrantywave.model.Warranty;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface WarrantyRepository extends JpaRepository<Warranty, Long> {
    List<Warranty> findByVehicleOwner(User owner);
    boolean existsByPlanId(Long planId);

    @Query("SELECT w FROM Warranty w JOIN FETCH w.vehicle v JOIN FETCH w.plan p")
    List<Warranty> findAllWithDetails();

    @Query("SELECT w FROM Warranty w JOIN FETCH w.vehicle v JOIN FETCH w.plan p WHERE v.owner.id = :ownerId")
    List<Warranty> findByOwnerIdWithDetails(@Param("ownerId") Long ownerId);
}

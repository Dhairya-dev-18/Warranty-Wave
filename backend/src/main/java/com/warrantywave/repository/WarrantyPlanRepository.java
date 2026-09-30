package com.warrantywave.repository;

import com.warrantywave.model.WarrantyPlan;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface WarrantyPlanRepository extends JpaRepository<WarrantyPlan, Long> {
    Optional<WarrantyPlan> findByName(String name);
    boolean existsByName(String name);
}

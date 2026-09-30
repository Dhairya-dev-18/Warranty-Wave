package com.warrantywave.repository;

import com.warrantywave.model.User;
import com.warrantywave.model.Vehicle;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface VehicleRepository extends JpaRepository<Vehicle, Long> {
    List<Vehicle> findByOwner(User owner);
    boolean existsByVin(String vin);
    Optional<Vehicle> findByVin(String vin);
}

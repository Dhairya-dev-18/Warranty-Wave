package com.warrantywave.repository;

import com.warrantywave.model.RateConfig;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface RateConfigRepository extends JpaRepository<RateConfig, Long> {
}

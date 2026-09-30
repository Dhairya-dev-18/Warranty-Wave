package com.warrantywave.model;

import com.warrantywave.common.audit.BaseEntity;
import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "vehicle")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Vehicle extends BaseEntity {

    @Column(nullable = false, unique = true, length = 17)
    private String vin;

    @Column(nullable = false, length = 60)
    private String make;

    @Column(nullable = false, length = 60)
    private String model;

    @Column(name = "model_year", nullable = false)
    private int year;

    @Column(name = "odometer_km", nullable = false)
    private int currentMileage;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "customer_id")
    private User owner;
}

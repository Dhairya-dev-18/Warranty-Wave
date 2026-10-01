package com.warrantywave.service;

import com.warrantywave.common.exception.BusinessRuleException;
import com.warrantywave.common.exception.ResourceNotFoundException;
import com.warrantywave.dto.VehicleDto;
import com.warrantywave.dto.WarrantyDto;
import com.warrantywave.dto.WarrantyPlanDto;
import com.warrantywave.model.*;
import com.warrantywave.repository.*;
import com.warrantywave.security.UserPrincipal;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.time.LocalDate;
import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional
public class WarrantyService {
    private final UserRepository users;
    private final VehicleRepository vehicles;
    private final WarrantyPlanRepository plans;
    private final WarrantyRepository warranties;

    @Transactional(readOnly = true)
    public List<VehicleDto> vehicles(UserPrincipal actor) {
        User owner = users.findById(actor.getId()).orElseThrow(() -> new ResourceNotFoundException("User", actor.getId()));
        return vehicles.findByOwner(owner).stream().map(v -> VehicleDto.builder().id(v.getId()).vin(v.getVin()).make(v.getMake()).model(v.getModel()).year(v.getYear()).currentMileage(v.getCurrentMileage()).ownerId(owner.getId()).build()).toList();
    }

    public VehicleDto addVehicle(VehicleDto dto, UserPrincipal actor) {
        if (vehicles.existsByVin(dto.getVin().toUpperCase())) throw new BusinessRuleException("VIN_EXISTS", "A vehicle with this VIN already exists");
        User owner = users.findById(actor.getId()).orElseThrow(() -> new ResourceNotFoundException("User", actor.getId()));
        Vehicle v = Vehicle.builder().vin(dto.getVin().toUpperCase()).make(dto.getMake().trim()).model(dto.getModel().trim()).year(dto.getYear()).currentMileage(dto.getCurrentMileage()).owner(owner).build();
        v = vehicles.save(v);
        return VehicleDto.builder().id(v.getId()).vin(v.getVin()).make(v.getMake()).model(v.getModel()).year(v.getYear()).currentMileage(v.getCurrentMileage()).ownerId(owner.getId()).build();
    }

    @Transactional(readOnly = true)
    public List<WarrantyPlanDto> plans() {
        return plans.findAll().stream().filter(WarrantyPlan::isActive).map(this::planDto).toList();
    }

    public WarrantyPlanDto savePlan(Long id, WarrantyPlanDto dto) {
        WarrantyPlan p = id == null ? new WarrantyPlan() : plans.findById(id).orElseThrow(() -> new ResourceNotFoundException("Warranty plan", id));
        plans.findByName(dto.getName()).filter(x -> !x.getId().equals(id)).ifPresent(x -> { throw new BusinessRuleException("PLAN_NAME_EXISTS", "A plan with this name already exists"); });
        p.setName(dto.getName().trim()); p.setDurationMonths(dto.getDurationMonths()); p.setKmLimit(dto.getKmLimit()); p.setCoveredParts(dto.getCoveredParts().trim()); p.setPrice(dto.getPrice()); p.setActive(true);
        return planDto(plans.save(p));
    }

    public void deletePlan(Long id) {
        WarrantyPlan p = plans.findById(id).orElseThrow(() -> new ResourceNotFoundException("Warranty plan", id));
        if (warranties.existsByPlanId(id)) throw new BusinessRuleException("PLAN_IN_USE", "Plan is in use by a warranty and cannot be deleted");
        plans.delete(p);
    }

    @Transactional(readOnly = true)
    public List<WarrantyDto.Response> warranties(UserPrincipal actor) {
        boolean admin = actor.getAuthorities().stream().anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"));
        List<Warranty> rows = admin ? warranties.findAllWithDetails() : warranties.findByOwnerIdWithDetails(actor.getId());
        return rows.stream().map(this::warrantyDto).toList();
    }

    public WarrantyDto.Response createWarranty(WarrantyDto.CreateRequest request, UserPrincipal actor) {
        Vehicle vehicle = vehicles.findById(request.getVehicleId()).orElseThrow(() -> new ResourceNotFoundException("Vehicle", request.getVehicleId()));
        if (vehicle.getOwner() == null || !vehicle.getOwner().getId().equals(actor.getId())) throw new BusinessRuleException("VEHICLE_FORBIDDEN", "You can only attach a warranty to your own vehicle");
        WarrantyPlan plan = plans.findById(request.getPlanId()).orElseThrow(() -> new ResourceNotFoundException("Warranty plan", request.getPlanId()));
        if (!plan.isActive()) throw new BusinessRuleException("PLAN_INACTIVE", "This warranty plan is no longer available");
        LocalDate start = LocalDate.now();
        Warranty w = warranties.save(Warranty.builder().vehicle(vehicle).plan(plan).startDate(start).endDate(start.plusMonths(plan.getDurationMonths())).status("ACTIVE").build());
        return warrantyDto(w);
    }

    private WarrantyPlanDto planDto(WarrantyPlan p) {
        return WarrantyPlanDto.builder().id(p.getId()).name(p.getName()).durationMonths(p.getDurationMonths()).kmLimit(p.getKmLimit()).coveredParts(p.getCoveredParts()).price(p.getPrice()).build();
    }

    private WarrantyDto.Response warrantyDto(Warranty w) {
        Vehicle v = w.getVehicle(); WarrantyPlan p = w.getPlan();
        return WarrantyDto.Response.builder().id(w.getId()).vehicleId(v.getId()).planId(p.getId()).startDate(w.getStartDate()).endDate(w.getEndDate()).status(w.getStatus()).vehicleVin(v.getVin()).vehicleName(v.getMake()+" "+v.getModel()).planName(p.getName()).coveredParts(p.getCoveredParts()).build();
    }
}

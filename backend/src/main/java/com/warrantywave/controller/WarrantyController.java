package com.warrantywave.controller;

import com.warrantywave.dto.VehicleDto;
import com.warrantywave.dto.WarrantyDto;
import com.warrantywave.dto.WarrantyPlanDto;
import com.warrantywave.security.UserPrincipal;
import com.warrantywave.service.WarrantyService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class WarrantyController {
    private final WarrantyService service;

    @GetMapping("/vehicles")
    @PreAuthorize("hasAnyRole('CUSTOMER','DEALER')")
    public List<VehicleDto> vehicles(@AuthenticationPrincipal UserPrincipal actor) { return service.vehicles(actor); }

    @PostMapping("/vehicles")
    @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize("hasAnyRole('CUSTOMER','DEALER')")
    public VehicleDto addVehicle(@Valid @RequestBody VehicleDto dto, @AuthenticationPrincipal UserPrincipal actor) { return service.addVehicle(dto, actor); }

    @GetMapping("/warranty-plans")
    public List<WarrantyPlanDto> plans() { return service.plans(); }

    @PostMapping("/warranty-plans")
    @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize("hasRole('ADMIN')")
    public WarrantyPlanDto addPlan(@Valid @RequestBody WarrantyPlanDto dto) { return service.savePlan(null, dto); }

    @PutMapping("/warranty-plans/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public WarrantyPlanDto updatePlan(@PathVariable Long id, @Valid @RequestBody WarrantyPlanDto dto) { return service.savePlan(id, dto); }

    @DeleteMapping("/warranty-plans/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @PreAuthorize("hasRole('ADMIN')")
    public void deletePlan(@PathVariable Long id) { service.deletePlan(id); }

    @GetMapping("/warranties")
    @PreAuthorize("hasAnyRole('CUSTOMER','DEALER','ADMIN')")
    public List<WarrantyDto.Response> warranties(@AuthenticationPrincipal UserPrincipal actor) { return service.warranties(actor); }

    @PostMapping("/warranties")
    @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize("hasAnyRole('CUSTOMER','DEALER')")
    public WarrantyDto.Response createWarranty(@Valid @RequestBody WarrantyDto.CreateRequest request, @AuthenticationPrincipal UserPrincipal actor) { return service.createWarranty(request, actor); }
}

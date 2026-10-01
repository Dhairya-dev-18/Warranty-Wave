package com.warrantywave.controller;

import com.warrantywave.dto.AuthDto;
import com.warrantywave.dto.DashboardSummaryDto;
import com.warrantywave.dto.RateConfigDto;
import com.warrantywave.service.AdminService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class AdminController {
    private final AdminService service;

    @GetMapping("/users")
    @PreAuthorize("hasRole('ADMIN')")
    public List<AuthDto.UserResponse> users() { return service.users(); }

    @PutMapping("/users/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public void updateRole(@PathVariable Long id, @Valid @RequestBody AuthDto.UpdateRoleRequest request) { service.updateRole(id, request); }

    @GetMapping("/config/rates")
    @PreAuthorize("hasRole('ADMIN')")
    public RateConfigDto rates() { return service.rates(); }

    @PutMapping("/config/rates")
    @PreAuthorize("hasRole('ADMIN')")
    public RateConfigDto saveRates(@Valid @RequestBody RateConfigDto dto) { return service.saveRates(dto); }

    @GetMapping("/dashboard/summary")
    @PreAuthorize("hasAnyRole('ADJUSTER','CREDIT_OFFICER','ADMIN')")
    public DashboardSummaryDto dashboard() { return service.dashboard(); }
}

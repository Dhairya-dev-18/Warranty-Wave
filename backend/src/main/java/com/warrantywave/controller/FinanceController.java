package com.warrantywave.controller;

import com.warrantywave.dto.FinanceDto;
import com.warrantywave.security.UserPrincipal;
import com.warrantywave.service.FinanceService;
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
public class FinanceController {
    private final FinanceService service;

    @GetMapping("/finance/applications")
    @PreAuthorize("hasAnyRole('CUSTOMER','CREDIT_OFFICER','ADMIN')")
    public List<FinanceDto.ApplicationResponse> list(@RequestParam(required=false) String status, @AuthenticationPrincipal UserPrincipal actor) { return service.list(status, actor); }

    @GetMapping("/finance/applications/{id}")
    @PreAuthorize("hasAnyRole('CREDIT_OFFICER','ADMIN')")
    public FinanceDto.ApplicationResponse get(@PathVariable Long id) { return service.get(id); }

    @PostMapping("/finance/applications")
    @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize("hasRole('CUSTOMER')")
    public FinanceDto.ApplicationResponse create(@Valid @RequestBody FinanceDto.ApplicationRequest request, @AuthenticationPrincipal UserPrincipal actor) { return service.create(request, actor); }

    @PutMapping("/finance/applications/{id}/decision")
    @PreAuthorize("hasRole('CREDIT_OFFICER')")
    public FinanceDto.ApplicationResponse decision(@PathVariable Long id, @RequestBody FinanceDto.DecisionRequest request) { return service.decide(id, request); }

    @GetMapping("/contracts/{id}")
    @PreAuthorize("hasAnyRole('CUSTOMER','ADMIN')")
    public FinanceDto.ContractResponse contract(@PathVariable Long id, @AuthenticationPrincipal UserPrincipal actor) { return service.contract(id, actor); }

    @GetMapping("/contracts/{id}/schedule")
    @PreAuthorize("hasAnyRole('CUSTOMER','ADMIN')")
    public List<FinanceDto.ScheduleResponse> schedule(@PathVariable Long id, @AuthenticationPrincipal UserPrincipal actor) { return service.schedule(id, actor); }

    @PostMapping("/contracts/{id}/pay")
    @PreAuthorize("hasRole('CUSTOMER')")
    public FinanceDto.PayResponse pay(@PathVariable Long id, @AuthenticationPrincipal UserPrincipal actor) { return service.pay(id, actor); }
}

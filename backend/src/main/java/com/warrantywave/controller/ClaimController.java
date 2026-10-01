package com.warrantywave.controller;

import com.warrantywave.dto.ClaimDto;
import com.warrantywave.security.UserPrincipal;
import com.warrantywave.service.ClaimService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/claims")
@RequiredArgsConstructor
public class ClaimController {
    private final ClaimService service;

    @GetMapping
    @PreAuthorize("hasAnyRole('CUSTOMER','DEALER','ADJUSTER','ADMIN')")
    public List<ClaimDto.Response> list(@RequestParam(required = false) String status, @AuthenticationPrincipal UserPrincipal actor) { return service.list(status, actor); }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize("hasAnyRole('CUSTOMER','DEALER')")
    public ClaimDto.Response create(@Valid @RequestBody ClaimDto.CreateRequest request, @AuthenticationPrincipal UserPrincipal actor) { return service.create(request, actor); }

    @PutMapping("/{id}/{action:approve|reject|settle}")
    @PreAuthorize("hasRole('ADJUSTER')")
    public ClaimDto.Response action(@PathVariable Long id, @PathVariable String action, @RequestBody(required = false) ClaimDto.ActionRequest request) {
        return service.action(id, action, request == null ? null : request.getNote());
    }
}

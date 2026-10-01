package com.warrantywave.service;

import com.warrantywave.common.exception.BusinessRuleException;
import com.warrantywave.dto.AuthDto;
import com.warrantywave.model.Role;
import com.warrantywave.model.User;
import com.warrantywave.repository.UserRepository;
import com.warrantywave.security.JwtService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Transactional
public class AuthService {
    private final UserRepository users;
    private final PasswordEncoder passwords;
    private final JwtService jwt;

    public AuthDto.SessionResponse login(AuthDto.LoginRequest request) {
        User user = users.findByEmail(request.getEmail()).orElseThrow(() -> new BusinessRuleException("INVALID_CREDENTIALS", "Invalid email or password"));
        if (!user.isEnabled() || !passwords.matches(request.getPassword(), user.getPassword()))
            throw new BusinessRuleException("INVALID_CREDENTIALS", "Invalid email or password");
        return AuthDto.SessionResponse.builder().token(jwt.generateToken(user)).id(user.getId()).name(user.getName()).email(user.getEmail()).role(user.getRole()).build();
    }

    public void register(AuthDto.RegisterRequest request) {
        if (request.getRole() != Role.CUSTOMER && request.getRole() != Role.DEALER)
            throw new BusinessRuleException("ROLE_NOT_ALLOWED", "Public registration is limited to customer and dealer accounts");
        String email = request.getEmail().trim().toLowerCase();
        if (users.existsByEmail(email)) throw new BusinessRuleException("EMAIL_EXISTS", "Email already registered");
        users.save(User.builder().name(request.getName().trim()).email(email).password(passwords.encode(request.getPassword())).role(request.getRole()).enabled(true).build());
    }
}

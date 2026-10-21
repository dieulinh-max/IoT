package com.iot.service;

import com.iot.dto.AuthResponse;
import com.iot.dto.LoginRequest;
import com.iot.dto.RegisterRequest;
import com.iot.entity.User;
import com.iot.repository.UserRepository;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AuthService {
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    public AuthService(UserRepository userRepository, PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Transactional
    public AuthResponse register(RegisterRequest request) {
        if (request.getName() == null || request.getName().trim().isEmpty()
                || request.getMsv() == null || request.getMsv().trim().isEmpty()
                || request.getPassword() == null || request.getPassword().length() < 6
                || request.getDate() == null) {
            throw new IllegalArgumentException("Vui lòng nhập đầy đủ thông tin; mật khẩu tối thiểu 6 ký tự.");
        }

        String msv = request.getMsv().trim();
        if (userRepository.existsByMsvIgnoreCase(msv)) {
            throw new IllegalArgumentException("Mã sinh viên đã được đăng ký.");
        }

        User user = new User();
        user.setName(request.getName().trim());
        user.setMsv(msv);
        // Existing schema has Username as required/unique; use MSV as username.
        user.setUsername(msv);
        user.setDate(request.getDate());
        user.setPassword(passwordEncoder.encode(request.getPassword()));
        User saved = userRepository.save(user);

        return new AuthResponse("Đăng ký thành công.", saved.getId(),
                saved.getName(), saved.getMsv(),
                saved.getDate() == null ? null : saved.getDate().toString());
    }

    public AuthResponse login(LoginRequest request) {
        if (request.getMsv() == null || request.getPassword() == null) {
            throw new IllegalArgumentException("Vui lòng nhập mã sinh viên và mật khẩu.");
        }

        User user = userRepository.findByMsvIgnoreCase(request.getMsv().trim())
                .orElseThrow(() -> new IllegalArgumentException("Mã sinh viên hoặc mật khẩu không đúng."));

        if (!passwordEncoder.matches(request.getPassword(), user.getPassword())) {
            throw new IllegalArgumentException("Mã sinh viên hoặc mật khẩu không đúng.");
        }

        return new AuthResponse("Đăng nhập thành công.", user.getId(),
                user.getName(), user.getMsv(),
                user.getDate() == null ? null : user.getDate().toString());
    }
}

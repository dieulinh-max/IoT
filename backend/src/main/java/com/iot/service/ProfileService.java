
package com.iot.service;

import com.iot.dto.ProfileResponse;
import com.iot.entity.User;
import com.iot.repository.UserRepository;

import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;

@Service
public class ProfileService {

    private final UserRepository userRepository;

    public ProfileService(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    public ProfileResponse getProfile(String studentId) {
        User user = userRepository.findByMsvIgnoreCase(studentId)
            .orElseThrow(() ->
                new RuntimeException("Không tìm thấy người dùng")
            );

        String dob = "";

        if (user.getDate() != null) {
            dob = user.getDate()
                .format(DateTimeFormatter.ofPattern("dd/MM/yyyy"));
        }

        return new ProfileResponse(
            user.getName(),
            user.getMsv(),
            dob
        );
    }
}

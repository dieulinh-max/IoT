
package com.iot.controller;

import com.iot.dto.ProfileResponse;
import com.iot.service.ProfileService;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/profile")
@CrossOrigin(origins = {
    "http://localhost:5173",
    "http://127.0.0.1:5173"
})
public class ProfileController {

    private final ProfileService profileService;

    public ProfileController(ProfileService profileService) {
        this.profileService = profileService;
    }

    @GetMapping
    public ResponseEntity<ProfileResponse> getProfile(
            @RequestParam String studentId) {

        return ResponseEntity.ok(
            profileService.getProfile(studentId)
        );
    }
}

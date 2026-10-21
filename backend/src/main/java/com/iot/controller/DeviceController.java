
package com.iot.controller;

import com.iot.dto.DeviceControlRequest;
import com.iot.dto.DeviceControlResponse;
import com.iot.dto.DeviceResponse;
import com.iot.service.DeviceService;

import jakarta.persistence.EntityNotFoundException;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.List;

@RestController
@RequestMapping("/api/devices")
@CrossOrigin(origins = {
    "http://localhost:5173",
    "http://127.0.0.1:5173"
})
public class DeviceController {

    private final DeviceService deviceService;

    public DeviceController(DeviceService deviceService) {
        this.deviceService = deviceService;
    }

    @GetMapping
    public ResponseEntity<List<DeviceResponse>> getDevices() {
        return ResponseEntity.ok(deviceService.getDevices());
    }

    // Dieu khien thiet bi dau ra theo ID trong bang Devices
    @PostMapping("/{deviceId}/control")
    public ResponseEntity<?> controlDevice(
            @PathVariable Integer deviceId,
            @RequestBody DeviceControlRequest request) {

        try {
            DeviceControlResponse response =
                deviceService.controlDevice(deviceId, request);

            HttpStatus httpStatus;

            if ("FAIL".equalsIgnoreCase(response.getStatus())) {
                httpStatus = HttpStatus.SERVICE_UNAVAILABLE;
            } else {
                httpStatus = HttpStatus.OK;
            }

            return ResponseEntity
                .status(httpStatus)
                .body(response);

        } catch (EntityNotFoundException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                .body(Map.of("error", e.getMessage()));

        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest()
                .body(Map.of("error", e.getMessage()));
        }
    }
}

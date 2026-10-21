package com.iot.controller;

import com.iot.dto.ActionHistoryRequest;
import com.iot.dto.ActionHistoryResponse;
import com.iot.service.ActionHistoryService;
import com.iot.util.ActionHistoryTimeRange;

import jakarta.persistence.EntityNotFoundException;
import jakarta.validation.Valid;

import org.springframework.data.domain.Page;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/action-history")
@CrossOrigin(origins = {
    "http://localhost:5173",
    "http://127.0.0.1:5173"
})
public class ActionHistoryController {

    private final ActionHistoryService service;

    public ActionHistoryController(ActionHistoryService service) {
        this.service = service;
    }

    @GetMapping
    public ResponseEntity<?> search(
            @RequestParam(required = false) String deviceName,
            @RequestParam(required = false) String action,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String startTime,
            @RequestParam(required = false) String endTime,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "50") int size) {

        if (page < 0 || size < 1 || size > 100) {
            return ResponseEntity.badRequest().body(Map.of(
                "error",
                "page phải >= 0 và size phải từ 1 đến 100"
            ));
        }

        try {
            ActionHistoryTimeRange.Range range =
                ActionHistoryTimeRange.parse(startTime, endTime);

            Page<ActionHistoryResponse> result = service.search(
                deviceName,
                action,
                status,
                range.startTime(),
                range.endTime(),
                page,
                size
            );

            return ResponseEntity.ok(result);

        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of(
                "error", e.getMessage()
            ));
        }
    }

    @PostMapping
    public ResponseEntity<?> create(
            @Valid @RequestBody ActionHistoryRequest request) {

        try {
            ActionHistoryResponse result = service.create(request);

            return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(result);

        } catch (EntityNotFoundException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(
                Map.of("error", e.getMessage())
            );

        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(
                Map.of("error", e.getMessage())
            );
        }
    }
}

package com.iot.controller;

import com.iot.dto.SensorDataResponse;
import com.iot.service.SensorDataService;
import com.iot.util.ActionHistoryTimeRange;

import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/sensor-data")
@CrossOrigin(origins = {
    "http://localhost:5173",
    "http://127.0.0.1:5173"
})
public class SensorDataController {

    private final SensorDataService service;

    public SensorDataController(SensorDataService service) {
        this.service = service;
    }

    // Chi tim kiem khi frontend gui request
    @GetMapping
    public ResponseEntity<?> search(
            @RequestParam(required = false) String sensorName,
            @RequestParam(required = false) String startTime,
            @RequestParam(required = false) String endTime,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {

        if (page < 0 || size < 1 || size > 100) {
            return ResponseEntity.badRequest().body(Map.of(
                "error",
                "page phai >= 0 va size phai tu 1 den 100"
            ));
        }

        try {
            // Dung chung bo xu ly thoi gian voi Action History
            ActionHistoryTimeRange.Range range =
                ActionHistoryTimeRange.parse(startTime, endTime);

            Page<SensorDataResponse> result = service.search(
                sensorName,
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
}


package com.iot.controller;

import com.iot.dto.DashboardResponse;
import com.iot.dto.DashboardChartResponse;
import com.iot.service.DashboardService;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/dashboard")
@CrossOrigin(origins = {
    "http://localhost:5173",
    "http://127.0.0.1:5173"
})
public class DashboardController {

    private final DashboardService dashboardService;

    public DashboardController(DashboardService dashboardService) {
        this.dashboardService = dashboardService;
    }

    @GetMapping("/summary")
    public ResponseEntity<DashboardResponse> getSummary() {
        return ResponseEntity.ok(
            dashboardService.getSummary()
        );
    }

    @GetMapping("/chart")
    public ResponseEntity<?> getChart(
            @RequestParam(defaultValue = "20") int limit) {
        try {
            List<DashboardChartResponse> result =
                dashboardService.getChart(limit);

            return ResponseEntity.ok(result);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(
                Map.of("error", e.getMessage())
            );
        }
    }
}

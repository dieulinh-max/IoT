
package com.iot.dto;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public class DashboardChartResponse {

    private LocalDateTime time;
    private BigDecimal temperature;
    private BigDecimal humidity;
    private BigDecimal light;

    public DashboardChartResponse(
            LocalDateTime time,
            BigDecimal temperature,
            BigDecimal humidity,
            BigDecimal light) {
        this.time = time;
        this.temperature = temperature;
        this.humidity = humidity;
        this.light = light;
    }

    public LocalDateTime getTime() {
        return time;
    }

    public BigDecimal getTemperature() {
        return temperature;
    }

    public BigDecimal getHumidity() {
        return humidity;
    }

    public BigDecimal getLight() {
        return light;
    }
}


package com.iot.dto;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public class DashboardResponse {

    private SensorValue temperature;
    private SensorValue humidity;
    private SensorValue light;
    private LocalDateTime updatedAt;

    public DashboardResponse(
            SensorValue temperature,
            SensorValue humidity,
            SensorValue light,
            LocalDateTime updatedAt) {
        this.temperature = temperature;
        this.humidity = humidity;
        this.light = light;
        this.updatedAt = updatedAt;
    }

    public SensorValue getTemperature() {
        return temperature;
    }

    public SensorValue getHumidity() {
        return humidity;
    }

    public SensorValue getLight() {
        return light;
    }

    public LocalDateTime getUpdatedAt() {
        return updatedAt;
    }

    public static class SensorValue {

        private String sensorName;
        private BigDecimal value;
        private String unit;
        private LocalDateTime time;

        public SensorValue(
                String sensorName,
                BigDecimal value,
                String unit,
                LocalDateTime time) {
            this.sensorName = sensorName;
            this.value = value;
            this.unit = unit;
            this.time = time;
        }

        public String getSensorName() {
            return sensorName;
        }

        public BigDecimal getValue() {
            return value;
        }

        public String getUnit() {
            return unit;
        }

        public LocalDateTime getTime() {
            return time;
        }
    }
}

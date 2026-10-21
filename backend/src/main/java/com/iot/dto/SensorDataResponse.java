
package com.iot.dto;

import com.iot.entity.SensorData;
import java.math.BigDecimal;
import java.time.LocalDateTime;

public class SensorDataResponse {

    private Integer id;
    private Integer sensorId;
    private String sensor;
    private BigDecimal value;
    private String unit;
    private LocalDateTime time;

    public SensorDataResponse(SensorData data) {
        this.id = data.getId();
        this.value = data.getValue();
        this.time = data.getCreatedAt();

        if (data.getSensor() != null) {
            this.sensorId = data.getSensor().getId();
            this.sensor = data.getSensor().getName();
            this.unit = data.getSensor().getUnit();
        }
    }

    public Integer getId() {
        return id;
    }

    public Integer getSensorId() {
        return sensorId;
    }

    public String getSensor() {
        return sensor;
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

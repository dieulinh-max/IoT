
package com.iot.dto;

import com.iot.entity.ActionHistory.ActionType;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;

public class ActionHistoryRequest {

    @NotNull
    @Positive
    private Integer userId;

    @NotNull
    @Positive
    private Integer deviceId;

    @NotNull
    @Positive
    private Integer sensorId;

    @NotNull
    private ActionType action;

    public Integer getUserId() {
        return userId;
    }

    public void setUserId(Integer userId) {
        this.userId = userId;
    }

    public Integer getDeviceId() {
        return deviceId;
    }

    public void setDeviceId(Integer deviceId) {
        this.deviceId = deviceId;
    }

    public Integer getSensorId() {
        return sensorId;
    }

    public void setSensorId(Integer sensorId) {
        this.sensorId = sensorId;
    }

    public ActionType getAction() {
        return action;
    }

    public void setAction(ActionType action) {
        this.action = action;
    }
}

package com.iot.dto;

import com.iot.entity.ActionHistory;
import java.time.LocalDateTime;

public class ActionHistoryResponse {

    private Integer id;
    private Integer deviceId;

    private String device;
    private String action;
    private String status;
    private LocalDateTime time;

    public ActionHistoryResponse(ActionHistory history) {
        this.id = history.getId();

        if (history.getDevice() != null) {
            this.deviceId = history.getDevice().getId();
            this.device = history.getDevice().getName();
        }

        if (history.getAction() != null) {
            this.action = history.getAction().name();
        }

        if (history.getStatus() != null) {
            this.status = history.getStatus().name();
        }

        this.time = history.getUpdatedAt();
    }

    public Integer getId() {
        return id;
    }

    public Integer getDeviceId() {
        return deviceId;
    }

    public String getDevice() {
        return device;
    }

    public String getAction() {
        return action;
    }

    public String getStatus() {
        return status;
    }

    public LocalDateTime getTime() {
        return time;
    }
}
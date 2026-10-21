
package com.iot.dto;

public class DeviceControlResponse {

    private Integer historyId;
    private Integer deviceId;
    private String deviceName;
    private String action;
    private String status;
    private String message;

    public DeviceControlResponse(
            Integer historyId,
            Integer deviceId,
            String action,
            String status,
            String message) {

        this(
            historyId,
            deviceId,
            null,
            action,
            status,
            message
        );
    }

    public DeviceControlResponse(
            Integer historyId,
            Integer deviceId,
            String deviceName,
            String action,
            String status,
            String message) {

        this.historyId = historyId;
        this.deviceId = deviceId;
        this.deviceName = deviceName;
        this.action = action;
        this.status = status;
        this.message = message;
    }

    public Integer getHistoryId() {
        return historyId;
    }

    public Integer getDeviceId() {
        return deviceId;
    }

    public String getDeviceName() {
        return deviceName;
    }

    public String getAction() {
        return action;
    }

    public String getStatus() {
        return status;
    }

    public String getMessage() {
        return message;
    }
}

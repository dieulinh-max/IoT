package com.iot.dto;

import com.iot.entity.Devices;

public class DeviceResponse {

    private Integer id;
    private String name;
    private String description;
    private String status;

    public DeviceResponse(Devices device) {
        this.id = device.getId();
        this.name = device.getName();
        this.description = device.getDescription();

        this.status = device.getStatus() == null
            ? "OFF"
            : device.getStatus().name();
    }

    public Integer getId() {
        return id;
    }

    public String getName() {
        return name;
    }

    public String getDescription() {
        return description;
    }

    public String getStatus() {
        return status;
    }
}
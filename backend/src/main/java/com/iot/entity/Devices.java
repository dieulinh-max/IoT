package com.iot.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "devices")
public class Devices {

    public enum DeviceStatus {
        ON, OFF
    }

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "Id")
    private Integer id;

    @Column(
        name = "Name",
        nullable = false,
        unique = true,
        length = 255
    )
    private String name;

    @Column(name = "Description", columnDefinition = "TEXT")
    private String description;

    @Enumerated(EnumType.STRING)
    @Column(name = "Status", nullable = false)
    private DeviceStatus status = DeviceStatus.OFF;

    // Cam bien tuong ung voi thiet bi dau ra
    @OneToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(
        name = "sensorId",
        nullable = false,
        unique = true
    )
    private Sensor sensor;

    @Column(
        name = "updatedAt",
        insertable = false,
        updatable = false
    )
    private LocalDateTime updatedAt;

    public Devices() {
    }

    public Integer getId() {
        return id;
    }

    public void setId(Integer id) {
        this.id = id;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public DeviceStatus getStatus() {
        return status;
    }

    public void setStatus(DeviceStatus status) {
        this.status = status;
    }

    public Sensor getSensor() {
        return sensor;
    }

    public void setSensor(Sensor sensor) {
        this.sensor = sensor;
    }

    public LocalDateTime getUpdatedAt() {
        return updatedAt;
    }
}
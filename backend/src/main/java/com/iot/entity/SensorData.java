package com.iot.entity;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "sensordata")
public class SensorData {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "Id")
    private Integer id;

    // Moi ban ghi du lieu thuoc ve mot cam bien
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "sensorId", nullable = false)
    private Sensor sensor;

    @Column(
        name = "Value",
        nullable = false,
        precision = 10,
        scale = 2
    )
    private BigDecimal value;

    @Column(
        name = "createdAt",
        insertable = false,
        updatable = false
    )
    private LocalDateTime createdAt;

    public SensorData() {
    }

    public Integer getId() {
        return id;
    }

    public void setId(Integer id) {
        this.id = id;
    }

    public Sensor getSensor() {
        return sensor;
    }

    public void setSensor(Sensor sensor) {
        this.sensor = sensor;
    }

    public BigDecimal getValue() {
        return value;
    }

    public void setValue(BigDecimal value) {
        this.value = value;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }
}
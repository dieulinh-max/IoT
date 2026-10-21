package com.iot.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "sensor")
public class Sensor {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "Id")
    private Integer id;

    @Column(name = "Name", nullable = false, unique = true, length = 255)
    private String name;

    @Column(name = "Unit", nullable = false, length = 50)
    private String unit;

    @Column(
        name = "updatedAt",
        insertable = false,
        updatable = false
    )
    private LocalDateTime updatedAt;

    public Sensor() {
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

    public String getUnit() {
        return unit;
    }

    public void setUnit(String unit) {
        this.unit = unit;
    }

    public LocalDateTime getUpdatedAt() {
        return updatedAt;
    }
}
package com.iot.repository;

import com.iot.entity.Sensor;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface SensorRepository
        extends JpaRepository<Sensor, Integer> {

    // Tim cam bien theo ten, khong phan biet chu hoa/thuong
    Optional<Sensor> findByNameIgnoreCase(String name);

    // Kiem tra cam bien da ton tai chua
    boolean existsByNameIgnoreCase(String name);
}
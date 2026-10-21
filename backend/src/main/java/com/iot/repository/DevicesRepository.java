
package com.iot.repository;

import com.iot.entity.Devices;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface DevicesRepository
        extends JpaRepository<Devices, Integer> {

    Optional<Devices> findByName(String name);

    Optional<Devices> findByNameIgnoreCase(String name);

    List<Devices> findByStatus(Devices.DeviceStatus status);

    List<Devices> findAllByOrderByIdAsc();

    boolean existsByName(String name);

    boolean existsByNameIgnoreCase(String name);
}

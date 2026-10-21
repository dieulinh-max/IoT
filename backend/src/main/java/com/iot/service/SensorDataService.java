
package com.iot.service;

import com.iot.dto.SensorDataResponse;
import com.iot.entity.SensorData;
import com.iot.repository.SensorDataRepository;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

@Service
public class SensorDataService {

    private final SensorDataRepository repository;

    public SensorDataService(SensorDataRepository repository) {
        this.repository = repository;
    }

    @Transactional(readOnly = true)
    public Page<SensorDataResponse> search(
            String sensorName,
            LocalDateTime startTime,
            LocalDateTime endTime,
            int page,
            int size) {

        if (page < 0) {
            throw new IllegalArgumentException(
                "page phải lớn hơn hoặc bằng 0"
            );
        }

        if (size < 1 || size > 100) {
            throw new IllegalArgumentException(
                "size phải từ 1 đến 100"
            );
        }

        if (startTime != null && endTime != null
                && startTime.isAfter(endTime)) {
            throw new IllegalArgumentException(
                "Thời gian bắt đầu phải trước thời gian kết thúc"
            );
        }

        String normalizedName = normalizeSensorName(sensorName);

        Pageable pageable = PageRequest.of(page, size);

        Page<SensorData> result = repository.searchSensorData(
            normalizedName,
            startTime,
            endTime,
            pageable
        );

        return result.map(SensorDataResponse::new);
    }


    private String normalizeSensorName(String sensorName) {
        if (sensorName == null || sensorName.isBlank()
                || sensorName.equalsIgnoreCase("ALL")
                || sensorName.equalsIgnoreCase("Tất cả cảm biến")) {
            return null;
        }

        String name = sensorName.trim();

        if (name.equalsIgnoreCase("Temperature")) {
            return "Temperature";
        }

        if (name.equalsIgnoreCase("Humidity")) {
            return "Humidity";
        }

        if (name.equalsIgnoreCase("Light")) {
            return "Light";
        }

        throw new IllegalArgumentException(
            "sensorName chi nhan Temperature, Humidity, Light "
            + "hoac Tat ca cam bien"
        );
    }

}

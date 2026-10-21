
package com.iot.repository;

import com.iot.entity.SensorData;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;

public interface SensorDataRepository
        extends JpaRepository<SensorData, Integer> {

    @Query(
        value = """
            SELECT sd
            FROM SensorData sd
            JOIN FETCH sd.sensor s
            WHERE (:sensorName IS NULL
                   OR LOWER(s.name) = LOWER(:sensorName))
              AND (:startTime IS NULL
                   OR sd.createdAt >= :startTime)
              AND (:endTime IS NULL
                   OR sd.createdAt <= :endTime)
            ORDER BY sd.createdAt DESC, sd.id DESC
            """,
        countQuery = """
            SELECT COUNT(sd)
            FROM SensorData sd
            WHERE (:sensorName IS NULL
                   OR LOWER(sd.sensor.name) = LOWER(:sensorName))
              AND (:startTime IS NULL
                   OR sd.createdAt >= :startTime)
              AND (:endTime IS NULL
                   OR sd.createdAt <= :endTime)
            """
    )
    Page<SensorData> searchSensorData(
        @Param("sensorName") String sensorName,
        @Param("startTime") LocalDateTime startTime,
        @Param("endTime") LocalDateTime endTime,
        Pageable pageable
    );

    Page<SensorData> findByOrderByCreatedAtDescIdDesc(
        Pageable pageable
    );

    Page<SensorData> findBySensor_NameIgnoreCaseOrderByCreatedAtDescIdDesc(
        String sensorName,
        Pageable pageable
    );
    
    java.util.Optional<SensorData>
    findFirstBySensor_NameIgnoreCaseOrderByCreatedAtDescIdDesc(
        String sensorName
    );

}

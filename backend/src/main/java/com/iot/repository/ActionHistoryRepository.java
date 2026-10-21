package com.iot.repository;

import com.iot.entity.ActionHistory;
import com.iot.entity.ActionHistory.ActionType;
import com.iot.entity.ActionHistory.ActionStatus;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;

public interface ActionHistoryRepository
        extends JpaRepository<ActionHistory, Integer> {

    @Query(
        value = """
            SELECT a
            FROM ActionHistory a
            JOIN FETCH a.device
            WHERE (:deviceName IS NULL
                   OR LOWER(a.device.name) = LOWER(:deviceName))
              AND (:action IS NULL OR a.action = :action)
              AND (:status IS NULL OR a.status = :status)
              AND (:startTime IS NULL OR a.updatedAt >= :startTime)
              AND (:endTime IS NULL OR a.updatedAt <= :endTime)
            ORDER BY a.updatedAt DESC, a.id DESC
            """,
        countQuery = """
            SELECT COUNT(a)
            FROM ActionHistory a
            WHERE (:deviceName IS NULL
                   OR LOWER(a.device.name) = LOWER(:deviceName))
              AND (:action IS NULL OR a.action = :action)
              AND (:status IS NULL OR a.status = :status)
              AND (:startTime IS NULL OR a.updatedAt >= :startTime)
              AND (:endTime IS NULL OR a.updatedAt <= :endTime)
            """
    )
    Page<ActionHistory> searchActionHistory(
        @Param("deviceName") String deviceName,
        @Param("action") ActionType action,
        @Param("status") ActionStatus status,
        @Param("startTime") LocalDateTime startTime,
        @Param("endTime") LocalDateTime endTime,
        Pageable pageable
    );
}
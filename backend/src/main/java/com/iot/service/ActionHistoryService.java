
package com.iot.service;

import com.iot.dto.ActionHistoryRequest;
import com.iot.dto.ActionHistoryResponse;
import com.iot.entity.ActionHistory;
import com.iot.entity.ActionHistory.ActionType;
import com.iot.entity.ActionHistory.ActionStatus;
import com.iot.entity.Devices;
import com.iot.entity.User;
import com.iot.repository.ActionHistoryRepository;
import com.iot.repository.DevicesRepository;
import com.iot.repository.UserRepository;

import jakarta.persistence.EntityManager;
import jakarta.persistence.EntityNotFoundException;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Locale;

@Service
public class ActionHistoryService {

    private final ActionHistoryRepository actionHistoryRepository;
    private final UserRepository userRepository;
    private final DevicesRepository devicesRepository;
    private final EntityManager entityManager;

    public ActionHistoryService(
            ActionHistoryRepository actionHistoryRepository,
            UserRepository userRepository,
            DevicesRepository devicesRepository,
            EntityManager entityManager) {

        this.actionHistoryRepository = actionHistoryRepository;
        this.userRepository = userRepository;
        this.devicesRepository = devicesRepository;
        this.entityManager = entityManager;
    }

    // Tim kiem lich su theo ten thiet bi, action, status va thoi gian
    @Transactional(readOnly = true)
    public Page<ActionHistoryResponse> search(
            String deviceName,
            String actionText,
            String statusText,
            LocalDateTime startTime,
            LocalDateTime endTime,
            int page,
            int size) {

        if (page < 0 || size < 1 || size > 100) {
            throw new IllegalArgumentException(
                "page phai >= 0 va size phai tu 1 den 100"
            );
        }

        if (startTime != null && endTime != null
                && startTime.isAfter(endTime)) {
            throw new IllegalArgumentException(
                "Thoi gian bat dau khong duoc lon hon thoi gian ket thuc"
            );
        }

        String normalizedDeviceName = blankToNull(deviceName);
        ActionType action = parseAction(actionText);
        ActionStatus status = parseStatus(statusText);

        Page<ActionHistory> histories =
            actionHistoryRepository.searchActionHistory(
                normalizedDeviceName,
                action,
                status,
                startTime,
                endTime,
                PageRequest.of(page, size)
            );

        return histories.map(ActionHistoryResponse::new);
    }

    // Tao lich su dieu khien thiet bi dau ra
    @Transactional
    public ActionHistoryResponse create(ActionHistoryRequest request) {

        if (request.getUserId() == null
                || request.getDeviceId() == null
                || request.getAction() == null) {
            throw new IllegalArgumentException(
                "Can cung cap userId, deviceId va action"
            );
        }

        User user = userRepository.findById(request.getUserId())
            .orElseThrow(() -> new EntityNotFoundException(
                "Khong tim thay nguoi dung"
            ));

        Devices device = devicesRepository.findById(
                request.getDeviceId())
            .orElseThrow(() -> new EntityNotFoundException(
                "Khong tim thay thiet bi dau ra"
            ));

        ActionHistory history = new ActionHistory();
        history.setUser(user);
        history.setDevice(device);
        history.setAction(request.getAction());
        history.setStatus(ActionStatus.PENDING);

        ActionHistory saved =
            actionHistoryRepository.saveAndFlush(history);

        // Doc lai updatedAt do database cap nhat
        entityManager.refresh(saved);

        return new ActionHistoryResponse(saved);
    }

    private ActionType parseAction(String value) {
        if (value == null
                || value.isBlank()
                || value.equalsIgnoreCase("ALL")) {
            return null;
        }

        try {
            return ActionType.valueOf(
                value.trim().toUpperCase(Locale.ROOT)
            );
        } catch (IllegalArgumentException e) {
            throw new IllegalArgumentException(
                "Action chi nhan ON hoac OFF"
            );
        }
    }

    private ActionStatus parseStatus(String value) {
        if (value == null
                || value.isBlank()
                || value.equalsIgnoreCase("ALL")) {
            return null;
        }

        try {
            return ActionStatus.valueOf(
                value.trim().toUpperCase(Locale.ROOT)
            );
        } catch (IllegalArgumentException e) {
            throw new IllegalArgumentException(
                "Status chi nhan PENDING, SUCCESS hoac FAIL"
            );
        }
    }

    private String blankToNull(String value) {
        if (value == null
                || value.isBlank()
                || value.equalsIgnoreCase("ALL")) {
            return null;
        }

        return value.trim();
    }
}

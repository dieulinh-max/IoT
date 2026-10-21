
package com.iot.service;

import com.iot.dto.DeviceControlRequest;
import com.iot.dto.DeviceControlResponse;
import com.iot.entity.ActionHistory;
import com.iot.entity.Devices;
import com.iot.entity.User;
import com.iot.repository.ActionHistoryRepository;
import com.iot.repository.DevicesRepository;
import com.iot.repository.UserRepository;

import jakarta.persistence.EntityNotFoundException;

import org.eclipse.paho.client.mqttv3.MqttException;

import org.springframework.stereotype.Service;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.support.TransactionTemplate;
import org.springframework.transaction.annotation.Transactional;

import java.util.Locale;
import java.util.concurrent.TimeoutException;

import com.iot.dto.DeviceResponse;
import java.util.List;

@Service
public class DeviceService {

    private final DevicesRepository devicesRepository;
    private final UserRepository userRepository;
    private final ActionHistoryRepository historyRepository;
    private final MqttService mqttService;
    private final TransactionTemplate transactionTemplate;

    public DeviceService(
            DevicesRepository devicesRepository,
            UserRepository userRepository,
            ActionHistoryRepository historyRepository,
            MqttService mqttService,
            PlatformTransactionManager transactionManager) {

        this.devicesRepository = devicesRepository;
        this.userRepository = userRepository;
        this.historyRepository = historyRepository;
        this.mqttService = mqttService;
        this.transactionTemplate =
            new TransactionTemplate(transactionManager);
    }

    /**
     * Gui lenh MQTT va cho phan hoi tu ESP8266.
     *
     * Khong dat @Transactional cho ca phuong thuc nay:
     * ban ghi PENDING can duoc commit truoc khi cho MQTT.
     */
    @Transactional(readOnly = true)
    public List<DeviceResponse> getDevices() {
        return devicesRepository.findAllByOrderByIdAsc()
            .stream()
            .map(DeviceResponse::new)
            .toList();
    }

    public DeviceControlResponse controlDevice(
            Integer deviceId,
            DeviceControlRequest request) {

        // 1. Kiem tra request
        if (request == null) {
            throw new IllegalArgumentException(
                "Du lieu yeu cau khong duoc de trong"
            );
        }

        if (deviceId == null) {
            throw new IllegalArgumentException(
                "deviceId khong duoc de trong"
            );
        }

        if (request.getUserId() == null) {
            throw new IllegalArgumentException(
                "userId khong duoc de trong"
            );
        }

        if (request.getAction() == null
                || request.getAction().isBlank()) {
            throw new IllegalArgumentException(
                "action khong duoc de trong"
            );
        }

        // 2. Chi chap nhan ON hoac OFF
        ActionHistory.ActionType action;

        try {
            action = ActionHistory.ActionType.valueOf(
                request.getAction().trim().toUpperCase(Locale.ROOT)
            );
        } catch (IllegalArgumentException e) {
            throw new IllegalArgumentException(
                "action chi duoc la ON hoac OFF"
            );
        }

        // 3. Tim thiet bi dau ra trong bang Devices
        Devices device = devicesRepository.findById(deviceId)
            .orElseThrow(() -> new EntityNotFoundException(
                "Khong tim thay thiet bi ID " + deviceId
            ));

        // 4. Anh xa ten trong database sang lenh ESP8266
        String deviceType = toMqttDeviceType(device.getName());

        // 5. Tim nguoi dung thao tac
        User user = userRepository.findById(request.getUserId())
            .orElseThrow(() -> new EntityNotFoundException(
                "Khong tim thay nguoi dung ID "
                    + request.getUserId()
            ));

        // 6. Tao va luu lich su PENDING truoc khi cho MQTT.
        // Khong co transaction ben ngoai nen saveAndFlush se
        // commit ban ghi khi phuong thuc repository ket thuc.
        ActionHistory newHistory = new ActionHistory();
        newHistory.setUser(user);
        newHistory.setDevice(device);
        newHistory.setAction(action);
        newHistory.setStatus(ActionHistory.ActionStatus.PENDING);

        // Luu PENDING vao database truoc khi cho phan hoi MQTT
        final ActionHistory history =
                historyRepository.saveAndFlush(newHistory);

        // 7. Tao lenh theo giao thuc dang dung tren ESP8266
        // Vi du: FAN:ON, LIGHT:OFF, HUMIDITY:ON
        String command = deviceType + ":" + action.name();

        // 8. Gui lenh va cho phan hoi
        try {
            boolean acknowledged =
                mqttService.publishAndWait(command);

            if (!acknowledged) {
                return markFailed(
                    history,
                    device,
                    action,
                    "ESP8266 khong xac nhan thuc hien lenh"
                );
            }

            // 9. Chi cap nhat SUCCESS va trang thai Devices
            // sau khi nhan duoc xac nhan hop le.
            Devices.DeviceStatus newDeviceStatus =
                action == ActionHistory.ActionType.ON
                    ? Devices.DeviceStatus.ON
                    : Devices.DeviceStatus.OFF;

            transactionTemplate.execute(status -> {
                device.setStatus(newDeviceStatus);
                devicesRepository.save(device);

                history.setStatus(
                    ActionHistory.ActionStatus.SUCCESS
                );
                historyRepository.save(history);

                return null;
            });

            return createResponse(
                history,
                device,
                action,
                "SUCCESS",
                "ESP8266 da xac nhan lenh " + command
            );

        } catch (TimeoutException e) {
            return markFailed(
                history,
                device,
                action,
                "Khong nhan duoc phan hoi tu ESP8266 sau thoi gian cho"
            );

        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();

            return markFailed(
                history,
                device,
                action,
                "Thao tac cho phan hoi MQTT bi gian doan"
            );

        } catch (MqttException e) {
            return markFailed(
                history,
                device,
                action,
                "Khong gui duoc lenh MQTT: " + e.getMessage()
            );

        } catch (IllegalStateException e) {
            return markFailed(
                history,
                device,
                action,
                "MQTT chua san sang: " + e.getMessage()
            );
        }
    }

    /**
     * Danh dau thao tac that bai.
     * Khong thay doi Devices.Status.
     */
    private DeviceControlResponse markFailed(
            ActionHistory history,
            Devices device,
            ActionHistory.ActionType action,
            String message) {

        history.setStatus(ActionHistory.ActionStatus.FAIL);
        historyRepository.saveAndFlush(history);

        return createResponse(
            history,
            device,
            action,
            "FAIL",
            message
        );
    }

    /**
     * Ten Devices trong database khac voi ma lenh MQTT.
     */
    private String toMqttDeviceType(String deviceName) {
        if (deviceName == null) {
            throw new IllegalArgumentException(
                "Ten thiet bi khong duoc de trong"
            );
        }

        return switch (
            deviceName.trim().toUpperCase(Locale.ROOT)
        ) {
            case "FAN" -> "FAN";
            case "LIGHT" -> "LIGHT";
            case "HUMIDIFIER" -> "HUMIDITY";
            default -> throw new IllegalArgumentException(
                "Thiet bi khong duoc ho tro: " + deviceName
            );
        };
    }

    private DeviceControlResponse createResponse(
            ActionHistory history,
            Devices device,
            ActionHistory.ActionType action,
            String status,
            String message) {

        return new DeviceControlResponse(
            history.getId(),
            device.getId(),
            device.getName(),
            action.name(),
            status,
            message
        );
    }
}

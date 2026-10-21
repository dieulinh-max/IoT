
package com.iot.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;

import com.iot.entity.Sensor;
import com.iot.entity.SensorData;
import com.iot.repository.SensorDataRepository;
import com.iot.repository.SensorRepository;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;

@Service
public class TelemetryService {

    // Ma ESP8266 duy nhat cua he thong
    private static final String ESP_DEVICE_CODE = "ESP8266_001";

    private final SensorRepository sensorRepository;
    private final SensorDataRepository sensorDataRepository;
    private final ObjectMapper objectMapper;

    public TelemetryService(
            SensorRepository sensorRepository,
            SensorDataRepository sensorDataRepository,
            ObjectMapper objectMapper) {

        this.sensorRepository = sensorRepository;
        this.sensorDataRepository = sensorDataRepository;
        this.objectMapper = objectMapper;
    }

    /**
     * Doc JSON tu MQTT va luu du lieu cam bien vao database.
     */
    @Transactional
    public void saveTelemetry(String payload) throws Exception {

        if (payload == null || payload.isBlank()) {
            throw new IllegalArgumentException(
                "Payload MQTT khong duoc de trong"
            );
        }

        JsonNode json = objectMapper.readTree(payload);

        // Lay ma ESP tu JSON
        String deviceCode = json.path("deviceId").asText("").trim();

        if (deviceCode.isBlank()) {
            throw new IllegalArgumentException(
                "JSON khong co deviceId"
            );
        }

        // He thong hien chi co mot ESP8266
        if (!ESP_DEVICE_CODE.equalsIgnoreCase(deviceCode)) {
            throw new IllegalArgumentException(
                "ESP khong hop le: " + deviceCode
            );
        }

        // Lay cac cam bien truc tiep, khong loc qua Devices
        List<Sensor> sensors = sensorRepository.findAll();

        saveValue(sensors, "Temperature", json, "temperature");
        saveValue(sensors, "Humidity", json, "humidity");
        saveValue(sensors, "Light", json, "light");

        System.out.println(
            "Da xu ly du lieu cam bien tu " + deviceCode
        );
    }

    /**
     * Luu mot gia tri cam bien neu JSON co gia tri so hop le.
     */
    private void saveValue(
            List<Sensor> sensors,
            String sensorName,
            JsonNode json,
            String jsonField) {

        JsonNode valueNode = json.get(jsonField);

        if (valueNode == null
                || !valueNode.isNumber()) {

            System.err.println(
                "Bo qua du lieu thieu hoac khong hop le: "
                    + jsonField
            );
            return;
        }

        // Tim cam bien theo Name trong bang Sensor
        Sensor sensor = sensors.stream()
            .filter(s -> s.getName() != null
                && sensorName.equalsIgnoreCase(s.getName().trim()))
            .findFirst()
            .orElseThrow(() -> new IllegalArgumentException(
                "Chua co cam bien trong database: " + sensorName
            ));

        SensorData data = new SensorData();
        data.setSensor(sensor);
        data.setValue(
            BigDecimal.valueOf(valueNode.asDouble())
        );

        sensorDataRepository.save(data);

        System.out.println(
            sensorName + " = " + data.getValue()
        );
    }
}

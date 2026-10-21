
package com.iot.service;

import com.iot.dto.DashboardResponse;
import com.iot.dto.DashboardChartResponse;
import com.iot.entity.SensorData;
import com.iot.repository.SensorDataRepository;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Service
public class DashboardService {

    private final SensorDataRepository sensorDataRepository;

    public DashboardService(
            SensorDataRepository sensorDataRepository) {
        this.sensorDataRepository = sensorDataRepository;
    }

    // Lay gia tri moi nhat cua ca ba cam bien
    @Transactional(readOnly = true)
    public DashboardResponse getSummary() {

        SensorData temperature = getLatest("Temperature");
        SensorData humidity = getLatest("Humidity");
        SensorData light = getLatest("Light");

        LocalDateTime updatedAt = null;

        SensorData[] latestData = {
            temperature, humidity, light
        };

        for (SensorData data : latestData) {
            if (data == null || data.getCreatedAt() == null) {
                continue;
            }

            if (updatedAt == null
                    || data.getCreatedAt().isAfter(updatedAt)) {
                updatedAt = data.getCreatedAt();
            }
        }

        return new DashboardResponse(
            toSensorValue(temperature),
            toSensorValue(humidity),
            toSensorValue(light),
            updatedAt
        );
    }

    // Lay ban ghi moi nhat cua mot cam bien
    private SensorData getLatest(String sensorName) {
        return sensorDataRepository
            .findFirstBySensor_NameIgnoreCaseOrderByCreatedAtDescIdDesc(
                sensorName
            )
            .orElse(null);
    }

    private DashboardResponse.SensorValue toSensorValue(
            SensorData data) {

        if (data == null) {
            return null;
        }

        return new DashboardResponse.SensorValue(
            data.getSensor().getName(),
            data.getValue(),
            data.getSensor().getUnit(),
            data.getCreatedAt()
        );
    }

    // Lay cac mau moi nhat cua tung cam bien cho bieu do
    private List<SensorData> getLatestValues(
            String sensorName, int limit) {

        Page<SensorData> page =
            sensorDataRepository
                .findBySensor_NameIgnoreCaseOrderByCreatedAtDescIdDesc(
                    sensorName,
                    PageRequest.of(0, limit)
                );

        return page.getContent();
    }

    // Lay du lieu bieu do
    @Transactional(readOnly = true)
    public List<DashboardChartResponse> getChart(int limit) {

        if (limit < 1 || limit > 500) {
            throw new IllegalArgumentException(
                "limit phai nam trong khoang tu 1 den 500"
            );
        }

        List<SensorData> temperatures =
            getLatestValues("Temperature", limit);

        List<SensorData> humidities =
            getLatestValues("Humidity", limit);

        List<SensorData> lights =
            getLatestValues("Light", limit);

        // Chi ghep cac mau khi ca ba cam bien deu co du lieu.
        int count = Math.min(
            temperatures.size(),
            Math.min(humidities.size(), lights.size())
        );

        List<DashboardChartResponse> result =
            new ArrayList<>(count);

        // Repository tra ve moi nhat truoc.
        // Duyet nguoc de bieu do hien thi tu cu den moi.
        for (int i = count - 1; i >= 0; i--) {

            SensorData temperature = temperatures.get(i);
            SensorData humidity = humidities.get(i);
            SensorData light = lights.get(i);

            LocalDateTime time = latestTime(
                temperature.getCreatedAt(),
                humidity.getCreatedAt(),
                light.getCreatedAt()
            );

            if (time == null) {
                continue;
            }

            result.add(new DashboardChartResponse(
                time,
                temperature.getValue(),
                humidity.getValue(),
                light.getValue()
            ));
        }

        return result;
    }

    // Lay moc thoi gian muon nhat trong mot chu ky mau
    private LocalDateTime latestTime(
            LocalDateTime temperatureTime,
            LocalDateTime humidityTime,
            LocalDateTime lightTime) {

        LocalDateTime latest = temperatureTime;

        if (latest == null
                || (humidityTime != null
                    && humidityTime.isAfter(latest))) {
            latest = humidityTime;
        }

        if (latest == null
                || (lightTime != null
                    && lightTime.isAfter(latest))) {
            latest = lightTime;
        }

        return latest;
    }
}

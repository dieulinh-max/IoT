package com.iot.service;

import com.iot.entity.Devices;
import com.iot.repository.DevicesRepository;

import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

/**
 * Mỗi lần BE khởi động, đặt trạng thái tất cả thiết bị về OFF.
 *
 * Lý do: ESP8266 luôn tắt hết LED khi khởi động (updateLEDs() với
 * cả ba biến = false), nên bảng devices phải khớp với phần cứng.
 * Sau đó cột status chỉ thay đổi theo lệnh ON/OFF thành công
 * (DeviceService.controlDevice).
 */
@Component
public class DeviceStatusInitializer implements ApplicationRunner {

    private final DevicesRepository devicesRepository;

    public DeviceStatusInitializer(DevicesRepository devicesRepository) {
        this.devicesRepository = devicesRepository;
    }

    @Override
    @Transactional
    public void run(ApplicationArguments args) {
        List<Devices> devices = devicesRepository.findAll();

        for (Devices device : devices) {
            device.setStatus(Devices.DeviceStatus.OFF);
        }

        devicesRepository.saveAll(devices);

        System.out.println(
                "Da dat " + devices.size()
                        + " thiet bi ve trang thai OFF khi khoi dong"
        );
    }
}

package com.iot.service;

import jakarta.annotation.PostConstruct;
import jakarta.annotation.PreDestroy;

import org.eclipse.paho.client.mqttv3.*;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.nio.charset.StandardCharsets;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.TimeoutException;

@Service
public class MqttService {

    @Value("${mqtt.broker-url}")
    private String brokerUrl;

    @Value("${mqtt.client-id}")
    private String clientId;

    @Value("${mqtt.username:}")
    private String username;

    @Value("${mqtt.password:}")
    private String password;

    private static final String CONTROL_TOPIC =
            "iot/device/ESP8266_001/control";

    private static final String RESPONSE_TOPIC =
            "iot/device/ESP8266_001/response";

    private static final String TELEMETRY_TOPIC =
            "iot/device/ESP8266_001/telemetry";

    private static final long TIMEOUT_SECONDS = 10;

    private final TelemetryService telemetryService;

    private MqttClient client;

    private volatile CompletableFuture<String> pendingResponse;
    private volatile String expectedResponse;

    public MqttService(TelemetryService telemetryService) {
        this.telemetryService = telemetryService;
    }

    @PostConstruct
    public void connect() {
        try {
            client = new MqttClient(
                    brokerUrl,
                    clientId + "-control",
                    null
            );

            MqttConnectOptions options =
                    new MqttConnectOptions();

            options.setAutomaticReconnect(true);
            options.setCleanSession(true);
            options.setConnectionTimeout(10);

            if (username != null && !username.isBlank()) {
                options.setUserName(username);
                options.setPassword(password.toCharArray());
            }

            client.setCallback(new MqttCallback() {

                @Override
                public void connectionLost(Throwable cause) {
                    System.err.println(
                            "MQTT connection lost: "
                                    + cause.getMessage()
                    );
                }

                @Override
                public void messageArrived(
                        String topic,
                        MqttMessage message) {

                    String payload = new String(
                            message.getPayload(),
                            StandardCharsets.UTF_8
                    ).trim();

                    // 1. Nhận dữ liệu cảm biến và lưu MySQL.
                    if (TELEMETRY_TOPIC.equals(topic)) {
                        System.out.println(
                                "Telemetry received: " + payload
                        );

                        try {
                            telemetryService.saveTelemetry(payload);
                        } catch (Exception e) {
                            System.err.println(
                                    "Lưu dữ liệu cảm biến thất bại: "
                                            + e.getMessage()
                            );
                            e.printStackTrace();
                        }

                        return;
                    }

                    // 2. Nhận phản hồi điều khiển từ Arduino.
                    if (RESPONSE_TOPIC.equals(topic)) {
                        System.out.println(
                                "Arduino response: " + payload
                        );

                        CompletableFuture<String> future =
                                pendingResponse;

                        if (future != null && !future.isDone()) {
                            if (payload.equals(expectedResponse)
                                    || payload.equals("ERROR")) {
                                future.complete(payload);
                            }
                        }
                    }
                }

                @Override
                public void deliveryComplete(
                        IMqttDeliveryToken token) {
                    // Xác nhận gửi MQTT, không phải phản hồi Arduino.
                }
            });

            client.connect(options);

            // Đăng ký nghe cả hai topic.
            client.subscribe(
                    new String[]{
                            RESPONSE_TOPIC,
                            TELEMETRY_TOPIC
                    },
                    new int[]{1, 1}
            );

            System.out.println(
                    "MQTT connected: " + brokerUrl
            );
            System.out.println(
                    "Subscribed: " + RESPONSE_TOPIC
            );
            System.out.println(
                    "Subscribed: " + TELEMETRY_TOPIC
            );

        } catch (MqttException e) {
            System.err.println(
                    "MQTT connection failed: " + e.getMessage()
            );
        }
    }

    public synchronized boolean publishAndWait(String command)
            throws MqttException, TimeoutException,
                   InterruptedException {

        if (client == null || !client.isConnected()) {
            throw new IllegalStateException(
                    "Không kết nối được MQTT Broker"
            );
        }

        CompletableFuture<String> future =
                new CompletableFuture<>();

        expectedResponse = command;
        pendingResponse = future;

        try {
            MqttMessage message = new MqttMessage(
                    command.getBytes(StandardCharsets.UTF_8)
            );

            message.setQos(1);
            message.setRetained(false);

            client.publish(CONTROL_TOPIC, message);

            System.out.println("Sent command: " + command);

            String response = future.get(
                    TIMEOUT_SECONDS,
                    TimeUnit.SECONDS
            );

            return command.equals(response);

        } catch (java.util.concurrent.ExecutionException e) {
            throw new IllegalStateException(
                    "Không đọc được phản hồi từ Arduino", e
            );
        } finally {
            pendingResponse = null;
            expectedResponse = null;
        }
    }

    @PreDestroy
    public void disconnect() {
        try {
            if (client != null) {
                if (client.isConnected()) {
                    client.disconnect();
                }
                client.close();
            }
        } catch (MqttException e) {
            System.err.println(
                    "MQTT disconnect failed: " + e.getMessage()
            );
        }
    }
}

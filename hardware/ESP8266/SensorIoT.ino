
#include <ESP8266WiFi.h>
#include <PubSubClient.h>
#include "DHT.h"

// ================= WIFI =================

const char* WIFI_SSID = "YOURWIFI";
const char* WIFI_PASSWORD = "YOURWIFI";

// ================= MQTT =================

const char* MQTT_SERVER = "YOUR";
const int MQTT_PORT = 1883;

const char* MQTT_USERNAME = "YOUR";
const char* MQTT_PASSWORD = "YOUR";

const char* DEVICE_ID = "ESP8266_001";

// ================= SENSOR =================

#define DHTPIN D5
#define DHTTYPE DHT11
#define LDR_PIN A0

DHT dht(DHTPIN, DHTTYPE);

// ================= LED THIET BI CU =================

#define LED_HUMIDITY D1
#define LED_LIGHT D2
#define LED_FAN D6

bool humidityDevice = false;
bool lightDevice = false;
bool fanDevice = false;

// ================= TOPIC MQTT =================

// Topic điều khiển thiết bị
const char* TOPIC_CONTROL =
  "iot/device/ESP8266_001/control";

// Topic gửi dữ liệu cảm biến
const char* TOPIC_TELEMETRY =
  "iot/device/ESP8266_001/telemetry";

// Topic phản hồi lệnh điều khiển
const char* TOPIC_RESPONSE =
  "iot/device/ESP8266_001/response";

// ================= MQTT CLIENT =================

WiFiClient espClient;
PubSubClient mqttClient(espClient);

// ================= SENSOR TIMER =================

unsigned long previousMillis = 0;
const long interval = 2000;


// =================================================
// WIFI
// =================================================

void setupWiFi() {

  Serial.println("Dang ket noi WiFi...");

  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);

  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }

  Serial.println("\nWiFi connected!");
  Serial.println(WiFi.localIP());
}


// =================================================
// MQTT
// =================================================

void reconnectMQTT() {

  while (!mqttClient.connected()) {

    Serial.println("Dang ket noi MQTT...");

    String clientId = DEVICE_ID;

    if (mqttClient.connect(
          clientId.c_str(),
          MQTT_USERNAME,
          MQTT_PASSWORD
        )) {

      Serial.println("MQTT connected!");

      // Đăng ký nhận lệnh điều khiển
      mqttClient.subscribe(TOPIC_CONTROL, 1);

      Serial.println("Subscribed control topic");

    } else {

      Serial.print("MQTT failed, rc=");
      Serial.println(mqttClient.state());

      delay(5000);
    }
  }
}


// =================================================
// UPDATE LED THIET BI
// =================================================

void updateLEDs() {

  digitalWrite(
    LED_HUMIDITY,
    humidityDevice ? HIGH : LOW
  );

  digitalWrite(
    LED_LIGHT,
    lightDevice ? HIGH : LOW
  );

  digitalWrite(
    LED_FAN,
    fanDevice ? HIGH : LOW
  );
}


// =================================================
// MQTT CALLBACK
// =================================================

void mqttCallback(
  char* topic,
  byte* payload,
  unsigned int length
) {

  String message = "";

  for (unsigned int i = 0; i < length; i++) {
    message += (char)payload[i];
  }

  message.trim();

  Serial.print("Topic: ");
  Serial.println(topic);

  Serial.print("Message: ");
  Serial.println(message);

  // Chỉ xử lý topic điều khiển thiết bị
  if (String(topic) != TOPIC_CONTROL) {
    return;
  }

  if (message == "ALL:ON") {

    humidityDevice = true;
    lightDevice = true;
    fanDevice = true;

    updateLEDs();

    mqttClient.publish(TOPIC_RESPONSE, "ALL:ON");
  }

  else if (message == "ALL:OFF") {

    humidityDevice = false;
    lightDevice = false;
    fanDevice = false;

    updateLEDs();

    mqttClient.publish(TOPIC_RESPONSE, "ALL:OFF");
  }

  else if (message == "HUMIDITY:ON") {

    humidityDevice = true;

    updateLEDs();

    mqttClient.publish(TOPIC_RESPONSE, "HUMIDITY:ON");
  }

  else if (message == "HUMIDITY:OFF") {

    humidityDevice = false;

    updateLEDs();

    mqttClient.publish(TOPIC_RESPONSE, "HUMIDITY:OFF");
  }

  else if (message == "LIGHT:ON") {

    lightDevice = true;

    updateLEDs();

    mqttClient.publish(TOPIC_RESPONSE, "LIGHT:ON");
  }

  else if (message == "LIGHT:OFF") {

    lightDevice = false;

    updateLEDs();

    mqttClient.publish(TOPIC_RESPONSE, "LIGHT:OFF");
  }

  else if (message == "FAN:ON") {

    fanDevice = true;

    updateLEDs();

    mqttClient.publish(TOPIC_RESPONSE, "FAN:ON");
  }

  else if (message == "FAN:OFF") {

    fanDevice = false;

    updateLEDs();

    mqttClient.publish(TOPIC_RESPONSE, "FAN:OFF");
  }

  else {

    mqttClient.publish(TOPIC_RESPONSE, "ERROR");
  }
}


// =================================================
// READ SENSOR
// =================================================

void readAndPublishSensor() {

  int light = analogRead(LDR_PIN);

  float humidity = dht.readHumidity();
  float temperature = dht.readTemperature();

  if (isnan(humidity) || isnan(temperature)) {

    Serial.println("Loi DHT11!");

    return;
  }

  String payload = "{";

  payload += "\"deviceId\":\"";
  payload += DEVICE_ID;
  payload += "\",";

  payload += "\"temperature\":";
  payload += String(temperature, 1);
  payload += ",";

  payload += "\"humidity\":";
  payload += String(humidity, 1);
  payload += ",";

  payload += "\"light\":";
  payload += String(light);

  payload += "}";

  mqttClient.publish(
    TOPIC_TELEMETRY,
    payload.c_str()
  );

  Serial.println(payload);
}


// =================================================
// SETUP
// =================================================

void setup() {

  Serial.begin(115200);

  // Khởi tạo 3 LED thiết bị
  pinMode(LED_HUMIDITY, OUTPUT);
  pinMode(LED_LIGHT, OUTPUT);
  pinMode(LED_FAN, OUTPUT);

  // Tắt LED khi ESP8266 khởi động
  updateLEDs();

  dht.begin();

  setupWiFi();

  mqttClient.setServer(
    MQTT_SERVER,
    MQTT_PORT
  );

  mqttClient.setCallback(
    mqttCallback
  );

  Serial.println("HE THONG IOT STARTED");
}


// =================================================
// LOOP
// =================================================

void loop() {

  if (WiFi.status() != WL_CONNECTED) {
    setupWiFi();
  }

  if (!mqttClient.connected()) {
    reconnectMQTT();
  }

  // Duy trì kết nối MQTT
  mqttClient.loop();

  // Đọc cảm biến mỗi 2 giây
  unsigned long currentMillis = millis();

  if (currentMillis - previousMillis >= interval) {

    previousMillis = currentMillis;

    readAndPublishSensor();
  }
}

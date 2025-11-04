// Control de acceso: ESP32 + RC522 + OLED (SSD1306 128x64) + LEDs + Buzzer activo (HND-2316)
// - RC522: SPI (SCK=18, MISO=19, MOSI=23), SS=5, RST=4
// - OLED: I2C (SDA=21, SCL=22), addr 0x3C
// - LED_VERDE: GPIO 25
// - LED_ROJO:  GPIO 27
// - BUZZER (activo): GPIO 14


#include <WiFi.h>
#include <HTTPClient.h>
#include <Wire.h>
#include <SPI.h>
#include <Adafruit_GFX.h>
#include <Adafruit_SSD1306.h>
#include <MFRC522.h>
#include <ArduinoJson.h>

#define RST_PIN   4
#define SS_PIN    5

#define LED_VERDE 25
#define LED_ROJO  27

#define BUZZER_PIN 14  // HND-2316 (activo)

#define SCREEN_WIDTH 128
#define SCREEN_HEIGHT 64
#define OLED_RESET    -1

const char* ssid     = "Amon"; //poner el nombre de la red wifi
const char* password = "Arturojr1622"; //poner la clave de la red wifi
const char* host = "http://38.0.101.76:3000";
const char* serverUrl = "http://38.0.101.76:3000/api/verify";


Adafruit_SSD1306 display(SCREEN_WIDTH, SCREEN_HEIGHT, &Wire, OLED_RESET);

MFRC522 mfrc522(SS_PIN, RST_PIN);

// Tarjeta autorizada (modifica con el UID que quieras permitir)
byte tarjetaPermitida[4] = {0xA2, 0x2C, 0x54, 0x51};

bool compararUID(byte *a, byte *b) {
  for (byte i = 0; i < 4; i++) if (a[i] != b[i]) return false;
  return true;
}

// Buzzer activo: simples funciones on/off (HND-2316)
void playOK() {
  digitalWrite(BUZZER_PIN, HIGH); delay(150);
  digitalWrite(BUZZER_PIN, LOW);  delay(100);
  digitalWrite(BUZZER_PIN, HIGH); delay(150);
  digitalWrite(BUZZER_PIN, LOW);
}

void playDenied() {
  digitalWrite(BUZZER_PIN, HIGH); delay(1000);
  digitalWrite(BUZZER_PIN, LOW);
}

void pantallaInicial() {
  display.clearDisplay();
  display.setTextSize(1);
  display.setTextColor(SSD1306_WHITE);
  display.setCursor(10, 2);
  display.println(F("CONTROL DE ACCESO"));
  display.drawLine(0, 16, 128, 16, SSD1306_WHITE);
  display.setCursor(10, 28);
  display.println(F("Pase su tarjeta..."));
  display.display();
}

void setup() {
  Serial.begin(115200);
  Serial.println("Conectando a WiFi: ");
  Serial.println(ssid);
  WiFi.begin(ssid, password);
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  Serial.println("");
  Serial.println("WiFi conectado");
  Serial.println(WiFi.localIP());

  // SPI y RC522
  SPI.begin(18, 19, 23);
  mfrc522.PCD_Init();

  // I2C
  Wire.begin(21, 22);

  // Pines salida
  pinMode(LED_VERDE, OUTPUT);
  pinMode(LED_ROJO, OUTPUT);
  pinMode(BUZZER_PIN, OUTPUT);
  digitalWrite(LED_VERDE, LOW);
  digitalWrite(LED_ROJO, LOW);
  digitalWrite(BUZZER_PIN, LOW);

  // OLED init
  if (!display.begin(SSD1306_SWITCHCAPVCC, 0x3C)) {
    Serial.println(F("❌ No se encontró la pantalla OLED."));
    for (;;) { delay(1000); }
  }

  pantallaInicial();
  Serial.println("Sistema listo. Pase una tarjeta...");
}

/* void loop() {
  // Esperar nueva tarjeta
  if (!mfrc522.PICC_IsNewCardPresent() || !mfrc522.PICC_ReadCardSerial()) return;

  // Construir UID legible
  String uidString = "";
  Serial.print("Card UID:");
  for (byte i = 0; i < mfrc522.uid.size; i++) {
    byte val = mfrc522.uid.uidByte[i];
    if (val < 0x10) Serial.print(" 0");
    else Serial.print(" ");
    Serial.print(val, HEX);
    // formato en OLED: con espacios
    if (val < 0x10) uidString += "0";
    uidString += String(val, HEX);
    if (i < mfrc522.uid.size - 1) uidString += " ";
  }
  Serial.println();

  // Mostrar UID en la zona amarilla (líneas superiores)
  display.clearDisplay();
  display.setTextSize(1);
  display.setTextColor(SSD1306_WHITE);
  display.setCursor(5, 2);
  display.print("UID: ");
  display.println(uidString);
  display.drawLine(0, 16, 128, 16, SSD1306_WHITE);

  // Comprobar acceso
  if (compararUID(mfrc522.uid.uidByte, tarjetaPermitida)) {
    Serial.println("✅ Acceso permitido");
    display.setTextSize(2);
    display.setCursor(15, 36);
    display.println("ACCESO OK");
    display.display();

    digitalWrite(LED_VERDE, HIGH);
    playOK();
    delay(2000);
    digitalWrite(LED_VERDE, LOW);
  } else {
    Serial.println("⛔ Acceso denegado");
    display.setTextSize(2);
    display.setCursor(6, 36);
    display.println("DENEGADO");
    display.display();

    digitalWrite(LED_ROJO, HIGH);
    playDenied();
    delay(2000);
    digitalWrite(LED_ROJO, LOW);
  }

  // Restaurar pantalla inicial
  pantallaInicial();

  mfrc522.PICC_HaltA();
  mfrc522.PCD_StopCrypto1();
  delay(500);
} */

void loop() {
    // Esperar nueva tarjeta
    if (!mfrc522.PICC_IsNewCardPresent() || !mfrc522.PICC_ReadCardSerial()) return;

    // 1. Construir UID como string (sin espacios)
    String uidHex = "";
    // ... (Tu código para imprimir y construir el uidString para la OLED)
    Serial.print("Card UID:");
    for (byte i = 0; i < mfrc522.uid.size; i++) {
        byte val = mfrc522.uid.uidByte[i];
        if (val < 0x10) Serial.print(" 0");
        else Serial.print(" ");
        Serial.print(val, HEX);
        // Formato para enviar al servidor (SIN ESPACIOS)
        if (val < 0x10) uidHex += "0";
        uidHex += String(val, HEX);
    }
    Serial.println();
  uidHex.toUpperCase();

    // ... (Tu código para mostrar el UID en OLED)
    
    // Comprobar acceso (NUEVA LÓGICA HTTP)
    if (WiFi.status() == WL_CONNECTED) {
    HTTPClient http;
    http.begin(serverUrl);
    http.addHeader("Content-Type", "application/json");

    String httpRequestData = "{\"uid\":\"" + uidHex + "\"}";
    Serial.print("Enviando UID al servidor: ");
    Serial.println(httpRequestData);

    int httpResponseCode = http.POST(httpRequestData);

        if (httpResponseCode > 0) {
            String payload = http.getString();
            Serial.print("Respuesta del servidor: ");
            Serial.println(payload);

      DynamicJsonDocument doc(256);
      DeserializationError err = deserializeJson(doc, payload);
      if (!err && String((const char*)doc["status"]) == "OK") {
        const char* userName = doc["user"] | "";

        Serial.print("Acceso permitido para: ");
        Serial.println(userName);

        display.clearDisplay();
        display.setTextSize(1);
        display.setCursor(5, 2);
        display.println("UID: " + uidHex);
        display.drawLine(0, 16, 128, 16, SSD1306_WHITE);
        display.setTextSize(2);
        display.setCursor(15, 36);
        display.println("Bienvenido");
        display.setCursor(5, 50);
        display.setTextSize(1);
        display.println(userName);
        display.display();

        digitalWrite(LED_VERDE, HIGH);
        playOK();
        delay(3000);
        digitalWrite(LED_VERDE, LOW);
      } else {
        Serial.println("Acceso denegado (Servidor)");

        display.clearDisplay();
        display.setTextSize(1);
        display.setCursor(5, 2);
        display.println("UID: " + uidHex);
        display.drawLine(0, 16, 128, 16, SSD1306_WHITE);
        display.setTextSize(2);
        display.setCursor(6, 36);
        display.println("DENEGADO");
        display.display();

        digitalWrite(LED_ROJO, HIGH);
        playDenied();
        delay(3000);
        digitalWrite(LED_ROJO, LOW);
      }
    } else {
      Serial.print("Error en la petición HTTP: ");
      Serial.println(httpResponseCode);
    }
    http.end();
    } else {
        Serial.println("❌ WiFi desconectado. Intentando reconectar...");
        WiFi.begin(ssid, password);
    }
    // ------------------------------------------------

    // Restaurar pantalla inicial
    pantallaInicial();

    mfrc522.PICC_HaltA();
    mfrc522.PCD_StopCrypto1();
    delay(500);
}
#include <Wire.h>
#include <LiquidCrystal_AIP31068_I2C.h>
#include <DHT.h>
#include <OneWire.h>
#include <DallasTemperature.h>

// Пины
#define TRIG_PIN 9
#define ECHO_PIN 10
#define DHT_PIN 6
#define DS18B20_PIN 2

// DHT22
#define DHTTYPE DHT22
DHT dht(DHT_PIN, DHTTYPE);

// DS18B20
OneWire oneWire(DS18B20_PIN);
DallasTemperature sensors(&oneWire);

// LCD
LiquidCrystal_AIP31068_I2C lcd(0x3E, 16, 2);

float waterLevel = 0; // уровень воды (см)
float humidity = 0;   // влажность воздуха (%)
float airTemp = 0;    // температура воздуха (°C)
float waterTemp = 0;  // температура воды (°C)

// Измерение уровня воды (HC-SR04)
float getWaterLevel() {
  // Посылаем ультразвуковой импульс
  digitalWrite(TRIG_PIN, LOW);
  delayMicroseconds(2);
  digitalWrite(TRIG_PIN, HIGH);
  delayMicroseconds(10);
  digitalWrite(TRIG_PIN, LOW);
  
  // Измеряем время возврата эха
  long duration = pulseIn(ECHO_PIN, HIGH, 30000);
  
  if (duration > 0) {
    // Расстояние (см) = время (мкс) * скорость звука (0.034 см/мкс) / 2
    float dist = duration * 0.034 / 2;
    return dist;
  }
  return -1;  // нет эха = вода не обнаружена
}

void setup() {
  Serial.begin(9600);
  Serial.println("Groundwater Monitor");
  delay(100);
  
  // HC-SR04
  pinMode(TRIG_PIN, OUTPUT);
  pinMode(ECHO_PIN, INPUT);
  
  // DHT22
  dht.begin();
  
  // DS18B20
  sensors.begin();
  
  // LCD
  lcd.init();
  lcd.clear();
  lcd.setCursor(0, 0);
  lcd.print("Groundwater");
  delay(2000);
  lcd.clear();
  
  Serial.println("System Ready!");
}

void loop() {
  // Измеряем уровень воды
  waterLevel = getWaterLevel();
  
  // Измеряем влажность и температуру воздуха (DHT22)
  humidity = dht.readHumidity();
  airTemp = dht.readTemperature();

  // Если датчик не ответил — обнуляем значения
  if (isnan(humidity) || isnan(airTemp)) {
    humidity = 0;
    airTemp = 0;
  }
  
  // Измеряем температуру воды (DS18B20)
  sensors.requestTemperatures();
  waterTemp = sensors.getTempCByIndex(0);
  
  // Вывод на LCD
  lcd.clear();
  
  lcd.setCursor(0, 0);
  lcd.print("L:");
  lcd.print(waterLevel, 0);
  lcd.print("cm H:");
  lcd.print(humidity, 0);
  lcd.print("%");
  
  lcd.setCursor(0, 1);
  lcd.print("Tw:");
  lcd.print(waterTemp, 1);
  lcd.print("C Ta:");
  lcd.print(airTemp, 1);
  lcd.print("C");
  
  // Отправка в serial (для Python)
  // Формат: уровень,влажность,температура_воды,температура_воздуха
  Serial.print(waterLevel);
  Serial.print(",");
  Serial.print(humidity);
  Serial.print(",");
  Serial.print(waterTemp);
  Serial.print(",");
  Serial.println(airTemp);
  
  delay(2000);
}

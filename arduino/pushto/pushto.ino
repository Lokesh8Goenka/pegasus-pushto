// Pegasus Push-To finder — sensor firmware for Arduino Uno
//
// Reads the MPU6050 tilt sensor (I2C: SDA=A4, SCL=A5) and the light sensor
// (analog output on A0) and streams them to the phone/laptop over USB.
//
// Serial, 115200 baud, one line per message:
//   I,PEGASUS,1,mpu=1        sent at start-up and in reply to "P"
//   D,ax,ay,az,light         25 times a second (raw accelerometer, light 0-1023)
//   E,NOMPU                  once a second if the tilt sensor is not found

#include <Wire.h>

const uint8_t MPU_ADDR = 0x68;
const uint8_t LIGHT_PIN = A0;
const uint8_t SAMPLES = 8;            // averaged per output line
const unsigned long PERIOD_MS = 40;   // 25 Hz

bool mpuOk = false;
unsigned long lastSend = 0;
unsigned long lastRetry = 0;

void writeReg(uint8_t reg, uint8_t value) {
  Wire.beginTransmission(MPU_ADDR);
  Wire.write(reg);
  Wire.write(value);
  Wire.endTransmission();
}

bool setupMpu() {
  Wire.beginTransmission(MPU_ADDR);
  if (Wire.endTransmission() != 0) return false;
  writeReg(0x6B, 0x00);  // wake up
  writeReg(0x1A, 0x06);  // strongest built-in low-pass filter (5 Hz)
  writeReg(0x1C, 0x00);  // accelerometer range +/-2 g
  return true;
}

bool readAccel(int16_t &ax, int16_t &ay, int16_t &az) {
  Wire.beginTransmission(MPU_ADDR);
  Wire.write(0x3B);
  if (Wire.endTransmission(false) != 0) return false;
  if (Wire.requestFrom(MPU_ADDR, (uint8_t)6) != 6) return false;
  ax = (Wire.read() << 8) | Wire.read();
  ay = (Wire.read() << 8) | Wire.read();
  az = (Wire.read() << 8) | Wire.read();
  return true;
}

void sendInfo() {
  Serial.print(F("I,PEGASUS,1,mpu="));
  Serial.println(mpuOk ? 1 : 0);
}

void setup() {
  Serial.begin(115200);
  Wire.begin();
  Wire.setWireTimeout(3000, true);  // a loose wire must not freeze the loop
  mpuOk = setupMpu();
  sendInfo();
}

void loop() {
  while (Serial.available()) {
    if (Serial.read() == 'P') sendInfo();
  }

  unsigned long now = millis();

  if (!mpuOk) {
    if (now - lastRetry >= 1000) {
      lastRetry = now;
      mpuOk = setupMpu();
      if (mpuOk) sendInfo();
      else Serial.println(F("E,NOMPU"));
    }
    return;
  }

  if (now - lastSend < PERIOD_MS) return;
  lastSend = now;

  long sx = 0, sy = 0, sz = 0;
  for (uint8_t i = 0; i < SAMPLES; i++) {
    int16_t ax, ay, az;
    if (!readAccel(ax, ay, az)) {
      mpuOk = false;
      return;
    }
    sx += ax; sy += ay; sz += az;
  }

  Serial.print(F("D,"));
  Serial.print(sx / SAMPLES); Serial.print(',');
  Serial.print(sy / SAMPLES); Serial.print(',');
  Serial.print(sz / SAMPLES); Serial.print(',');
  Serial.println(analogRead(LIGHT_PIN));
}

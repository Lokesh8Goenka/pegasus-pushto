# Pegasus Push-To finder

A tilt sensor on the telescope tube tells a phone app where the tube is pointing.
The app shows how far to tilt up or down, and which number to turn to on a paper dial,
to reach the Moon, a planet or a bright star. You push the telescope by hand.

For the PieMatrix Pegasus 76700 on its Alt-Az fork mount. Nothing on the mount is modified.

## Parts
- Arduino Uno + USB A-B cable
- MPU6050 tilt sensor (GY-521 board), header pins soldered
- 4 male-female jumper wires (7 with the light sensor)
- USB OTG adapter for the phone
- Optional: Robomart-03 light sensor
- Printed paper dial strip, clear tape, a small pointer (toothpick or wire)

## Wiring

| MPU6050 pin | Uno pin |
|---|---|
| VCC | 5V |
| GND | GND |
| SCL | A5 |
| SDA | A4 |

Optional light sensor: VCC → 5V, GND → GND, analog output → A0.

## Upload the firmware (once, from the laptop)

```bash
arduino-cli board list
```

```bash
arduino-cli compile --fqbn arduino:avr:uno --upload -p COM5 arduino/pushto
```

Replace `COM5` with the port shown by the first command.

## Fit the sensor
- Tape or strap the sensor flat on top of the tube, with the **X arrow printed on the board
  pointing along the tube**. Either direction along the tube works; the app detects which.
- It must not wobble. Keep the wires loose enough that the tube can tilt freely.

## Fit the dial
1. Open the app's Settings → "Print the degree strip", enter the length around the post, print at 100%.
2. Tape the strip around the part of the vertical post that stays still.
3. Tape a pointer to the part that turns with the fork, so its tip sits on the strip.
4. Turn the telescope to the right. If the number under the pointer goes **down**, tick
   "Dial numbers go down when the telescope turns right" in Settings.

## Use
1. Level the tripod. Plug the Uno into the phone with the OTG adapter.
2. Open the app in Chrome and tap **Connect sensor**, then pick the Arduino.
3. Find a bright target by hand (Moon or Jupiter) and centre it in the eyepiece.
4. Select it in the app, tap **Sync on this target**, type the dial number.
5. Pick any other target. Tilt until the up/down card turns green, turn to the dial number shown.
6. Sync again whenever the tripod is moved. Re-syncing on a target near the next one improves accuracy.

Expect to land within about 1–2°: inside the finder scope and usually inside the 25 mm eyepiece.

## Run the app
- Local test on the laptop: `python -m http.server 8765 --directory web`, then open
  http://localhost:8765 in Chrome. Settings → Demo mode works with no hardware.
- Phone: the app must be served over https (for example Vercel, with `web/` as the site folder).
  After the first visit it works offline; "Add to Home screen" installs it.

## Files
- `arduino/pushto/pushto.ino` — sensor firmware
- `web/` — the app (plain HTML/JS, no build step); `web/dial.html` prints the dial strip
- `shopping-list.md` — earlier motorised-mount plan, parked for later

## Never point the telescope at the Sun. The Sun is not in the target list on purpose.

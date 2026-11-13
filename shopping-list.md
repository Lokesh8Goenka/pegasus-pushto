# Pegasus SmartTrack — one shopping list

Buy once, build a working two-axis motorised tracking mount. GoTo comes later in software,
using the same hardware.

## Final goal (this build)
A removable add-on for the Pegasus 76700 fork mount:
1. **Laptop control** — arrow-key jog for both axes, speed select, STOP.
2. **Sync** — point at a bright object (Moon / Jupiter), centre it by hand or jog, press "Sync".
3. **Track** — the laptop calculates where the object moves; the motors follow so it stays in
   the 10 mm eyepiece (70×, ~0.7° view) for **10+ minutes**.
4. **No permanent changes** — nothing drilled or cut; clamps and printed parts only.
5. **GoTo-ready** — motors, resolution and limit switches chosen so GoTo is a software upgrade.

## Drive design
- **Azimuth (left/right):** a ~120 mm plywood ring with a GT2 belt wrapped teeth-out round it,
  clamped on the fixed vertical post. A NEMA 17 bolted under the fork arm rides around it with a 20-tooth pulley.
  About 6:1 reduction, ~17 arcsec per microstep at 1/64 microstepping.
- **Altitude (up/down):** replace the chrome slide rod with a motorised lead screw
  (NEMA 17 with built-in T8 screw). Same pivot points as the chrome rod.
  ~3 arcsec per microstep, and it holds the tube in place when power is off.
  Limit: altitude range is roughly what the chrome rod allows today (no straight-up viewing).

## Measure first (10 minutes, needed for the printed parts)
- [ ] Diameter of the vertical post below the fork (vernier or wrap a paper strip, divide by π)
- [ ] Chrome rod: diameter, total length, and the distance between its two pivot points
      with the tube level and with the tube at its highest angle
- [ ] Photo of both ends of the chrome rod with a ruler beside them
- [ ] Tube weight (weigh yourself with and without it)

## Shopping list

### Electronics
| Item | Qty | Approx ₹ | Notes |
|---|---|---|---|
| NEMA 17 stepper, 17HS4401 (1.7 A, 4-wire) | 1 | 450–600 | Azimuth |
| NEMA 17 stepper **with integrated T8 lead screw, 300 mm** + T8 brass nut | 1 | 1,200–1,600 | Altitude. Ask for "lead screw stepper 300mm T8x8" |
| Extra T8 brass nut (lead 8 mm) | 1 | 60–100 | Spare / test |
| TMC2209 stepper driver (with heatsink) | 3 | 300–400 each | 2 + 1 spare. Silent and smooth at slow tracking speeds. A4988 (₹120) works but is rougher |
| Arduino CNC Shield V3 | 1 | 150–250 | Plugs on the Uno, holds the drivers, screw terminal for 12 V |
| 12 V 3 A regulated DC adapter (5.5 mm barrel) | 1 | 350–450 | Two motors need more than 2 A |
| DC barrel jack to screw-terminal adapter | 1 | 20–40 | |
| Inline rocker/toggle switch for 12 V line | 1 | 30–60 | Hardware power cut — always within reach |
| 100 µF 25 V electrolytic capacitor | 3 | 10 | Across 12 V at the shield |
| Micro limit switch (with lever) | 4 | 15–25 each | End stops, 2 per axis |
| 4-core cable, 2 m (or stepper extension cables) | 2 | 100–150 | Motor leads to the board |
| Jumper wires M-F + M-M | 1 set | 80–120 | Limit switches |
| USB-B cable, 1.5 m+ | 1 | 100 | Only if you don't have a long one |

### Optional starter (for writing code before the main parts arrive)
| Item | Qty | Approx ₹ | Notes |
|---|---|---|---|
| 28BYJ-48 stepper + ULN2003 driver board | 1 | 150–250 | Bench/learning only — too weak and too much gear play to drive the telescope |

### Mechanical
| Item | Qty | Approx ₹ | Notes |
|---|---|---|---|
| GT2 open timing belt, 6 mm wide | 2 m | 120–180 | Azimuth |
| GT2 20-tooth pulley, 5 mm bore | 2 | 70–100 each | 1 + spare |
| GT2 smooth idler 20T, 5 mm bore | 2 | 60–80 each | Belt tension, if needed |
| NEMA 17 L-mounting bracket (steel) | 2 | 80–120 each | |
| Stainless hose clamps (jubilee clips), assorted 20–60 mm | 6 | 20–40 each | Non-destructive clamping to post / fork |
| Rubber strip / old cycle tube | — | — | Under clamps so paint isn't scratched |
| M3 / M4 / M5 screw + nut + washer assortment | 1 | 200–300 | |
| Cable ties + spiral wrap | 1 pack | 80 | Cable management on the rotating fork |

### Custom parts — no 3D printer needed (hardware shop + carpenter)
| Part | How | Approx ₹ |
|---|---|---|
| Azimuth ring | Carpenter cuts a ~120 mm disc from 12–18 mm plywood/MDF with a centre hole = post diameter, then saws it in half. Two bolts clamp the halves on the post. GT2 belt wrapped **teeth-out** round the rim, ends fixed with small screws | 100–250 |
| T8 nut holder block (KFL/POM type) | Off-the-shelf "T8 lead screw nut housing" | 80–150 |
| Aluminium flat strip 25×3 mm, 1 m + L-angle 25×25 mm, 0.5 m | Cut and drill into the altitude motor bracket and nut arm | 150–250 |
| Small door hinge or M5 bolt + nylock nuts | Pivots for the altitude motor and nut arm | 50 |
| Plastic electrical junction box (~150×110 mm) | Box for Uno + shield | 80–150 |
Tools for this: hacksaw, hand drill with 3–6 mm bits, file. Borrow if you don't have them.

Optional: if you'd rather have printed parts, online 3D-printing services ship in ~3–5 days.
I can make the model files once measurements are in.

### Tools (only if you don't have them)
| Item | Approx ₹ |
|---|---|
| Digital multimeter — needed to set driver current | 300–500 |
| Small screwdriver set | 150–250 |
| Vernier caliper (plastic is fine) | 150–300 |

## Estimated total
- Electronics: ~₹3,200–4,200
- Mechanical: ~₹1,000–1,500
- Custom parts (hardware shop + carpenter): ~₹450–850
- **Total: about ₹4,700–6,500** (tools extra)

## Not usable
- 4× drone coreless motors and 2× FA-130 hobby motors: too fast, no torque, no position control.

## Later, for GoTo (don't buy now)
- Magnetic encoder (AS5600) per axis for absolute position
- Possibly a full belt/worm drive for altitude to reach high angles

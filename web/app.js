'use strict';

const $ = (id) => document.getElementById(id);
const mod360 = (x) => ((x % 360) + 360) % 360;
const ON_TARGET_DEG = 0.4;
const STALE_MS = 2000;

// ---- Saved settings -------------------------------------------------------

const DEFAULTS = {
  lat: 32.1109, lon: 76.5363,   // Palampur
  target: 'Moon',
  altOffset: 0,                 // added to the sensor angle to get true altitude
  flip: 1,                      // -1 if the sensor is mounted facing backwards
  altSynced: false,
  azOffset: null,               // true azimuth minus dial reading; null = not synced
  dialReversed: false,
  lightOn: false,
};

function loadSettings() {
  try {
    return Object.assign({}, DEFAULTS, JSON.parse(localStorage.getItem('pegasus') || '{}'));
  } catch (e) {
    return Object.assign({}, DEFAULTS);
  }
}
function saveSettings() {
  try { localStorage.setItem('pegasus', JSON.stringify(settings)); } catch (e) {}
}

const settings = loadSettings();

// ---- Live state -----------------------------------------------------------

let link = null;
let linkKind = null;
let sensorAlt = null;     // smoothed raw tilt from the sensor, degrees
let light = null;
let lastDataAt = 0;
let mpuMissing = false;
let current = null;       // { alt, az } of the selected target

let linesSeen = 0;
let lastLine = '';

function onLine(line) {
  linesSeen++;
  lastLine = line;
  const parts = line.split(',');
  if (parts[0] === 'D' && parts.length >= 5) {
    const ax = +parts[1], ay = +parts[2], az = +parts[3];
    if (!isFinite(ax + ay + az)) return;
    // The sensor's X arrow lies along the tube, so gravity along X gives the tilt.
    const tilt = (Math.atan2(ax, Math.hypot(ay, az)) * 180) / Math.PI;
    // Smooth out hand shake: settles in about half a second.
    const now = Date.now();
    const blend = 1 - Math.exp(-(now - lastDataAt) / 200);
    sensorAlt = sensorAlt === null ? tilt : sensorAlt + blend * (tilt - sensorAlt);
    light = +parts[4];
    lastDataAt = now;
    mpuMissing = false;
  } else if (parts[0] === 'E') {
    mpuMissing = true;
    sensorAlt = null;
  }
}

function sensorLive() {
  return link && sensorAlt !== null && Date.now() - lastDataAt < STALE_MS;
}

async function connect(kind) {
  if (link) await disconnect();
  if (!kind) {
    showBanner('This browser cannot talk to USB devices. Open the app in Chrome.');
    return;
  }
  try {
    sensorAlt = null;
    linesSeen = 0; lastLine = '';
    link = await openLink(kind, onLine, onLinkClosed, () => +$('demoAlt').value);
    linkKind = kind;
    lastDataAt = Date.now();
    showBanner('');
  } catch (e) {
    link = null;
    if (e && e.name !== 'NotFoundError') showBanner('Could not connect: ' + e.message);
  }
  render();
}

async function disconnect() {
  const old = link;
  link = null; linkKind = null; sensorAlt = null;
  if (old) await old.close();
  $('demoBox').hidden = true;
  render();
}

function onLinkClosed() {
  link = null; linkKind = null; sensorAlt = null;
  showBanner('Sensor disconnected. Check the cable, then tap Connect.');
  render();
}

function showBanner(text) {
  $('banner').textContent = text;
  $('banner').hidden = !text;
}

// ---- Targets --------------------------------------------------------------

function selectedTarget() {
  return TARGETS.find((t) => t.name === settings.target) || TARGETS[0];
}

function buildTargetList() {
  const select = $('target');
  const now = new Date();
  select.textContent = '';
  let group = null, groupEl = null;
  for (const t of TARGETS) {
    if (t.group !== group) {
      group = t.group;
      groupEl = document.createElement('optgroup');
      groupEl.label = group;
      select.appendChild(groupEl);
    }
    const pos = targetAltAz(t, now, settings.lat, settings.lon);
    const option = document.createElement('option');
    option.value = t.name;
    option.textContent = pos.alt > 0 ? `${t.name}  (${Math.round(pos.alt)}° up)` : `${t.name}  (below horizon)`;
    groupEl.appendChild(option);
  }
  select.value = selectedTarget().name;
}

// ---- Screen ---------------------------------------------------------------

function render() {
  const t = selectedTarget();
  current = targetAltAz(t, new Date(), settings.lat, settings.lon);
  const up = current.alt > 0;

  $('tAlt').textContent = current.alt.toFixed(1) + '°';
  $('tAz').textContent = current.az.toFixed(1) + '°';
  $('tNote').textContent = up ? (current.alt < 10 ? 'Very low' : '') : 'Below horizon now';

  // Connection chip
  const chip = $('connBtn');
  chip.classList.toggle('on', !!link);
  chip.textContent = link ? (linkKind === 'demo' ? 'Demo mode' : 'Sensor on') : 'Connect sensor';

  if (link && mpuMissing) {
    showBanner('Arduino found, but the tilt sensor is not answering. Check the 4 wires (VCC, GND, SCL→A5, SDA→A4).');
  } else if (link && linkKind !== 'demo' && Date.now() - lastDataAt > STALE_MS) {
    showBanner('No data from the Arduino yet. Check that the firmware is uploaded.');
  } else if (link && $('banner').textContent.startsWith('No data') ||
             link && $('banner').textContent.startsWith('Arduino found')) {
    showBanner('');
  }

  // Up / down
  const altCard = $('altCard');
  if (!up) {
    altCard.classList.remove('ok');
    $('altArrow').textContent = '';
    $('altValue').textContent = '–';
    $('altHint').textContent = 'This target is below the horizon. Pick another.';
  } else if (sensorLive()) {
    const scopeAlt = settings.flip * sensorAlt + settings.altOffset;
    const diff = current.alt - scopeAlt;
    const onTarget = Math.abs(diff) < ON_TARGET_DEG;
    altCard.classList.toggle('ok', onTarget);
    $('altArrow').textContent = onTarget ? '●' : diff > 0 ? '▲' : '▼';
    $('altValue').textContent = Math.abs(diff).toFixed(1) + '°';
    $('altHint').textContent = (onTarget ? 'On target. ' : diff > 0 ? 'Tilt the tube up. ' : 'Tilt the tube down. ') +
      `Tube is at ${scopeAlt.toFixed(1)}°` + (settings.altSynced ? '.' : ' (not synced yet).');
  } else {
    altCard.classList.remove('ok');
    $('altArrow').textContent = '';
    $('altValue').textContent = current.alt.toFixed(1) + '°';
    $('altHint').textContent = 'No sensor: tilt the tube to this angle above level.';
  }

  // Left / right
  if (!up) {
    $('azValue').textContent = '–';
    $('azHint').textContent = '';
  } else if (settings.azOffset === null) {
    $('azValue').textContent = current.az.toFixed(0) + '°';
    $('azHint').textContent = 'Compass direction from north. Sync once to get a dial number.';
  } else {
    const sign = settings.dialReversed ? -1 : 1;
    const dial = mod360(sign * (current.az - settings.azOffset));
    $('azValue').textContent = dial.toFixed(1);
    $('azHint').textContent = 'Turn the telescope until the pointer is on this dial number.';
  }

  // Sync summary
  const bits = [];
  if (settings.altSynced) bits.push('up/down');
  if (settings.azOffset !== null) bits.push('dial');
  $('syncInfo').textContent = bits.length
    ? `Synced: ${bits.join(' and ')}. Sync again if the tripod is moved.`
    : 'Not synced. Centre a bright target by hand first, then sync.';

  $('diag').textContent = link
    ? `Link: ${linkKind}. Lines received: ${linesSeen}. Last: ${lastLine.slice(0, 40) || 'nothing yet'}`
    : 'Not connected.';

  // Light sensor
  $('lightCard').hidden = !(settings.lightOn && sensorLive());
  if (settings.lightOn && light !== null) {
    $('lightValue').textContent = light;
    $('lightBar').style.width = (light / 1023 * 100).toFixed(0) + '%';
  }
}

// ---- Sync -----------------------------------------------------------------

function openSync() {
  render();
  if (current.alt <= 0) {
    showBanner('Pick a target that is above the horizon before syncing.');
    return;
  }
  showBanner('');
  $('syncName').textContent = selectedTarget().name;
  $('syncDial').value = '';
  $('syncDlg').showModal();
}

function applySync() {
  const now = targetAltAz(selectedTarget(), new Date(), settings.lat, settings.lon);

  if (sensorLive()) {
    // Work out which way round the sensor is mounted, then store the offset.
    const flip = Math.abs(now.alt - sensorAlt) <= Math.abs(now.alt + sensorAlt) ? 1 : -1;
    settings.flip = flip;
    settings.altOffset = now.alt - flip * sensorAlt;
    settings.altSynced = true;
  }

  const dial = parseFloat($('syncDial').value);
  if (isFinite(dial)) {
    const sign = settings.dialReversed ? -1 : 1;
    settings.azOffset = mod360(now.az - sign * dial);
  }

  saveSettings();
  render();
}

// ---- Wiring up the page ---------------------------------------------------

function init() {
  $('lat').value = settings.lat;
  $('lon').value = settings.lon;
  $('dialRev').checked = settings.dialReversed;
  $('lightOn').checked = settings.lightOn;
  buildTargetList();

  $('target').addEventListener('change', (e) => {
    settings.target = e.target.value;
    saveSettings();
    render();
  });

  $('connBtn').addEventListener('click', () => (link ? disconnect() : connect(defaultLinkKind())));
  $('altConnBtn').addEventListener('click', () => {
    const other = defaultLinkKind() === 'usb' ? 'serial' : 'usb';
    const available = other === 'usb' ? navigator.usb : navigator.serial;
    connect(available ? other : null);
  });
  $('demoBtn').addEventListener('click', async () => {
    await connect('demo');
    $('demoBox').hidden = false;
  });
  $('demoAlt').addEventListener('input', (e) => { $('demoVal').textContent = e.target.value; });

  $('syncBtn').addEventListener('click', openSync);
  $('syncDlg').querySelector('form').addEventListener('submit', (e) => {
    if (e.submitter && e.submitter.value === 'ok') applySync();
  });

  const locationChanged = () => {
    const lat = parseFloat($('lat').value), lon = parseFloat($('lon').value);
    if (!(Math.abs(lat) <= 90 && Math.abs(lon) <= 180)) return;
    settings.lat = lat; settings.lon = lon;
    saveSettings();
    buildTargetList();
    render();
  };
  $('lat').addEventListener('change', locationChanged);
  $('lon').addEventListener('change', locationChanged);
  $('gpsBtn').addEventListener('click', () => {
    if (!navigator.geolocation) return showBanner('This phone did not give a location.');
    navigator.geolocation.getCurrentPosition((pos) => {
      $('lat').value = pos.coords.latitude.toFixed(4);
      $('lon').value = pos.coords.longitude.toFixed(4);
      locationChanged();
    }, () => showBanner('Location was not allowed. Type the latitude and longitude instead.'));
  });

  $('dialRev').addEventListener('change', (e) => {
    settings.dialReversed = e.target.checked;
    settings.azOffset = null;   // the old dial sync no longer applies
    saveSettings();
    render();
  });
  $('lightOn').addEventListener('change', (e) => {
    settings.lightOn = e.target.checked;
    saveSettings();
    render();
  });
  $('resetBtn').addEventListener('click', () => {
    settings.altOffset = 0; settings.flip = 1; settings.altSynced = false; settings.azOffset = null;
    saveSettings();
    render();
  });

  if (navigator.usb) navigator.usb.addEventListener('disconnect', () => { if (linkKind === 'usb') onLinkClosed(); });

  render();
  setInterval(render, 200);
  setInterval(buildTargetList, 60000);

  if ('serviceWorker' in navigator) navigator.serviceWorker.register('sw.js').catch(() => {});
}

init();

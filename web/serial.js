// Links to the Arduino. Three kinds, all with the same shape:
//   const link = await openLink(kind, onLine, onClose);   link.close()
// kind: 'usb'    — WebUSB, used on Android phones through an OTG adapter
//       'serial' — Web Serial, used in Chrome on a laptop
//       'demo'   — fake sensor driven by a slider
'use strict';

const BAUD = 115200;

function lineSplitter(onLine) {
  const decoder = new TextDecoder();
  let buffer = '';
  return (bytes) => {
    buffer += decoder.decode(bytes, { stream: true });
    let i;
    while ((i = buffer.indexOf('\n')) >= 0) {
      const line = buffer.slice(0, i).trim();
      buffer = buffer.slice(i + 1);
      if (line) onLine(line);
    }
  };
}

function defaultLinkKind() {
  const android = /Android/i.test(navigator.userAgent);
  if (android && navigator.usb) return 'usb';
  if (navigator.serial) return 'serial';
  if (navigator.usb) return 'usb';
  return null;
}

async function openSerialLink(onLine, onClose) {
  const port = await navigator.serial.requestPort();
  await port.open({ baudRate: BAUD });
  const reader = port.readable.getReader();
  const feed = lineSplitter(onLine);
  let closed = false;

  (async () => {
    try {
      for (;;) {
        const { value, done } = await reader.read();
        if (done) break;
        feed(value);
      }
    } catch (e) { /* cable pulled */ }
    if (!closed) { closed = true; onClose(); }
  })();

  return {
    async close() {
      closed = true;
      try { await reader.cancel(); } catch (e) {}
      try { await port.close(); } catch (e) {}
    },
  };
}

// The Uno's USB chip presents a standard "CDC" serial port: one control
// interface and one data interface with a bulk endpoint in each direction.
async function openUsbLink(onLine, onClose) {
  const device = await navigator.usb.requestDevice({ filters: [] });
  await device.open();
  if (!device.configuration) await device.selectConfiguration(1);

  let control = null, data = null;
  for (const iface of device.configuration.interfaces) {
    const cls = iface.alternate.interfaceClass;
    if (cls === 0x02 && !control) control = iface;
    if (cls === 0x0a && !data) data = iface;
  }
  if (!data) {
    await device.close();
    throw new Error("This board's USB chip isn't supported on the phone. Use Chrome on the laptop instead.");
  }
  const epIn = data.alternate.endpoints.find((e) => e.direction === 'in');

  if (control) {
    try { await device.claimInterface(control.interfaceNumber); } catch (e) {}
  }
  await device.claimInterface(data.interfaceNumber);

  const index = control ? control.interfaceNumber : 0;
  const coding = new Uint8Array([BAUD & 255, (BAUD >> 8) & 255, (BAUD >> 16) & 255, 0, 0, 0, 8]);
  await device.controlTransferOut(
    { requestType: 'class', recipient: 'interface', request: 0x20, value: 0, index }, coding);
  await device.controlTransferOut(
    { requestType: 'class', recipient: 'interface', request: 0x22, value: 0x03, index });

  const feed = lineSplitter(onLine);
  let closed = false;

  (async () => {
    try {
      while (!closed) {
        const result = await device.transferIn(epIn.endpointNumber, 64);
        if (result.data && result.data.byteLength) feed(new Uint8Array(result.data.buffer));
      }
    } catch (e) { /* cable pulled */ }
    if (!closed) { closed = true; onClose(); }
  })();

  return {
    async close() {
      closed = true;
      try { await device.close(); } catch (e) {}
    },
  };
}

// Fake sensor: produces the same lines the Arduino sends.
function openDemoLink(onLine, getAltDeg) {
  onLine('I,PEGASUS,1,mpu=1');
  const timer = setInterval(() => {
    const a = (getAltDeg() * Math.PI) / 180;
    const noise = () => (Math.random() - 0.5) * 60;
    const ax = Math.round(16384 * Math.sin(a) + noise());
    const az = Math.round(16384 * Math.cos(a) + noise());
    onLine(`D,${ax},${Math.round(noise())},${az},${200 + Math.round(noise() / 10)}`);
  }, 40);
  return { async close() { clearInterval(timer); } };
}

async function openLink(kind, onLine, onClose, getDemoAlt) {
  if (kind === 'demo') return openDemoLink(onLine, getDemoAlt);
  if (kind === 'usb') return openUsbLink(onLine, onClose);
  if (kind === 'serial') return openSerialLink(onLine, onClose);
  throw new Error('This browser cannot talk to USB devices. Use Chrome.');
}

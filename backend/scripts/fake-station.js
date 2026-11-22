//   npm run fake-station - sends a measurement every 10 s
//   npm run fake-station -- --backfill sends the last 24 hours at once

const BASE_URL = `http://localhost:${process.env.PORT || 3000}/api/v1`;
const STATION_ID = '11111111-1111-4111-8111-111111111111'; 
const INTERVAL_SECONDS = 10;

const headers = {
  'Content-Type': 'application/json',
  'x-api-key': process.env.API_KEY_EDGE,
};


const room = { co2: 600, voc: 100, pm25: 6, temperature: 22, humidity: 45, light: 450, pressure: 1013 };
let mode = 'DeepFocus';

function noise(value, amount) {
  return value + (Math.random() - 0.5) * 2 * amount;
}

function round(value, decimals) {
  const factor = 10 ** decimals;
  return Math.round(value * factor) / factor;
}

function nextMeasurement() {
  if (mode === 'VentilationAssist') {
    room.co2 -= 60;
    room.temperature -= 0.15;
    if (room.co2 <= 600) mode = 'DeepFocus'; 
  } else {
    room.co2 += 15;
    room.temperature += (22 - room.temperature) * 0.05;
    if (room.co2 >= 1200) mode = 'VentilationAssist'; 
  }

  return {
    co2: Math.round(noise(room.co2, 10)),
    voc: Math.round(noise(room.voc, 15)),
    pm25: round(noise(room.pm25, 1.5), 1),
    temperature: round(noise(room.temperature, 0.1), 1),
    humidity: round(noise(room.humidity, 1), 1),
    light: Math.round(noise(room.light, 30)),
    pressure: round(noise(room.pressure, 0.5), 1),
  };
}


async function call(method, path, body) {
  const response = await fetch(BASE_URL + path, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await response.json();
  if (!response.ok) {
    throw new Error(`${response.status} ${data.error?.code}: ${data.error?.message}`);
  }
  return data;
}

async function tick() {
  const measurements = nextMeasurement();
  const timestamp = new Date().toISOString();

  try {
    await call('POST', '/telemetry', { stationId: STATION_ID, timestamp, mode, measurements });
    console.log(
      `${timestamp.slice(11, 19)}  sent  CO2 ${measurements.co2} ppm  ` +
        `${measurements.temperature} °C  mode ${mode}`
    );

    const { commands } = await call('GET', `/control/pending?stationId=${STATION_ID}`);
    for (const command of commands) {
      console.log(`  received command: ${command.action}`, command.payload);
      if (command.action === 'SET_MODE') {
        mode = command.payload.mode;
      }
    }
  } catch (err) {
    console.error('Error:', err.message);
  }
}

async function backfill() {
  const STEP_MINUTES = 5;
  const count = (24 * 60) / STEP_MINUTES; // 288 records
  const records = [];

  for (let i = count; i > 0; i--) {
    const timestamp = new Date(Date.now() - i * STEP_MINUTES * 60 * 1000).toISOString();
    records.push({ timestamp, mode, measurements: nextMeasurement() });
  }

  const result = await call('POST', '/telemetry/batch', { stationId: STATION_ID, records });
  console.log(`Backfill done: ${result.savedCount} of ${records.length} records saved.`);
}


if (!process.env.API_KEY_EDGE) {
  console.error('API_KEY_EDGE is not set. Run this with: npm run fake-station');
  process.exit(1);
}

if (process.argv.includes('--backfill')) {
  backfill().catch((err) => {
    console.error('Backfill failed:', err.message);
    process.exitCode = 1;
  });
} else {
  console.log(`Fake station sending every ${INTERVAL_SECONDS} s. Stop with Ctrl+C.`);
  tick();
  setInterval(tick, INTERVAL_SECONDS * 1000);
}
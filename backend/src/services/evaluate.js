//   higher: higher values are worse   
//   lower:  lower values are worse    
//   range:  values outside a range are worse
const DEFAULT_LIMITS = {
  voc: { kind: 'higher', warn: 150, crit: 250 },          // VOC index
  pm25: { kind: 'higher', warn: 15, crit: 35 },           // µg/m³
  temperature: { kind: 'range', ok: [20, 24], warn: [18, 26] }, // °C
  humidity: { kind: 'range', ok: [40, 60], warn: [30, 70] },    // %
  light: { kind: 'lower', warn: 300, crit: 100 },          // lux
  pressure: { kind: 'range', ok: [980, 1040], warn: [960, 1060] }, // hPa
};

// How much each sensor counts in each score
const WEIGHTS = {
  focusReadiness: { co2: 0.44, light: 0.22, temperature: 0.17, voc: 0.17 },
  healthComfort: { co2: 0.3, pm25: 0.25, voc: 0.2, humidity: 0.15, temperature: 0.1 },
};

// Points per state
const POINTS = { OK: 100, WARN: 50, CRIT: 0 };

const INSIGHT_TEXTS = {
  co2: { high: { WARN: 'CO2 is elevated - ventilate', CRIT: 'CO2 is critical - open a window now' } },
  voc: { high: { WARN: 'VOC level is elevated - ventilate', CRIT: 'VOC level is very high - ventilate now' } },
  pm25: { high: { WARN: 'Fine dust (PM2.5) is elevated', CRIT: 'Fine dust (PM2.5) is very high - avoid opening windows toward traffic' } },
  temperature: {
    high: { WARN: 'It is getting warm', CRIT: 'It is too hot to concentrate well' },
    low: { WARN: 'It is getting cold - close the window?', CRIT: 'It is too cold - close the window' },
  },
  humidity: {
    high: { WARN: 'Humidity is high', CRIT: 'Humidity is very high' },
    low: { WARN: 'The air is dry - your eyes may burn', CRIT: 'The air is very dry' },
  },
  light: { low: { WARN: 'Light is low - turn on the desk lamp', CRIT: 'It is too dark to work - turn on the light' } },
  pressure: {
    high: { WARN: 'Air pressure is unusually high', CRIT: 'Air pressure is extremely high' },
    low: { WARN: 'Air pressure is unusually low', CRIT: 'Air pressure is extremely low' },
  },
};

function judge(value, limits) {
  if (limits.kind === 'higher') {
    if (value >= limits.crit) return { state: 'CRIT', direction: 'high' };
    if (value >= limits.warn) return { state: 'WARN', direction: 'high' };
    return { state: 'OK', direction: null };
  }
  if (limits.kind === 'lower') {
    if (value <= limits.crit) return { state: 'CRIT', direction: 'low' };
    if (value <= limits.warn) return { state: 'WARN', direction: 'low' };
    return { state: 'OK', direction: null };
  }

  const direction = value < limits.ok[0] ? 'low' : 'high';
  if (value >= limits.ok[0] && value <= limits.ok[1]) return { state: 'OK', direction: null };
  if (value >= limits.warn[0] && value <= limits.warn[1]) return { state: 'WARN', direction };
  return { state: 'CRIT', direction };
}

// Weighted average of the points
function calculateScore(states, weights) {
  let total = 0;
  let usedWeight = 0;
  for (const [sensor, weight] of Object.entries(weights)) {
    if (states[sensor] === 'IGNORED') continue;
    total += POINTS[states[sensor]] * weight;
    usedWeight += weight;
  }
  if (usedWeight === 0) return null; // every sensor ignored: no score
  return Math.round(total / usedWeight);
}

// Main function
function evaluateTelemetry(measurements, config) {
  const limits = {
    co2: { kind: 'higher', warn: config.thresholds.co2Warn, crit: config.thresholds.co2Crit },
    ...DEFAULT_LIMITS,
  };

  const states = {};
  const insights = [];

  for (const sensor of Object.keys(limits)) {
    if (config.masks[sensor] === 'MONITOR_ONLY') {
      states[sensor] = 'IGNORED';
      continue;
    }

    const { state, direction } = judge(measurements[sensor], limits[sensor]);
    states[sensor] = state;

    if (state !== 'OK') {
      insights.push(INSIGHT_TEXTS[sensor][direction][state]);
    }
  }

  const scores = {
    focusReadiness: calculateScore(states, WEIGHTS.focusReadiness),
    healthComfort: calculateScore(states, WEIGHTS.healthComfort),
  };

  return { states, scores, insights: insights.slice(0, 10) };
}

module.exports = { evaluateTelemetry };
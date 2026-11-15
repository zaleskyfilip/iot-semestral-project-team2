const measurements = {
  type: 'object',
  required: true,
  properties: {
    co2: { type: 'number', required: true },
    voc: { type: 'number', required: true },
    pm25: { type: 'number', required: true },
    temperature: { type: 'number', required: true },
    humidity: { type: 'number', required: true },
    light: { type: 'number', required: true },
    pressure: { type: 'number', required: true },
  },
};

const MODES = ['DeepFocus', 'StandardOffice', 'VentilationAssist', 'NightMode'];

// POST /api/telemetry
const receiveSchema = {
  stationId: { type: 'string', required: true, format: 'uuid' },
  timestamp: { type: 'string', required: true, format: 'date-time' },
  mode: { type: 'string', required: false, enum: MODES },
  measurements,
};

// GET /api/telemetry/history
const historySchema = {
  stationId: { type: 'string', required: true, format: 'uuid' },
  range: { type: 'string', required: false, enum: ['24h', '7d', '30d'] },
};

module.exports = { receiveSchema, historySchema, measurements, MODES };
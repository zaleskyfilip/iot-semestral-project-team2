const { MODES } = require('./telemetry-schemas');

const mask = { type: 'string', enum: ['ACTIVE', 'MONITOR_ONLY'] };
const threshold = { type: 'number', integer: true, min: 1 };

// GET /api/config
const getSchema = {
  stationId: { type: 'string', required: true, format: 'uuid' },
};

// PUT /api/config 
const updateSchema = {
  stationId: { type: 'string', required: true, format: 'uuid' },
  operatingMode: { type: 'string', enum: MODES },
  masks: {
    type: 'object',
    properties: {
      co2: mask,
      voc: mask,
      pm25: mask,
      temperature: mask,
      humidity: mask,
      light: mask,
      pressure: mask,
    },
  },
  thresholds: {
    type: 'object',
    properties: {
      co2Warn: threshold,
      co2Crit: threshold,
    },
  },
  schedule: {
    type: 'array',
    maxItems: 10,
    items: {
      type: 'object',
      properties: {
        from: { type: 'string', required: true, format: 'time' },
        to: { type: 'string', required: true, format: 'time' },
        mode: { type: 'string', required: true, enum: MODES },
      },
    },
  },
};

module.exports = { getSchema, updateSchema };
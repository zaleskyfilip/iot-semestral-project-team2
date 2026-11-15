const { MODES } = require('./telemetry-schemas');

const ACTIONS = ['SET_MODE', 'TEST_LED', 'TEST_BUZZER'];

// POST /api/control/action
const actionSchema = {
  stationId: { type: 'string', required: true, format: 'uuid' },
  action: { type: 'string', required: true, enum: ACTIONS },
  payload: {
    type: 'object',
    required: false,
    properties: {
      mode: { type: 'string', enum: MODES }, 
    },
  },
};

// GET /api/control/pending
const pendingSchema = {
  stationId: { type: 'string', required: true, format: 'uuid' },
};

module.exports = { actionSchema, pendingSchema };
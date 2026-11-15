// GET /api/config
const getSchema = {
  stationId: { type: 'string', required: true, format: 'uuid' },
};

module.exports = { getSchema };
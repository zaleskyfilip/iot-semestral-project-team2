// GET /api/dashboard/current
const currentSchema = {
  stationId: { type: 'string', required: true, format: 'uuid' },
};

module.exports = { currentSchema };
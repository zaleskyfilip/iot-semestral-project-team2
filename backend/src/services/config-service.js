const deviceConfigDao = require('../dao/device-config-dao');
const { validateInput } = require('../validation/validate');
const { getSchema } = require('../validation/config-schemas');
const AppError = require('../errors/app-error');

// GET /api/config
async function get(input) {
  // 1. Validate the input
  const warnings = validateInput(input, getSchema);

  // 2.1 Load the config
  const config = await deviceConfigDao.findByStationId(input.stationId);
  if (!config) {
    throw new AppError('configNotFound', 'Station has no config.', 404, {
      stationId: input.stationId,
    });
  }

  // 2.2 Build the output (only the fields from the documentation)
  const output = {
    stationId: config.stationId,
    operatingMode: config.operatingMode,
    masks: config.masks,
    thresholds: config.thresholds,
    schedule: config.schedule,
  };
  if (warnings.length > 0) {
    output.warnings = warnings;
  }
  return output;
}

module.exports = { get };
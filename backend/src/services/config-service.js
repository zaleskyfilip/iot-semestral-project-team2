const stationDao = require('../dao/station-dao');
const deviceConfigDao = require('../dao/device-config-dao');
const { validateInput } = require('../validation/validate');
const { getSchema, updateSchema } = require('../validation/config-schemas');
const AppError = require('../errors/app-error');

// GET /api/config
async function get(input) {

  const warnings = validateInput(input, getSchema);

 
  const config = await deviceConfigDao.findByStationId(input.stationId);
  if (!config) {
    throw new AppError('configNotFound', 'Station has no config.', 404, {
      stationId: input.stationId,
    });
  }


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

// PUT /api/config
async function update(input) {
  const warnings = validateInput(input, updateSchema);

  const station = await stationDao.findById(input.stationId);
  if (!station) {
    throw new AppError('stationNotFound', 'Station does not exist.', 404, {
      stationId: input.stationId,
    });
  }

  await deviceConfigDao.createDefault(input.stationId);
  const current = await deviceConfigDao.findByStationId(input.stationId);

  const merged = {
    operatingMode: input.operatingMode ?? current.operatingMode,
    masks: { ...current.masks, ...input.masks },
    thresholds: { ...current.thresholds, ...input.thresholds },
    schedule: input.schedule ?? current.schedule,
  };

  // the warning level must be below the critical level
  if (merged.thresholds.co2Warn >= merged.thresholds.co2Crit) {
    throw new AppError('invalidThresholds', 'co2Warn must be lower than co2Crit.', 400, {
      co2Warn: merged.thresholds.co2Warn,
      co2Crit: merged.thresholds.co2Crit,
    });
  }

  const saved = await deviceConfigDao.update(input.stationId, merged);

  const output = { status: 'OK', configId: saved.id };
  if (warnings.length > 0) {
    output.warnings = warnings;
  }
  return output;
}

module.exports = { get, update };
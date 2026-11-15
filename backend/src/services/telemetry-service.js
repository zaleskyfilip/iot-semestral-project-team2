const stationDao = require('../dao/station-dao');
const deviceConfigDao = require('../dao/device-config-dao');
const telemetryDao = require('../dao/telemetry-dao');
const { evaluateTelemetry } = require('./evaluate');
const { validateInput } = require('../validation/validate');
const { receiveSchema, historySchema } = require('../validation/telemetry-schemas');
const AppError = require('../errors/app-error');

// POST /api/telemetry 
async function receive(input) {
  
  const warnings = validateInput(input, receiveSchema);

  
  const station = await stationDao.findById(input.stationId);
  if (!station) {
    throw new AppError('stationNotFound', 'Station does not exist.', 404, {
      stationId: input.stationId,
    });
  }

  
  const config = await deviceConfigDao.findByStationId(input.stationId);
  if (!config) {
    throw new AppError('configNotFound', 'Station has no config.', 404, {
      stationId: input.stationId,
    });
  }

  
  const mode = input.mode ?? config.operatingMode;

  
  const { states, scores, insights } = evaluateTelemetry(input.measurements, config);

  
  const saved = await telemetryDao.create({
    stationId: input.stationId,
    timestamp: input.timestamp,
    mode,
    measurements: input.measurements,
    states,
    scores,
    insights,
  });

  if (!saved) {
    warnings.push({
      code: 'duplicateRecord',
      message: 'A record with this timestamp already exists. It was not saved again.',
      details: { stationId: input.stationId, timestamp: input.timestamp },
    });
  }

  
  await stationDao.updateStatus(input.stationId, 'ONLINE', new Date());

  
  const output = { status: 'OK', telemetryId: saved ? saved.id : null };
  if (warnings.length > 0) {
    output.warnings = warnings;
  }
  return output;
}

const RANGES = {
  '24h': { hours: 24, bucket: '15 minutes' },   // 96 points
  '7d': { hours: 24 * 7, bucket: '1 hour' },     // 168 points
  '30d': { hours: 24 * 30, bucket: '6 hours' },  // 120 points
};

// GET /api/telemetry/history
async function getHistory(input) {

  const warnings = validateInput(input, historySchema);

  const range = input.range ?? '24h';

  const station = await stationDao.findById(input.stationId);
  if (!station) {
    throw new AppError('stationNotFound', 'Station does not exist.', 404, {
      stationId: input.stationId,
    });
  }

  const { hours, bucket } = RANGES[range];
  const from = new Date(Date.now() - hours * 60 * 60 * 1000);

  const kpi = await telemetryDao.getKpis(input.stationId, from);

  const series = await telemetryDao.getSeries(input.stationId, from, bucket);

  const output = { stationId: input.stationId, range, kpi, series };
  if (warnings.length > 0) {
    output.warnings = warnings;
  }
  return output;
}

module.exports = { receive, getHistory };
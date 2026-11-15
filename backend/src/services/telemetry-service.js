const { pool } = require('../db');
const stationDao = require('../dao/station-dao');
const deviceConfigDao = require('../dao/device-config-dao');
const telemetryDao = require('../dao/telemetry-dao');
const { evaluateTelemetry } = require('./evaluate');
const { validateInput } = require('../validation/validate');
const { receiveSchema, batchSchema, historySchema } = require('../validation/telemetry-schemas');
const AppError = require('../errors/app-error');

async function loadConfig(stationId) {
  const station = await stationDao.findById(stationId);
  if (!station) {
    throw new AppError('stationNotFound', 'Station does not exist.', 404, { stationId });
  }

  const config = await deviceConfigDao.findByStationId(stationId);
  if (!config) {
    throw new AppError('configNotFound', 'Station has no config.', 404, { stationId });
  }
  return config;
}

// Evaluates one measurement and builds the complete record to save
function buildRecord(stationId, record, config) {
  const { states, scores, insights } = evaluateTelemetry(record.measurements, config);
  return {
    stationId,
    timestamp: record.timestamp,
    mode: record.mode ?? config.operatingMode, 
    measurements: record.measurements,
    states,
    scores,
    insights,
  };
}


async function receive(input) {

  const warnings = validateInput(input, receiveSchema);

  const config = await loadConfig(input.stationId);

  const record = buildRecord(input.stationId, input, config);
  const saved = await telemetryDao.create(record);

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

async function receiveBatch(input) {

  const warnings = validateInput(input, batchSchema);

  const config = await loadConfig(input.stationId);

  const records = input.records.map((record) => buildRecord(input.stationId, record, config));

  let savedCount = 0;
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    for (const record of records) {
      const saved = await telemetryDao.create(record, client);
      if (saved) savedCount++;
    }
    await client.query('COMMIT');
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }

  const skippedCount = records.length - savedCount;
  if (skippedCount > 0) {
    warnings.push({
      code: 'duplicateRecords',
      message: 'Some records already existed and were not saved again.',
      details: { skippedCount },
    });
  }

  await stationDao.updateStatus(input.stationId, 'ONLINE', new Date());

  const output = { status: 'OK', savedCount };
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

module.exports = { receive, receiveBatch, getHistory };
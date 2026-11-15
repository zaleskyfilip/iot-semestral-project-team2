const stationDao = require('../dao/station-dao');
const telemetryDao = require('../dao/telemetry-dao');
const { validateInput } = require('../validation/validate');
const { currentSchema } = require('../validation/dashboard-schemas');
const AppError = require('../errors/app-error');

// if a station hasnt sent anything for this long -> offline
const OFFLINE_AFTER_MINUTES = 5;

function getConnectionStatus(station) {
  if (!station.lastSeenAt) return 'OFFLINE';
  const minutesAgo = (Date.now() - station.lastSeenAt.getTime()) / 60000;
  return minutesAgo <= OFFLINE_AFTER_MINUTES ? 'ONLINE' : 'OFFLINE';
}

// GET /api/dashboard/current
async function getCurrent(input) {

  const warnings = validateInput(input, currentSchema);

  const station = await stationDao.findById(input.stationId);
  if (!station) {
    throw new AppError('stationNotFound', 'Station does not exist.', 404, {
      stationId: input.stationId,
    });
  }

  const latest = await telemetryDao.findLatestByStation(input.stationId);
  if (!latest) {
    throw new AppError('telemetryNotFound', 'Station has not sent any data yet.', 404, {
      stationId: input.stationId,
    });
  }

  const metrics = {};
  for (const sensor of Object.keys(latest.measurements)) {
    metrics[sensor] = {
      value: latest.measurements[sensor],
      state: latest.states[sensor],
    };
  }

  const output = {
    stationId: station.id,
    mode: latest.mode,
    connectionStatus: getConnectionStatus(station),
    lastUpdate: latest.timestamp,
    scores: latest.scores,
    metrics,
    insights: latest.insights,
  };
  if (warnings.length > 0) {
    output.warnings = warnings;
  }
  return output;
}

module.exports = { getCurrent };
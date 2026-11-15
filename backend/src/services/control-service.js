const stationDao = require('../dao/station-dao');
const deviceConfigDao = require('../dao/device-config-dao');
const deviceCommandDao = require('../dao/device-command-dao');
const { validateInput } = require('../validation/validate');
const { actionSchema, pendingSchema } = require('../validation/control-schemas');
const AppError = require('../errors/app-error');

async function checkStationExists(stationId) {
  const station = await stationDao.findById(stationId);
  if (!station) {
    throw new AppError('stationNotFound', 'Station does not exist.', 404, { stationId });
  }
}

// POST /api/control/action
async function sendAction(input) {

  const warnings = validateInput(input, actionSchema);

  const payload = input.payload ?? {};

  if (input.action === 'SET_MODE' && !payload.mode) {
    throw new AppError('modeMissing', 'SET_MODE requires payload.mode.', 400, {
      action: input.action,
    });
  }

  await checkStationExists(input.stationId);

  const command = await deviceCommandDao.create(input.stationId, input.action, payload);

  if (input.action === 'SET_MODE') {
    await deviceConfigDao.updateOperatingMode(input.stationId, payload.mode);
  }

  const output = { status: 'OK', commandId: command.id };
  if (warnings.length > 0) {
    output.warnings = warnings;
  }
  return output;
}

// GET /api/control/pending
async function takePending(input) {
  const warnings = validateInput(input, pendingSchema);
  await checkStationExists(input.stationId);

  const commands = await deviceCommandDao.takePending(input.stationId);

  const output = { commands };
  if (warnings.length > 0) {
    output.warnings = warnings;
  }
  return output;
}

module.exports = { sendAction, takePending };
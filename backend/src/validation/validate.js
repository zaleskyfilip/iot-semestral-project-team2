const AppError = require('../errors/app-error');

const DATE_TIME = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?(Z|[+-]\d{2}:\d{2})$/;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// Like typeof, but tells arrays and null apart from objects
function typeOf(value) {
  if (Array.isArray(value)) return 'array';
  if (value === null) return 'null';
  return typeof value;
}

// Checks every key of an object against its schema
function checkObject(schema, obj, path, result) {
  for (const key of Object.keys(obj)) {
    if (!(key in schema)) {
      result.unsupportedKeys.push(path + key);
    }
  }
  for (const [key, rule] of Object.entries(schema)) {
    checkValue(rule, obj[key], path + key, result);
  }
}

// Checks one value against one rule, e.g. { type: "number", required: true }
function checkValue(rule, value, keyPath, result) {
  if (value === undefined) {
    if (rule.required) {
      result.missingKeys[keyPath] = `Key '${keyPath}' is required.`;
    }
    return;
  }

  if (typeOf(value) !== rule.type) {
    result.invalidTypes[keyPath] = `Expected type '${rule.type}'.`;
    return;
  }

  if (rule.format === 'date-time' && (!DATE_TIME.test(value) || isNaN(Date.parse(value)))) {
    result.invalidValues[keyPath] = 'Expected an ISO date-time, e.g. 2026-11-06T10:30:00Z.';
  }
  if (rule.format === 'uuid' && !UUID.test(value)) {
    result.invalidValues[keyPath] = 'Expected a UUID.';
  }
  if (rule.enum && !rule.enum.includes(value)) {
    result.invalidValues[keyPath] = `Expected one of: ${rule.enum.join(', ')}.`;
  }

  if (rule.type === 'object' && rule.properties) {
    checkObject(rule.properties, value, `${keyPath}.`, result);
  }

  if (rule.type === 'array') {
    if (rule.minItems !== undefined && value.length < rule.minItems) {
      result.invalidValues[keyPath] = `Expected at least ${rule.minItems} item(s).`;
    }
    if (rule.maxItems !== undefined && value.length > rule.maxItems) {
      result.invalidValues[keyPath] = `Expected at most ${rule.maxItems} item(s).`;
    }
    if (rule.items) {
      value.forEach((item, i) => checkValue(rule.items, item, `${keyPath}[${i}]`, result));
    }
  }
}

// The validation step from the Command List (steps 1.1 - 1.3)
// Returns a list of warnings, or throws an AppError if the input is invalid.
function validateInput(input, schema) {
  const result = {
    unsupportedKeys: [],
    invalidTypes: {},
    invalidValues: {},
    missingKeys: {},
  };

  if (typeOf(input) !== 'object') {
    result.invalidTypes.input = "Expected type 'object'.";
  } else {
    checkObject(schema, input, '', result);
  }

  // Error: the input is not valid, so the request stops here
  const hasErrors =
    Object.keys(result.invalidTypes).length > 0 ||
    Object.keys(result.invalidValues).length > 0 ||
    Object.keys(result.missingKeys).length > 0;

  if (hasErrors) {
    throw new AppError('invalidInput', 'Input is not valid.', 400, {
      invalidTypes: result.invalidTypes,
      invalidValues: result.invalidValues,
      missingKeys: result.missingKeys,
    });
  }

  // Warning: unknown keys are ignored, but the request continues
  const warnings = [];
  if (result.unsupportedKeys.length > 0) {
    warnings.push({
      code: 'unsupportedKeys',
      message: 'Input contains unsupported keys. They were ignored.',
      details: { unsupportedKeys: result.unsupportedKeys },
    });
  }
  return warnings;
}

module.exports = { validateInput };
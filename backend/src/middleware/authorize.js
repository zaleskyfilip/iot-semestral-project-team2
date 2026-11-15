const AppError = require('../errors/app-error');

for (const name of ['API_KEY_USER', 'API_KEY_ADMIN', 'API_KEY_EDGE']) {
  if (!process.env[name]) {
    throw new Error(`${name} is not set. Did you add it to backend/.env?`);
  }
}

const ROLE_BY_KEY = new Map([
  [process.env.API_KEY_USER, 'USER'],
  [process.env.API_KEY_ADMIN, 'ADMIN'],
  [process.env.API_KEY_EDGE, 'EDGE'],
]);

function authorize(...allowedRoles) {
  return (req, res, next) => {
    const key = req.get('x-api-key');
    const role = ROLE_BY_KEY.get(key);
 
    if (!role) {
      throw new AppError('unauthorized', 'Missing or invalid API key.', 401);
    }

    if (!allowedRoles.includes(role)) {
      throw new AppError('forbidden', `Role ${role} is not allowed to call this endpoint.`, 403, {
        role,
        allowedRoles,
      });
    }

    req.role = role; 
    next();         
  };
}

module.exports = { authorize };
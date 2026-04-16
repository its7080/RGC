function isObject(value) {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function makeValidator(validateFn) {
  return (req, res, next) => {
    const result = validateFn(req.body);
    if (result.ok) {
      req.body = result.value;
      return next();
    }

    return res.status(400).json({ error: 'Invalid request payload', details: result.details });
  };
}

export const validateLoginBody = makeValidator((body) => {
  if (!isObject(body)) return { ok: false, details: ['Body must be an object'] };
  if (typeof body.username !== 'string' || body.username.length < 3 || body.username.length > 64) {
    return { ok: false, details: ['username must be a string between 3 and 64 characters'] };
  }
  if (typeof body.password !== 'string' || body.password.length < 6 || body.password.length > 128) {
    return { ok: false, details: ['password must be a string between 6 and 128 characters'] };
  }
  return { ok: true, value: { username: body.username, password: body.password } };
});

export const validateRefreshBody = makeValidator((body) => {
  if (!isObject(body) || typeof body.refreshToken !== 'string' || body.refreshToken.length < 20) {
    return { ok: false, details: ['refreshToken must be a non-empty token string'] };
  }
  return { ok: true, value: { refreshToken: body.refreshToken } };
});

export const validateBetBody = makeValidator((body) => {
  if (!isObject(body)) return { ok: false, details: ['Body must be an object'] };
  const wager = Number(body.wager);
  if (typeof body.gameType !== 'string' || body.gameType.length < 3 || body.gameType.length > 32) {
    return { ok: false, details: ['gameType must be a string between 3 and 32 characters'] };
  }
  if (typeof body.option !== 'string' || body.option.length < 1 || body.option.length > 32) {
    return { ok: false, details: ['option must be a string between 1 and 32 characters'] };
  }
  if (!Number.isInteger(wager) || wager <= 0) {
    return { ok: false, details: ['wager must be a positive integer'] };
  }
  return { ok: true, value: { gameType: body.gameType, option: body.option, wager } };
});

export const validateQrBody = makeValidator((body) => {
  if (!isObject(body) || typeof body.qrToken !== 'string' || body.qrToken.length < 10) {
    return { ok: false, details: ['qrToken must be a string'] };
  }
  return { ok: true, value: { qrToken: body.qrToken } };
});

export const validateAdjustCoinsBody = makeValidator((body) => {
  if (!isObject(body) || !Number.isInteger(body.delta) || body.delta === 0) {
    return { ok: false, details: ['delta must be a non-zero integer'] };
  }
  return { ok: true, value: { delta: body.delta } };
});

export const validateCreateAdminBody = makeValidator((body) => {
  if (!isObject(body)) return { ok: false, details: ['Body must be an object'] };
  if (typeof body.username !== 'string' || body.username.length < 3 || body.username.length > 64) {
    return { ok: false, details: ['username must be a string between 3 and 64 characters'] };
  }
  if (typeof body.password !== 'string' || body.password.length < 10 || body.password.length > 128) {
    return { ok: false, details: ['password must be a string between 10 and 128 characters'] };
  }
  return { ok: true, value: { username: body.username, password: body.password } };
});

export const validateSuperConfigBody = makeValidator((body) => {
  if (!isObject(body)) return { ok: false, details: ['Body must be an object'] };

  const next = {};
  if (Object.hasOwn(body, 'maintenanceMode')) {
    if (typeof body.maintenanceMode !== 'boolean') {
      return { ok: false, details: ['maintenanceMode must be a boolean'] };
    }
    next.maintenanceMode = body.maintenanceMode;
  }

  if (Object.hasOwn(body, 'roundDurationSeconds')) {
    if (!Number.isInteger(body.roundDurationSeconds) || body.roundDurationSeconds < 10 || body.roundDurationSeconds > 600) {
      return { ok: false, details: ['roundDurationSeconds must be an integer between 10 and 600'] };
    }
    next.roundDurationSeconds = body.roundDurationSeconds;
  }

  if (Object.hasOwn(body, 'gameAvailability')) {
    if (!isObject(body.gameAvailability)) return { ok: false, details: ['gameAvailability must be an object'] };
    const allBoolean = Object.values(body.gameAvailability).every((value) => typeof value === 'boolean');
    if (!allBoolean) return { ok: false, details: ['gameAvailability values must be booleans'] };
    next.gameAvailability = body.gameAvailability;
  }

  if (Object.keys(next).length === 0) {
    return { ok: false, details: ['At least one config field must be provided'] };
  }

  return { ok: true, value: next };
});

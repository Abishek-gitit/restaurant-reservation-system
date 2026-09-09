const env = require('../config/env');
const { errorResponse } = require('../utils/apiResponse');

const errorHandler = (err, req, res, next) => {
  let statusCode = err.statusCode || 500;
  let message = err.message || 'Internal server error';
  let errorCode = err.errorCode || 'INTERNAL_SERVER_ERROR';
  let details = err.details || null;

  // Handle Mongoose CastError (Invalid MongoDB ObjectId)
  if (err.name === 'CastError') {
    statusCode = 400;
    message = `Invalid format for field '${err.path}': '${err.value}' is not a valid ObjectId.`;
    errorCode = 'INVALID_ID';
  }

  // Handle MongoDB duplicate key error (code 11000)
  if (err.code === 11000) {
    statusCode = 409;
    const field = Object.keys(err.keyValue || {})[0] || 'field';
    const val = err.keyValue ? err.keyValue[field] : '';
    message = `Duplicate value '${val}' for '${field}'. A record with this value already exists.`;
    errorCode = 'CONFLICT';
  }

  // Handle Mongoose ValidationError
  if (err.name === 'ValidationError') {
    statusCode = 400;
    errorCode = 'VALIDATION_ERROR';
    const errors = Object.values(err.errors).map((el) => ({
      field: el.path,
      message: el.message
    }));
    message = errors[0]?.message || 'Validation failed';
    details = errors;
  }

  // Handle JWT errors
  if (err.name === 'JsonWebTokenError') {
    statusCode = 401;
    message = 'Invalid authentication token. Please log in again.';
    errorCode = 'UNAUTHORIZED';
  }

  if (err.name === 'TokenExpiredError') {
    statusCode = 401;
    message = 'Authentication token has expired. Please log in again.';
    errorCode = 'UNAUTHORIZED';
  }

  // Log non-operational/500 errors in development
  if (statusCode === 500) {
    console.error('[Unhandled Error]:', err);
  }

  return errorResponse(res, statusCode, message, errorCode, details);
};

module.exports = errorHandler;

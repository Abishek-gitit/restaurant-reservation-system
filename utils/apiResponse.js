/**
 * Standard API response utility functions
 */

const successResponse = (res, statusCode = 200, message = 'Success', data = null) => {
  const response = {
    success: true,
    message
  };

  if (data !== null && data !== undefined) {
    response.data = data;
  }

  return res.status(statusCode).json(response);
};

const errorResponse = (res, statusCode = 500, message = 'Internal server error', errorCode = 'INTERNAL_SERVER_ERROR', details = null) => {
  const response = {
    success: false,
    message,
    errorCode
  };

  if (details !== null && details !== undefined) {
    response.details = details;
  }

  return res.status(statusCode).json(response);
};

module.exports = {
  successResponse,
  errorResponse
};

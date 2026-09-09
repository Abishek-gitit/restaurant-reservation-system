const AppError = require('../utils/appError');

/**
 * Higher-order middleware to validate req[source] (body, query, params) against a Joi schema
 * @param {Joi.Schema} schema - The Joi schema to validate against
 * @param {'body'|'query'|'params'} source - The request property to validate
 */
const validate = (schema, source = 'body') => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req[source], {
      abortEarly: false,
      stripUnknown: false
    });

    if (error) {
      const details = error.details.map((detail) => ({
        field: detail.path.join('.'),
        message: detail.message.replace(/['"]/g, '')
      }));

      const primaryMessage = details[0]?.message || 'Validation failed';
      return next(new AppError(primaryMessage, 400, 'VALIDATION_ERROR', details));
    }

    // Replace request data with validated data (e.g. trimmed, defaulted)
    req[source] = value;
    next();
  };
};

module.exports = validate;

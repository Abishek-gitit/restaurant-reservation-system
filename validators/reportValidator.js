const Joi = require('joi');
const { objectIdSchema } = require('./commonValidator');

const reportQuerySchema = Joi.object({
  branchId: objectIdSchema,
  from: Joi.string().isoDate().messages({
    'string.isoDate': 'From date must be a valid ISO format (YYYY-MM-DD)'
  }),
  to: Joi.string().isoDate().messages({
    'string.isoDate': 'To date must be a valid ISO format (YYYY-MM-DD)'
  }),
  limit: Joi.number().integer().min(1).max(50).default(10)
});

module.exports = {
  reportQuerySchema
};

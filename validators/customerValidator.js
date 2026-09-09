const Joi = require('joi');
const { objectIdSchema } = require('./commonValidator');

const customerOrdersQuerySchema = Joi.object({
  branchId: objectIdSchema,
  status: Joi.string().valid('PLACED', 'PREPARING', 'READY', 'SERVED', 'DELIVERED', 'CANCELLED'),
  orderType: Joi.string().valid('DINE_IN', 'TAKEAWAY'),
  from: Joi.string().isoDate().messages({
    'string.isoDate': 'From date must be a valid ISO format'
  }),
  to: Joi.string().isoDate().messages({
    'string.isoDate': 'To date must be a valid ISO format'
  }),
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(50).default(10)
});

const customerReservationsQuerySchema = Joi.object({
  branchId: objectIdSchema,
  status: Joi.string().valid('PENDING', 'CONFIRMED', 'CANCELLED', 'COMPLETED'),
  from: Joi.string().isoDate().messages({
    'string.isoDate': 'From date must be a valid ISO format'
  }),
  to: Joi.string().isoDate().messages({
    'string.isoDate': 'To date must be a valid ISO format'
  }),
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(50).default(10)
});

module.exports = {
  customerOrdersQuerySchema,
  customerReservationsQuerySchema
};

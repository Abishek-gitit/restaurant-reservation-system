const Joi = require('joi');
const { objectIdSchema } = require('./commonValidator');

const createOrderSchema = Joi.object({
  branchId: objectIdSchema.required().messages({
    'any.required': 'Branch ID is required'
  }),
  orderType: Joi.string().valid('DINE_IN', 'TAKEAWAY').required().messages({
    'any.only': 'Order type must be either DINE_IN or TAKEAWAY',
    'any.required': 'Order type is required'
  }),
  tableId: objectIdSchema.allow(null),
  reservationId: objectIdSchema.allow(null),
  items: Joi.array()
    .items(
      Joi.object({
        menuItemId: objectIdSchema.required().messages({
          'any.required': 'Menu item ID is required'
        }),
        quantity: Joi.number().integer().min(1).max(50).required().messages({
          'number.min': 'Quantity must be at least 1',
          'number.max': 'Quantity cannot exceed 50',
          'any.required': 'Quantity is required'
        })
      })
    )
    .min(1)
    .required()
    .messages({
      'array.min': 'Order must contain at least one item',
      'any.required': 'Order items are required'
    })
});

const updateOrderStatusSchema = Joi.object({
  status: Joi.string()
    .valid('PLACED', 'PREPARING', 'READY', 'SERVED', 'DELIVERED', 'CANCELLED')
    .required()
    .messages({
      'any.only': 'Invalid order status',
      'any.required': 'Status is required'
    }),
  remarks: Joi.string().trim().max(255).allow('', null)
});

const getOrdersQuerySchema = Joi.object({
  branchId: objectIdSchema,
  status: Joi.string().valid('PLACED', 'PREPARING', 'READY', 'SERVED', 'DELIVERED', 'CANCELLED'),
  orderType: Joi.string().valid('DINE_IN', 'TAKEAWAY'),
  date: Joi.string().isoDate()
});

module.exports = {
  createOrderSchema,
  updateOrderStatusSchema,
  getOrdersQuerySchema
};

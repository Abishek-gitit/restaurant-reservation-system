const Joi = require('joi');
const { objectIdSchema } = require('./commonValidator');

const createReservationSchema = Joi.object({
  branchId: objectIdSchema.required().messages({
    'any.required': 'Branch ID is required'
  }),
  tableId: objectIdSchema.required().messages({
    'any.required': 'Table ID is required'
  }),
  dateTime: Joi.date().iso().greater('now').required().messages({
    'date.greater': 'Reservation date and time must be in the future',
    'date.format': 'Reservation date and time must be a valid ISO format',
    'any.required': 'Reservation date and time are required'
  }),
  duration: Joi.number().integer().min(30).max(180).default(90).messages({
    'number.min': 'Duration must be at least 30 minutes',
    'number.max': 'Duration cannot exceed 180 minutes'
  })
});

const updateReservationSchema = Joi.object({
  dateTime: Joi.date().iso().greater('now').messages({
    'date.greater': 'Rescheduled date and time must be in the future'
  }),
  duration: Joi.number().integer().min(30).max(180).messages({
    'number.min': 'Duration must be at least 30 minutes',
    'number.max': 'Duration cannot exceed 180 minutes'
  }),
  status: Joi.string().valid('PENDING', 'CONFIRMED', 'CANCELLED', 'COMPLETED')
}).min(1).messages({
  'object.min': 'At least one field must be provided for update'
});

const getReservationsQuerySchema = Joi.object({
  branchId: objectIdSchema,
  tableId: objectIdSchema,
  customerId: objectIdSchema,
  status: Joi.string().valid('PENDING', 'CONFIRMED', 'CANCELLED', 'COMPLETED'),
  date: Joi.string().isoDate()
});

const cancelReservationSchema = Joi.object({
  remarks: Joi.string().trim().max(255).allow('', null)
});

const rescheduleReservationSchema = Joi.object({
  dateTime: Joi.date().iso().greater('now').required().messages({
    'date.greater': 'Rescheduled date and time must be in the future',
    'any.required': 'Rescheduled date and time are required'
  }),
  duration: Joi.number().integer().min(30).max(180).messages({
    'number.min': 'Duration must be at least 30 minutes',
    'number.max': 'Duration cannot exceed 180 minutes'
  }),
  remarks: Joi.string().trim().max(255).allow('', null)
});

module.exports = {
  createReservationSchema,
  updateReservationSchema,
  getReservationsQuerySchema,
  cancelReservationSchema,
  rescheduleReservationSchema
};

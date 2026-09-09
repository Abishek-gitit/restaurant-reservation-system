const Joi = require('joi');
const { objectIdSchema } = require('./commonValidator');

const createFeedbackSchema = Joi.object({
  orderId: objectIdSchema.required().messages({
    'any.required': 'Order ID is required'
  }),
  rating: Joi.number().integer().min(1).max(5).required().messages({
    'number.base': 'Rating must be a number',
    'number.integer': 'Rating must be an integer between 1 and 5',
    'number.min': 'Rating must be at least 1',
    'number.max': 'Rating cannot exceed 5',
    'any.required': 'Rating is required'
  }),
  comment: Joi.string().trim().max(500).allow('', null).messages({
    'string.max': 'Comment cannot exceed 500 characters'
  })
});

const updateFeedbackSchema = Joi.object({
  rating: Joi.number().integer().min(1).max(5).messages({
    'number.base': 'Rating must be a number',
    'number.integer': 'Rating must be an integer between 1 and 5',
    'number.min': 'Rating must be at least 1',
    'number.max': 'Rating cannot exceed 5'
  }),
  comment: Joi.string().trim().max(500).allow('', null).messages({
    'string.max': 'Comment cannot exceed 500 characters'
  })
}).min(1).messages({
  'object.min': 'At least one field (rating or comment) must be provided for update'
});

module.exports = {
  createFeedbackSchema,
  updateFeedbackSchema
};

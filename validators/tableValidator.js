const Joi = require('joi');
const { objectIdSchema } = require('./commonValidator');

const createTableSchema = Joi.object({
  branchId: objectIdSchema.required().messages({
    'any.required': 'Branch ID is required'
  }),
  tableNumber: Joi.number().integer().min(1).required().messages({
    'number.base': 'Table number must be an integer',
    'number.min': 'Table number must be at least 1',
    'any.required': 'Table number is required'
  }),
  capacity: Joi.number().integer().min(1).required().messages({
    'number.base': 'Capacity must be an integer',
    'number.min': 'Capacity must be at least 1',
    'any.required': 'Capacity is required'
  })
});

const updateTableSchema = Joi.object({
  tableNumber: Joi.number().integer().min(1).messages({
    'number.base': 'Table number must be an integer',
    'number.min': 'Table number must be at least 1'
  }),
  capacity: Joi.number().integer().min(1).messages({
    'number.base': 'Capacity must be an integer',
    'number.min': 'Capacity must be at least 1'
  })
}).min(1).messages({
  'object.min': 'At least one field must be provided for update'
});

const getTablesQuerySchema = Joi.object({
  branchId: objectIdSchema
});

module.exports = {
  createTableSchema,
  updateTableSchema,
  getTablesQuerySchema
};

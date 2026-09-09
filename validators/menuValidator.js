const Joi = require('joi');
const { objectIdSchema } = require('./commonValidator');

const createMenuItemSchema = Joi.object({
  branchId: objectIdSchema.required().messages({
    'any.required': 'Branch ID is required'
  }),
  name: Joi.string().trim().min(2).max(100).required().messages({
    'string.empty': 'Menu item name is required',
    'string.min': 'Menu item name must be at least 2 characters long',
    'any.required': 'Menu item name is required'
  }),
  category: Joi.string().trim().min(2).max(50).required().messages({
    'string.empty': 'Category is required',
    'string.min': 'Category must be at least 2 characters long',
    'any.required': 'Category is required'
  }),
  price: Joi.number().greater(0).precision(2).required().messages({
    'number.base': 'Price must be a number',
    'number.greater': 'Price must be greater than 0',
    'any.required': 'Price is required'
  }),
  isAvailable: Joi.boolean().default(true)
});

const updateMenuItemSchema = Joi.object({
  name: Joi.string().trim().min(2).max(100),
  category: Joi.string().trim().min(2).max(50),
  price: Joi.number().greater(0).precision(2).messages({
    'number.greater': 'Price must be greater than 0'
  }),
  isAvailable: Joi.boolean()
}).min(1).messages({
  'object.min': 'At least one field must be provided for update'
});

const getMenuQuerySchema = Joi.object({
  branchId: objectIdSchema,
  category: Joi.string().trim()
});

module.exports = {
  createMenuItemSchema,
  updateMenuItemSchema,
  getMenuQuerySchema
};

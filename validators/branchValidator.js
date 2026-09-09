const Joi = require('joi');

const createBranchSchema = Joi.object({
  name: Joi.string().trim().min(3).max(100).required().messages({
    'string.empty': 'Branch name is required',
    'string.min': 'Branch name must be at least 3 characters long',
    'any.required': 'Branch name is required'
  }),
  address: Joi.string().trim().min(5).max(255).required().messages({
    'string.empty': 'Branch address is required',
    'string.min': 'Address must be at least 5 characters long',
    'any.required': 'Branch address is required'
  }),
  seatingCapacity: Joi.number().integer().min(1).required().messages({
    'number.base': 'Seating capacity must be a number',
    'number.min': 'Seating capacity must be at least 1',
    'any.required': 'Seating capacity is required'
  })
});

const updateBranchSchema = Joi.object({
  name: Joi.string().trim().min(3).max(100).messages({
    'string.min': 'Branch name must be at least 3 characters long'
  }),
  address: Joi.string().trim().min(5).max(255).messages({
    'string.min': 'Address must be at least 5 characters long'
  }),
  seatingCapacity: Joi.number().integer().min(1).messages({
    'number.base': 'Seating capacity must be a number',
    'number.min': 'Seating capacity must be at least 1'
  })
}).min(1).messages({
  'object.min': 'At least one field must be provided for update'
});

const updateBranchStatusSchema = Joi.object({
  isActive: Joi.boolean().required().messages({
    'boolean.base': 'isActive must be a boolean (true or false)',
    'any.required': 'isActive status is required'
  })
});

module.exports = {
  createBranchSchema,
  updateBranchSchema,
  updateBranchStatusSchema
};


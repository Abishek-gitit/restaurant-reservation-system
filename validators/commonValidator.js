const Joi = require('joi');

const objectIdPattern = /^[0-9a-fA-F]{24}$/;

const objectIdSchema = Joi.string()
  .pattern(objectIdPattern)
  .message('Invalid ID format. Must be a 24-character hexadecimal ObjectId');

const idParamSchema = Joi.object({
  id: objectIdSchema.required()
});

module.exports = {
  objectIdSchema,
  idParamSchema
};

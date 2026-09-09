const express = require('express');
const menuController = require('../controllers/menuController');
const auth = require('../middleware/auth');
const authorize = require('../middleware/authorize');
const validate = require('../middleware/validate');
const { idParamSchema } = require('../validators/commonValidator');
const {
  createMenuItemSchema,
  updateMenuItemSchema,
  getMenuQuerySchema
} = require('../validators/menuValidator');

const router = express.Router();

router
  .route('/')
  .post(
    auth,
    authorize('admin', 'manager'),
    validate(createMenuItemSchema),
    menuController.createMenuItem
  )
  .get(validate(getMenuQuerySchema, 'query'), menuController.getMenuItems);

router
  .route('/:id')
  .get(validate(idParamSchema, 'params'), menuController.getMenuItemById)
  .put(
    auth,
    authorize('admin', 'manager'),
    validate(idParamSchema, 'params'),
    validate(updateMenuItemSchema),
    menuController.updateMenuItem
  )
  .delete(
    auth,
    authorize('admin', 'manager'),
    validate(idParamSchema, 'params'),
    menuController.deleteMenuItem
  );

module.exports = router;

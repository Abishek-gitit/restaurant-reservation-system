const express = require('express');
const tableController = require('../controllers/tableController');
const auth = require('../middleware/auth');
const authorize = require('../middleware/authorize');
const validate = require('../middleware/validate');
const { idParamSchema } = require('../validators/commonValidator');
const {
  createTableSchema,
  updateTableSchema,
  getTablesQuerySchema
} = require('../validators/tableValidator');

const router = express.Router();

router
  .route('/')
  .post(
    auth,
    authorize('admin', 'manager'),
    validate(createTableSchema),
    tableController.createTable
  )
  .get(validate(getTablesQuerySchema, 'query'), tableController.getTables);

router
  .route('/:id')
  .get(validate(idParamSchema, 'params'), tableController.getTableById)
  .put(
    auth,
    authorize('admin', 'manager'),
    validate(idParamSchema, 'params'),
    validate(updateTableSchema),
    tableController.updateTable
  )
  .delete(
    auth,
    authorize('admin', 'manager'),
    validate(idParamSchema, 'params'),
    tableController.deleteTable
  );

module.exports = router;

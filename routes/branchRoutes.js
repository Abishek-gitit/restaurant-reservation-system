const express = require('express');
const branchController = require('../controllers/branchController');
const auth = require('../middleware/auth');
const authorize = require('../middleware/authorize');
const validate = require('../middleware/validate');
const { idParamSchema } = require('../validators/commonValidator');
const {
  createBranchSchema,
  updateBranchSchema,
  updateBranchStatusSchema
} = require('../validators/branchValidator');
const { authorizeBranchAccess } = require('../middleware/authorizeBranchAccess');

const router = express.Router();

router
  .route('/')
  .post(
    auth,
    authorize('admin', 'manager'),
    validate(createBranchSchema),
    branchController.createBranch
  )
  .get(branchController.getBranches);

router
  .route('/:id/status')
  .put(
    auth,
    authorize('admin', 'manager'),
    authorizeBranchAccess(),
    validate(idParamSchema, 'params'),
    validate(updateBranchStatusSchema),
    branchController.updateBranchStatus
  );

router
  .route('/:id')
  .get(validate(idParamSchema, 'params'), branchController.getBranchById)
  .put(
    auth,
    authorize('admin', 'manager'),
    authorizeBranchAccess(),
    validate(idParamSchema, 'params'),
    validate(updateBranchSchema),
    branchController.updateBranch
  )
  .delete(
    auth,
    authorize('admin', 'manager'),
    authorizeBranchAccess(),
    validate(idParamSchema, 'params'),
    branchController.deleteBranch
  );

module.exports = router;

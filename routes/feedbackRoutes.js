const express = require('express');
const feedbackController = require('../controllers/feedbackController');
const auth = require('../middleware/auth');
const validate = require('../middleware/validate');
const { idParamSchema } = require('../validators/commonValidator');
const {
  createFeedbackSchema,
  updateFeedbackSchema
} = require('../validators/feedbackValidator');

const router = express.Router();

router.post(
  '/',
  auth,
  validate(createFeedbackSchema),
  feedbackController.createFeedback
);

router
  .route('/:id')
  .get(
    auth,
    validate(idParamSchema, 'params'),
    feedbackController.getFeedbackById
  )
  .put(
    auth,
    validate(idParamSchema, 'params'),
    validate(updateFeedbackSchema),
    feedbackController.updateFeedback
  )
  .delete(
    auth,
    validate(idParamSchema, 'params'),
    feedbackController.deleteFeedback
  );

module.exports = router;

import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { createRubricSchema, submitEvaluationSchema } from '../validators/milestone';
import {
  createRubric,
  getRubrics,
  submitEvaluation,
  getEvaluation,
  getWorkspaceEvaluations,
} from '../controllers/evaluationController';

const router = Router();

router.use(authenticate);

// Admin rubric management
router.post('/admin/rubrics', authorize('ADMIN'), validate(createRubricSchema), createRubric);
router.get('/admin/rubrics', authorize('ADMIN'), getRubrics);

// Evaluation operations
router.post('/milestones/:id/evaluate', authorize('SUPERVISOR'), validate(submitEvaluationSchema), submitEvaluation);
router.get('/evaluations/:id', getEvaluation);
router.get('/workspaces/:workspaceId/evaluations', getWorkspaceEvaluations);

export default router;

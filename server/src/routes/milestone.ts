import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { upload } from '../utils/upload';
import {
  createTemplateSchema,
  createMilestoneSchema,
  applyTemplateSchema,
  updateMilestoneSchema,
  submitDeliverableSchema,
  reviewSubmissionSchema,
} from '../validators/milestone';
import {
  createTemplate,
  getTemplates,
  getMilestones,
  createMilestone,
  applyTemplate,
  updateMilestone,
  submitDeliverable,
  reviewSubmission,
} from '../controllers/milestoneController';

const router = Router();

router.use(authenticate);

// Admin template management
router.post('/admin/milestone-templates', authorize('ADMIN'), validate(createTemplateSchema), createTemplate);
router.get('/admin/milestone-templates', authorize('ADMIN'), getTemplates);

// Workspace milestones
router.get('/workspaces/:workspaceId/milestones', getMilestones);
router.post('/workspaces/:workspaceId/milestones', authorize('SUPERVISOR', 'ADMIN'), validate(createMilestoneSchema), createMilestone);
router.post('/workspaces/:workspaceId/milestones/from-template', validate(applyTemplateSchema), applyTemplate);

// Single milestone operations
router.put('/milestones/:id', validate(updateMilestoneSchema), updateMilestone);
router.post('/milestones/:id/submissions', authorize('STUDENT'), upload.single('file'), validate(submitDeliverableSchema), submitDeliverable);

// Submission review
router.put('/submissions/:id/review', authorize('SUPERVISOR'), validate(reviewSubmissionSchema), reviewSubmission);

export default router;

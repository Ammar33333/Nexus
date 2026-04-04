import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth';
import { validate } from '../middleware/validate';
import {
  createProposalSchema,
  updateProposalSchema,
  submitProposalSchema,
  reviewProposalSchema,
  adminReviewProposalSchema,
  proposalCommentSchema,
} from '../validators/proposal';
import {
  createProposal,
  getProposal,
  updateProposal,
  submitProposal,
  supervisorReviewProposal,
  addComment,
  getSupervisorProposals,
  getAdminProposals,
  adminReviewProposal,
} from '../controllers/proposalController';

const router = Router();

router.post('/workspaces/:workspaceId/proposals', authenticate, authorize('STUDENT'), validate(createProposalSchema), createProposal);
router.get('/proposals/:id', authenticate, getProposal);
router.put('/proposals/:id', authenticate, authorize('STUDENT'), validate(updateProposalSchema), updateProposal);
router.post('/proposals/:id/submit', authenticate, authorize('STUDENT'), validate(submitProposalSchema), submitProposal);
router.post('/proposals/:id/review', authenticate, authorize('SUPERVISOR'), validate(reviewProposalSchema), supervisorReviewProposal);
router.post('/proposals/:versionId/comments', authenticate, validate(proposalCommentSchema), addComment);
router.get('/supervisor/proposals', authenticate, authorize('SUPERVISOR'), getSupervisorProposals);
router.get('/admin/proposals', authenticate, authorize('ADMIN'), getAdminProposals);
router.post('/admin/proposals/:id/review', authenticate, authorize('ADMIN'), validate(adminReviewProposalSchema), adminReviewProposal);

export default router;

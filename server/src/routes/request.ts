import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { sendRequestSchema, respondRequestSchema, requestMessageSchema } from '../validators/project';
import {
  sendRequest,
  getStudentRequests,
  getSupervisorRequests,
  respondToRequest,
  sendMessage,
} from '../controllers/requestController';

const router = Router();

router.post('/', authenticate, authorize('STUDENT'), validate(sendRequestSchema), sendRequest);
router.get('/student', authenticate, authorize('STUDENT'), getStudentRequests);
router.get('/supervisor', authenticate, authorize('SUPERVISOR'), getSupervisorRequests);
router.put('/:id/respond', authenticate, authorize('SUPERVISOR'), validate(respondRequestSchema), respondToRequest);
router.post('/:id/messages', authenticate, validate(requestMessageSchema), sendMessage);

export default router;

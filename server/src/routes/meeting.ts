import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth';
import { validate } from '../middleware/validate';
import {
  scheduleMeetingSchema,
  updateMeetingSchema,
  meetingLogSchema,
} from '../validators/milestone';
import {
  scheduleMeeting,
  getMeetings,
  updateMeeting,
  addMeetingLog,
} from '../controllers/meetingController';

const router = Router();

router.use(authenticate);

router.post('/workspaces/:workspaceId/meetings', validate(scheduleMeetingSchema), scheduleMeeting);
router.get('/workspaces/:workspaceId/meetings', getMeetings);
router.put('/meetings/:id', validate(updateMeetingSchema), updateMeeting);
router.post('/meetings/:id/log', authorize('SUPERVISOR'), validate(meetingLogSchema), addMeetingLog);

export default router;

import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth';
import { getMatches } from '../controllers/matchingController';

const router = Router();

router.get('/:projectId', authenticate, authorize('STUDENT'), getMatches);

export default router;

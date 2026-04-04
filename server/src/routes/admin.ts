import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth';
import {
  getSession,
  updateSession,
  getSettings,
  updateSettings,
} from '../controllers/adminController';

const router = Router();

router.use(authenticate, authorize('ADMIN'));

router.get('/session', getSession);
router.put('/session', updateSession);
router.get('/settings', getSettings);
router.put('/settings', updateSettings);

export default router;

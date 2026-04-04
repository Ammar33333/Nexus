import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth';
import {
  getProfile,
  updateProfile,
  getPublicProfile,
} from '../controllers/supervisorController';

const router = Router();

router.get('/profile/:id', getPublicProfile);
router.get('/profile', authenticate, authorize('SUPERVISOR'), getProfile);
router.put('/profile', authenticate, authorize('SUPERVISOR'), updateProfile);

export default router;

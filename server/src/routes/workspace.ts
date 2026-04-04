import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { getWorkspace } from '../controllers/workspaceController';

const router = Router();

router.use(authenticate);

router.get('/:id', getWorkspace);

export default router;

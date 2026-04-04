import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { createProjectSchema } from '../validators/project';
import { createProject, getMyProjects, getProject } from '../controllers/projectController';

const router = Router();

router.post('/', authenticate, authorize('STUDENT'), validate(createProjectSchema), createProject);
router.get('/me', authenticate, authorize('STUDENT'), getMyProjects);
router.get('/:id', authenticate, getProject);

export default router;

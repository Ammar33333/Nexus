import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth';
import { validate } from '../middleware/validate';
import {
  lockGradesSchema,
  justifyGradeSchema,
  reassignSupervisorSchema,
} from '../validators/milestone';
import {
  getDashboard,
  lockGrades,
  requestJustification,
  generateReport,
  reassignSupervisor,
} from '../controllers/adminDashboardController';

const router = Router();

router.use(authenticate);
router.use(authorize('ADMIN'));

router.get('/dashboard', getDashboard);
router.post('/grades/lock', validate(lockGradesSchema), lockGrades);
router.post('/grades/:id/justify', validate(justifyGradeSchema), requestJustification);
router.get('/reports', generateReport);
router.put('/workspaces/:id/reassign', validate(reassignSupervisorSchema), reassignSupervisor);

export default router;

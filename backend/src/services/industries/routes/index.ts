import { Router } from 'express';
import { validate } from '../../../middlewares/validate';
import { authenticateToken } from '../../../middlewares/auth';
import { CreateIndustrySchema } from '../validator/schema';
import { IndustryController } from '../controller/industry-controller';

const router: Router = Router();

// Semua endpoint industri butuh login.
router.use(authenticateToken);

// GET /api/v1/industries — semua user yang sudah login.
router.get('/', IndustryController.list);

// POST /api/v1/industries — izin workspace.manage_industries di salah
// satu workspace yang diikuti (dicek service, spec §9.2), kecuali
// pemanggil yang belum mengikuti workspace apa pun (alur workspace
// pertama — ia belum bisa memiliki izin workspace apa pun).
router.post('/', validate(CreateIndustrySchema), IndustryController.create);

// GET /api/v1/industries/:id/project-suggestions — semua user.
router.get('/:id/project-suggestions', IndustryController.suggestions);

export default router;

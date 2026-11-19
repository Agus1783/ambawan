import { Router } from 'express';
import { authenticateToken } from '../../../middlewares/auth';
import { InvitationController } from '../controller/invitation-controller';

const router: Router = Router();

// Semua endpoint undangan di sini butuh login. Token undangan ada
// di path; workspace-nya di-resolve dari undangan itu sendiri
// (bukan dari param route), jadi tidak memakai `authorize`.
router.use(authenticateToken);

// POST /api/v1/invitations/:token/accept
router.post('/:token/accept', InvitationController.accept);

// POST /api/v1/invitations/:token/decline
router.post('/:token/decline', InvitationController.decline);

// POST /api/v1/invitations/:id/resend
router.post('/:id/resend', InvitationController.resend);

export default router;

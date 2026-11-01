import { Router } from 'express';
import multer from 'multer';
import { verifyAuth } from '../middleware/verifyAuth.js';
import { getMyProfile, updateMyProfile, uploadAvatar, getPublicProfile } from '../controllers/profiles.controller.js';

const upload = multer({ storage: multer.memoryStorage() });

const router = Router();

router.get('/me', verifyAuth, getMyProfile);
router.patch('/me', verifyAuth, updateMyProfile);
router.post('/me/avatar', verifyAuth, upload.single('avatar'), uploadAvatar);
router.get('/:userId', verifyAuth, getPublicProfile);

export default router;
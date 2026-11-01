import { Router } from 'express';
import { verifyAuth } from '../middleware/verifyAuth.js';
import { createJoinRequest, getJoinRequestsForProject, updateJoinRequestStatus, getMyRequestForProject } from '../controllers/joinRequests.controller.js';

const router = Router({ mergeParams: true });

router.post('/', verifyAuth, createJoinRequest);
router.get('/', verifyAuth, getJoinRequestsForProject);
router.get('/mine', verifyAuth, getMyRequestForProject);
router.patch('/:requestId', verifyAuth, updateJoinRequestStatus);

export default router;
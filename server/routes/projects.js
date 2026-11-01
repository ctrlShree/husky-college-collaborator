import { Router } from 'express';
import multer from 'multer';
import { verifyAuth } from '../middleware/verifyAuth.js';
import {
  getProjects,
  createProject,
  getMyProjects,
  uploadProjectImages,
  getProjectsForUser,
  getProjectById,
  updateProject,
  deleteProject,
  removeProjectImage
} from '../controllers/projects.controller.js';
import joinRequestsRouter from './joinRequests.js';

const upload = multer({ storage: multer.memoryStorage() });

const router = Router();

router.get('/', getProjects);
router.get('/mine', verifyAuth, getMyProjects);
router.get('/member/:userId', verifyAuth, getProjectsForUser);
router.get('/:id', getProjectById);
router.post('/', verifyAuth, createProject);
router.post('/:projectId/images', verifyAuth, upload.array('images', 5), uploadProjectImages);
router.patch('/:id', verifyAuth, updateProject);
router.delete('/:id', verifyAuth, deleteProject);
router.delete('/:id/images', verifyAuth, removeProjectImage);
router.use('/:projectId/requests', joinRequestsRouter);

export default router;
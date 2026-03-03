import express from 'express';
import { register, login, getProfile, updateProfile, changePassword, verifyToken } from '../controllers/authController.js';
import { getAllPatients, getAllDoctors, getAllAdmins, verifyDoctor } from '../controllers/adminController.js';
import { protect } from '../middlewares/authMiddleware.js';

const router = express.Router();

// Admin auth
router.post('/register', register);
router.post('/login', login);
router.get('/profile', protect, getProfile);
router.put('/profile', protect, updateProfile);
router.put('/change-password', protect, changePassword);

// Token verification — used by API Gateway
router.get('/verify', verifyToken);

// User management (admin only)
router.get('/users/patients', protect, getAllPatients);
router.get('/users/doctors',  protect, getAllDoctors);
router.get('/users/admins',   protect, getAllAdmins);
router.put('/users/doctors/:id/verify', protect, verifyDoctor);

export default router;

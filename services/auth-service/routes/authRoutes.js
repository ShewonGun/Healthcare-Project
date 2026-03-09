import express from 'express';
import {
  registerPatient, registerDoctor, registerAdmin,
  loginPatient,    loginDoctor,    loginAdmin,
  logout, verifyToken,
} from '../controllers/authController.js';

const router = express.Router();

// ── Patient ───────────────────────────────────────────────────────────────────
router.post('/patient/register', registerPatient);
router.post('/patient/login',    loginPatient);

// ── Doctor ────────────────────────────────────────────────────────────────────
router.post('/doctor/register', registerDoctor);
router.post('/doctor/login',    loginDoctor);

// ── Admin ─────────────────────────────────────────────────────────────────────
router.post('/admin/register', registerAdmin);
router.post('/admin/login',    loginAdmin);

// ── Shared ────────────────────────────────────────────────────────────────────
router.post('/logout',  logout);
router.get('/verify',   verifyToken);

export default router;

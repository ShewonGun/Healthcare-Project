import axios from "axios";

// Base URL is empty so Vite proxy forwards /api → http://localhost:3000
const api = axios.create({
  baseURL: "/api",
  headers: { "Content-Type": "application/json" },
});

// Attach JWT automatically if present
api.interceptors.request.use((config) => {
  try {
    const user = JSON.parse(localStorage.getItem("hcp_user"));
    if (user?.token) {
      config.headers.Authorization = `Bearer ${user.token}`;
    }
  } catch {
    // nothing
  }
  return config;
});

// ── Auth endpoints ────────────────────────────────────────────────────────────
export const authAPI = {
  login:    (role, body) => api.post(`/auth/${role}/login`,    body),
  register: (role, body) => api.post(`/auth/${role}/register`, body),
  logout:   ()           => api.post('/auth/logout'),
};

// ── Patient endpoints ─────────────────────────────────────────────────────────
export const patientAPI = {
  getProfile: () => api.get("/patients/profile"),
  updateProfile: (body) => api.put("/patients/profile", body),
  changePassword: (body) => api.put("/patients/change-password", body),
  uploadImage: (formData) =>
    api.put("/patients/profile/image", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    }),
};

// ── Appointment endpoints ─────────────────────────────────────────────────────
export const appointmentAPI = {
  // Patient
  markPaid: (id) => api.put(`/appointments/${id}/mark-paid`),
  book: (body) => api.post("/appointments", body),
  getMine: () => api.get("/appointments/my"),
  // Doctor
  getDoctorMine: () => api.get("/appointments/doctor/my"),
  updateStatus: (id, body) => api.put(`/appointments/${id}/status`, body),
  addNotes: (id, body) => api.put(`/appointments/${id}/notes`, body),
  uploadPrescription: (id, formData) =>
    api.post(`/appointments/${id}/prescription`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    }),
  deletePrescription: (id) => api.delete(`/appointments/${id}/prescription`),
  // Shared
  getById: (id) => api.get(`/appointments/${id}`),
  cancel: (id, body) => api.put(`/appointments/${id}/cancel`, body),
};

// ── Doctor endpoints ──────────────────────────────────────────────────────────
export const doctorAPI = {
  getAll: () => api.get("/doctors"),
  getById: (id) => api.get(`/doctors/${id}`),
  // Doctor self-service (authenticated)
  getProfile: () => api.get("/doctors/profile"),
  updateProfile: (body) => api.put("/doctors/profile", body),
  changePassword: (body) => api.put("/doctors/change-password", body),
  uploadImage: (formData) =>
    api.put("/doctors/profile/image", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    }),
  toggleAvailability: () => api.put("/doctors/availability"),
  // Doctor accessing patient data
  getPatientDetails: (patientId) => api.get(`/doctors/patients/${patientId}`),
  getPatientReports: (patientId) =>
    api.get(`/doctors/patients/${patientId}/reports`),
};

// ── Payment endpoints ─────────────────────────────────────────────────────────
export const paymentAPI = {
  createIntent: (body) => api.post("/payments/create-intent", body),
  confirmTest: (body) => api.post("/payments/confirm-test", body),
  getByAppointment: (appointmentId) =>
    api.get(`/payments/appointment/${appointmentId}`),
  getMine: () => api.get("/payments/my"),
  getDoctorPayments: () => api.get("/payments/doctor/my"),
  getById: (id) => api.get(`/payments/${id}`),
};

// ── Report endpoints ──────────────────────────────────────────────────────────
export const reportAPI = {
  upload: (formData) =>
    api.post("/reports", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    }),
  getMine: () => api.get("/reports"),
  getById: (id) => api.get(`/reports/${id}`),
  delete: (id) => api.delete(`/reports/${id}`),
};

// ── Telemedicine endpoints ────────────────────────────────────────────────────
export const telemedicineAPI = {
  createSession: (body) => api.post("/telemedicine/sessions", body),
  getByAppointment: (apptId) =>
    api.get(`/telemedicine/sessions/appointment/${apptId}`),
  getSession: (sessionId) => api.get(`/telemedicine/sessions/${sessionId}`),
  getMySessions: () => api.get("/telemedicine/sessions"),
  generateToken: (sessionId) =>
    api.post(`/telemedicine/sessions/${sessionId}/token`),
  joinSession: (sessionId) =>
    api.put(`/telemedicine/sessions/${sessionId}/join`),
  endSession: (sessionId, body) =>
    api.put(`/telemedicine/sessions/${sessionId}/end`, body),
  cancelSession: (sessionId) =>
    api.put(`/telemedicine/sessions/${sessionId}/cancel`),
};

// ── Admin endpoints ──────────────────────────────────────────────────────────
export const adminAPI = {
  getProfile: () => api.get('/admin/profile'),
  updateProfile: (body) => api.put('/admin/profile', body),
  changePassword: (body) => api.put('/admin/change-password', body),
  getAllDoctors: () => api.get("/admin/users/doctors"),
  getAllPatients: () => api.get("/admin/users/patients"),
  getAllAdmins: () => api.get("/admin/users/admins"),
  createAdmin: (body) => api.post('/auth/admin/register', body),
  deleteAdmin: (id) => api.delete(`/admin/users/admins/${id}`),
  verifyDoctor: (id, body) =>
    api.put(`/admin/users/doctors/${id}/verify`, body),
  getAllAppointments: () => api.get("/appointments/admin/all"),
  getAllPayments: () => api.get("/payments/admin/all"),
  markCashPaid: (appointmentId, body) =>
    api.put(`/payments/admin/${appointmentId}/mark-cash-paid`, body),
};

// ── AI / Symptom Checker endpoints ───────────────────────────────────────────
export const aiAPI = {
  checkSymptoms: (body) => api.post("/ai/symptom-check", body),
  getHistory: () => api.get("/ai/symptom-check/history"),
  deleteCheck: (id) => api.delete(`/ai/symptom-check/${id}`),
};

export default api;

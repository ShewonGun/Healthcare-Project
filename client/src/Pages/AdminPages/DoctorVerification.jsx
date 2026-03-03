import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { adminAPI } from '../../utils/api';
import { FiAlertCircle, FiCheck, FiChevronLeft } from 'react-icons/fi';

const LabelValue = ({ label, value }) => (
  <div>
    <p className="text-xs text-gray-400 dark:text-gray-500 uppercase tracking-wide">{label}</p>
    <p className="text-sm text-gray-900 dark:text-white mt-0.5">{value || '—'}</p>
  </div>
);

const SectionHeading = ({ children }) => (
  <p className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-4">{children}</p>
);

const Toast = ({ toast }) => {
  if (!toast) return null;
  const isError = toast.type === 'error';
  return (
    <div
      className={`mb-5 flex items-start gap-3 rounded-md border px-4 py-3 ${
        isError
          ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
          : 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800'
      }`}
    >
      {isError
        ? <FiAlertCircle className="w-4 h-4 mt-0.5 shrink-0 text-red-500" />
        : <FiCheck className="w-4 h-4 mt-0.5 shrink-0 text-emerald-500" />
      }
      <p className={`text-sm ${isError ? 'text-red-700 dark:text-red-400' : 'text-emerald-700 dark:text-emerald-400'}`}>
        {toast.msg}
      </p>
    </div>
  );
};

const DoctorVerification = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [doctor, setDoctor] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [toast, setToast] = useState(null);

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  useEffect(() => {
    const fetchDoctor = async () => {
      setLoading(true);
      try {
        const res = await adminAPI.getAllDoctors();
        const all = res.data?.data || [];
        const found = all.find((d) => d._id === id);
        setDoctor(found || null);
      } catch {
        showToast('Could not load doctor details.', 'error');
      } finally {
        setLoading(false);
      }
    };
    fetchDoctor();
  }, [id]);

  const handleVerify = async (approve) => {
    setActionLoading(true);
    try {
      await adminAPI.verifyDoctor(id, { isVerified: approve });
      showToast(`Doctor ${approve ? 'approved' : 'verification revoked'} successfully.`);
      setDoctor((prev) => ({ ...prev, isVerified: approve }));
    } catch {
      showToast('Action failed. Please try again.', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 flex items-center justify-center min-h-64">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-indigo-600 border-t-transparent" />
      </div>
    );
  }

  if (!doctor) {
    return (
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 text-center">
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-md px-6 py-16">
          <p className="text-base font-medium text-gray-500">Doctor not found</p>
          <p className="text-sm text-gray-400 mt-1">The record may have been removed.</p>
          <button
            onClick={() => navigate('/admin/doctors')}
            className="mt-5 text-sm font-medium text-indigo-600 dark:text-indigo-400 hover:underline"
          >
            Back to doctors
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
      {/* Back */}
      <button
        onClick={() => navigate('/admin/doctors')}
        className="flex items-center gap-1.5 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 mb-5 transition"
      >
        <FiChevronLeft className="w-4 h-4" />
        Back to Doctors
      </button>

      {/* Toast */}
      <Toast toast={toast} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Profile card */}
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-md p-6 flex flex-col items-center text-center">
          {doctor.profileImage ? (
            <img
              src={doctor.profileImage}
              alt=""
              className="w-24 h-24 rounded-full object-cover border-2 border-indigo-200 dark:border-indigo-800 mb-4"
            />
          ) : (
            <div className="w-24 h-24 rounded-full border-2 border-indigo-200 dark:border-indigo-800 bg-indigo-100 dark:bg-indigo-900/40 flex items-center justify-center text-indigo-700 dark:text-indigo-300 text-3xl font-semibold mb-4">
              {doctor.firstName?.[0]?.toUpperCase() || 'D'}
            </div>
          )}
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Dr. {doctor.firstName} {doctor.lastName}
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{doctor.specialization}</p>
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">{doctor.email}</p>

          <span
            className={`mt-3 inline-flex items-center gap-1.5 text-[11px] font-semibold px-2 py-0.5 rounded border ${
              doctor.isVerified
                ? 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-400'
                : 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-400'
            }`}
          >
            <span className={`w-1.5 h-1.5 rounded-full ${doctor.isVerified ? 'bg-emerald-500' : 'bg-amber-500'}`} />
            {doctor.isVerified ? 'Verified' : 'Pending'}
          </span>

          {/* Actions */}
          <div className="flex gap-3 mt-5 w-full">
            {!doctor.isVerified ? (
              <button
                disabled={actionLoading}
                onClick={() => handleVerify(true)}
                className="flex-1 py-2 rounded-md bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold disabled:opacity-60 transition"
              >
                {actionLoading ? 'Processing…' : 'Approve'}
              </button>
            ) : (
              <button
                disabled={actionLoading}
                onClick={() => handleVerify(false)}
                className="flex-1 py-2 rounded-md text-sm font-semibold border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 disabled:opacity-60 transition"
              >
                {actionLoading ? 'Processing…' : 'Revoke'}
              </button>
            )}
          </div>
        </div>

        {/* Details */}
        <div className="lg:col-span-2 space-y-5">
          {/* Personal */}
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-md p-6">
            <SectionHeading>Personal Information</SectionHeading>
            <div className="grid grid-cols-2 gap-4">
              <LabelValue label="First Name" value={doctor.firstName} />
              <LabelValue label="Last Name" value={doctor.lastName} />
              <LabelValue label="Email" value={doctor.email} />
              <LabelValue label="Phone" value={doctor.phone} />
              <LabelValue label="Gender" value={doctor.gender} />
              <LabelValue label="Date of Birth" value={doctor.dateOfBirth ? new Date(doctor.dateOfBirth).toLocaleDateString() : null} />
            </div>
          </div>

          {/* Professional */}
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-md p-6">
            <SectionHeading>Professional Information</SectionHeading>
            <div className="grid grid-cols-2 gap-4">
              <LabelValue label="Specialization" value={doctor.specialization} />
              <LabelValue label="Experience" value={doctor.experienceYears ? `${doctor.experienceYears} years` : null} />
              <LabelValue label="License No." value={doctor.licenseNumber} />
              <LabelValue label="Consultation Fee" value={doctor.consultationFee ? `$${doctor.consultationFee}` : null} />
              <LabelValue label="Hospital / Clinic" value={doctor.hospital} />
              <LabelValue label="Available" value={doctor.isAvailable === true ? 'Yes' : doctor.isAvailable === false ? 'No' : null} />
            </div>
            {doctor.bio && (
              <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-800">
                <p className="text-xs text-gray-400 dark:text-gray-500 uppercase tracking-wide mb-1">Bio</p>
                <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">{doctor.bio}</p>
              </div>
            )}
          </div>

          {/* Education */}
          {doctor.education?.length > 0 && (
            <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-md p-6">
              <SectionHeading>Education</SectionHeading>
              <ul className="space-y-2">
                {doctor.education.map((edu, i) => (
                  <li key={i} className="text-sm text-gray-700 dark:text-gray-300">
                    <span className="font-medium">{edu.degree}</span>
                    {edu.institution && ` — ${edu.institution}`}
                    {edu.year && ` (${edu.year})`}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DoctorVerification;

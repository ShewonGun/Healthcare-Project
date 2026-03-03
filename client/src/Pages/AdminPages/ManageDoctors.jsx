import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { adminAPI } from '../../utils/api';
import { FiAlertCircle, FiCheck, FiSearch, FiX } from 'react-icons/fi';

//  Helpers 
const TABS = [
  { key: 'All',      label: 'All' },
  { key: 'Verified', label: 'Verified' },
  { key: 'Pending',  label: 'Pending' },
];

const Toast = ({ msg, type }) => {
  if (!msg) return null;
  const colors = type === 'error'
    ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800 text-red-700 dark:text-red-400'
    : 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800 text-green-700 dark:text-green-400';
  return (
    <div className={`flex items-center gap-2 text-sm border rounded-md px-4 py-3 mb-5 ${colors}`}>
      {type === 'error' ? (
        <FiAlertCircle className="w-4 h-4 shrink-0" />
      ) : (
        <FiCheck className="w-4 h-4 shrink-0" />
      )}
      {msg}
    </div>
  );
};

// ── Main Page ─────────────────────────────────────────────────────────────────
const ManageDoctors = () => {
  const navigate = useNavigate();
  const [doctors, setDoctors] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState('All');
  const [actionLoading, setActionLoading] = useState(null);
  const [toast, setToast] = useState({ msg: '', type: '' });
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 5;

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast({ msg: '', type: '' }), 4000);
  };

  const fetchDoctors = useCallback(async () => {
    setLoading(true);
    try {
      const res = await adminAPI.getAllDoctors();
      setDoctors(res.data?.data || []);
    } catch {
      setError('Failed to load doctors.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchDoctors(); }, [fetchDoctors]);

  useEffect(() => {
    let list = [...doctors];
    if (activeTab === 'Verified') list = list.filter((d) => d.isVerified);
    if (activeTab === 'Pending')  list = list.filter((d) => !d.isVerified);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter((d) =>
        `${d.firstName} ${d.lastName}`.toLowerCase().includes(q) ||
        d.email?.toLowerCase().includes(q) ||
        (Array.isArray(d.specialization) ? d.specialization.join(' ') : d.specialization || '').toLowerCase().includes(q),
      );
    }
    setFiltered(list);
    setPage(1);
  }, [doctors, activeTab, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated  = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const handleVerify = async (id, approve) => {
    setActionLoading(id);
    try {
      await adminAPI.verifyDoctor(id, { isVerified: approve });
      showToast(`Doctor ${approve ? 'approved' : 'rejected'} successfully.`);
      fetchDoctors();
    } catch {
      showToast('Action failed. Please try again.', 'error');
    } finally {
      setActionLoading(null);
    }
  };

  // Tab counts
  const counts = {
    All:      doctors.length,
    Verified: doctors.filter((d) => d.isVerified).length,
    Pending:  doctors.filter((d) => !d.isVerified).length,
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-indigo-600 border-t-transparent" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-md mx-auto mt-16 px-4">
        <div className="text-center text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md p-6">{error}</div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-xl font-semibold text-gray-900 dark:text-white">Manage Doctors</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
            {doctors.length} total doctors
            {counts.Pending > 0 && (
              <span className="ml-2 text-yellow-600 dark:text-yellow-400 font-medium">
                · {counts.Pending} pending
              </span>
            )}
          </p>
        </div>

        {/* Search */}
        <div className="relative sm:w-64">
          <FiSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search doctors…"
            className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md text-sm text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          />
          {search && (
            <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
              <FiX className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-5 border-b border-gray-200 dark:border-gray-800">
        {TABS.map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setActiveTab(key)}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors ${
              activeTab === key
                ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400 dark:border-indigo-400'
                : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
            }`}
          >
            {label}
            {counts[key] > 0 && (
              <span className={`ml-1.5 text-[11px] font-bold px-1.5 py-0.5 rounded-full ${
                activeTab === key
                  ? 'bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400'
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400'
              }`}>
                {counts[key]}
              </span>
            )}
          </button>
        ))}
      </div>

      <Toast msg={toast.msg} type={toast.type} />

      {/* Results count */}
      <p className="text-xs text-gray-400 mb-4 font-medium uppercase tracking-wide">
        {filtered.length} result{filtered.length !== 1 ? 's' : ''}
        {activeTab !== 'All' && <span className="text-indigo-500 dark:text-indigo-400"> · {activeTab}</span>}
      </p>

      {/* Table */}
      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 dark:border-gray-800">
                <th className="px-5 py-3.5 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">Doctor</th>
                <th className="px-5 py-3.5 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">Specialization</th>
                <th className="px-5 py-3.5 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">Exp / Fee</th>
                <th className="px-5 py-3.5 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">Status</th>
                <th className="px-5 py-3.5 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-5 py-12 text-center">
                    <p className="text-base font-medium text-gray-500 dark:text-gray-400">No doctors found</p>
                    <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">Try a different search or filter</p>
                  </td>
                </tr>
              ) : paginated.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-5 py-14 text-center text-sm text-gray-400 dark:text-gray-500">No doctors found</td>
                </tr>
              ) : (
                paginated.map((doc) => (
                  <tr
                    key={doc._id}
                    className="border-b border-gray-50 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition last:border-0"
                  >
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        {doc.profileImage ? (
                          <img src={doc.profileImage} alt="" className="w-9 h-9 rounded-full object-cover shrink-0" />
                        ) : (
                          <div className="w-9 h-9 rounded-full bg-indigo-100 dark:bg-indigo-900/40 flex items-center justify-center text-indigo-700 dark:text-indigo-300 font-bold text-sm shrink-0">
                            {doc.firstName?.[0] || 'D'}
                          </div>
                        )}
                        <div>
                          <p className="font-medium text-gray-900 dark:text-white">
                            Dr. {doc.firstName} {doc.lastName}
                          </p>
                          <p className="text-xs text-gray-400 dark:text-gray-500">{doc.email}</p>
                          {doc.phone && <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">{doc.phone}</p>}
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4 text-gray-600 dark:text-gray-300 text-sm">
                      {Array.isArray(doc.specialization) ? doc.specialization.join(', ') : doc.specialization || '—'}
                    </td>
                   
                    <td className="px-5 py-4 text-sm">
                      <p className="text-gray-600 dark:text-gray-300">
                        {doc.experienceYears ? `${doc.experienceYears} yrs exp` : doc.experience ? `${doc.experience} yrs exp` : '—'}
                      </p>
                      {doc.consultationFee != null && (
                        <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">${doc.consultationFee} / visit</p>
                      )}
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex flex-col gap-1">
                      <span className={`text-[11px] font-semibold px-2 py-0.5 rounded border w-fit ${
                        doc.isVerified
                          ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800 text-green-700 dark:text-green-400'
                          : 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800 text-yellow-700 dark:text-yellow-400'
                      }`}>
                        {doc.isVerified ? 'Verified' : 'Pending'}
                      </span>
                      <span className={`text-[11px] font-semibold px-2 py-0.5 rounded border w-fit ${
                        doc.isAvailable
                          ? 'bg-indigo-50 dark:bg-indigo-900/20 border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-400'
                          : 'bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400'
                      }`}>
                        {doc.isAvailable ? 'Available' : 'Unavailable'}
                      </span>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => navigate(`/admin/doctors/${doc._id}`)}
                          className="text-xs font-medium text-indigo-600 dark:text-indigo-400 hover:underline"
                        >
                          View
                        </button>
                        {!doc.isVerified ? (
                          <button
                            disabled={actionLoading === doc._id}
                            onClick={() => handleVerify(doc._id, true)}
                            className="text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 px-2.5 py-1 rounded-md transition active:scale-95"
                          >
                            {actionLoading === doc._id ? '…' : 'Approve'}
                          </button>
                        ) : (
                          <button
                            disabled={actionLoading === doc._id}
                            onClick={() => handleVerify(doc._id, false)}
                            className="text-xs font-semibold text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800 hover:bg-red-50 dark:hover:bg-red-900/20 disabled:opacity-60 px-2.5 py-1 rounded-md transition active:scale-95"
                          >
                            {actionLoading === doc._id ? '…' : 'Revoke'}
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="px-5 py-3 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between gap-4">
          <p className="text-xs text-gray-400 dark:text-gray-500">
            {filtered.length === 0 ? '0' : `${(page - 1) * PAGE_SIZE + 1}–${Math.min(page * PAGE_SIZE, filtered.length)}`} of {filtered.length} doctor{filtered.length !== 1 ? 's' : ''}
          </p>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-2.5 py-1.5 text-xs font-medium rounded-md border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-40 disabled:cursor-not-allowed transition"
            >
              ← Prev
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((n) => (
              <button
                key={n}
                onClick={() => setPage(n)}
                className={`w-8 h-8 text-xs font-medium rounded-md border transition ${
                  n === page
                    ? 'border-indigo-600 bg-indigo-600 text-white'
                    : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800'
                }`}
              >
                {n}
              </button>
            ))}
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="px-2.5 py-1.5 text-xs font-medium rounded-md border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-40 disabled:cursor-not-allowed transition"
            >
              Next →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ManageDoctors;

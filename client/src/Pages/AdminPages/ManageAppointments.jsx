import { useState, useEffect, useCallback } from 'react';
import { adminAPI } from '../../utils/api';
import { FiCheck } from 'react-icons/fi';

const PAGE_SIZE = 5;

const STATUS_STYLES = {
  pending:   'bg-yellow-50 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-400',
  confirmed: 'bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400',
  completed: 'bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400',
  cancelled: 'bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400',
  no_show:   'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400',
};

const PAY_STYLES = {
  pending:  'bg-yellow-50 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-400',
  paid:     'bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400',
  refunded: 'bg-purple-50 text-purple-700 dark:bg-purple-900/20 dark:text-purple-400',
};

const TABS = ['All', 'pending', 'confirmed', 'completed', 'cancelled'];

function Badge({ label, style }) {
  return (
    <span className={`inline-block px-2 py-0.5 rounded text-[11px] font-medium ${style}`}>
      {label}
    </span>
  );
}

function formatDate(d) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}

export default function ManageAppointments() {
  const [appointments, setAppointments] = useState([]);
  const [filtered, setFiltered]         = useState([]);
  const [loading, setLoading]           = useState(true);
  const [error, setError]               = useState(null);
  const [search, setSearch]             = useState('');
  const [activeTab, setActiveTab]       = useState('All');
  const [page, setPage]                 = useState(1);
  const [markingId, setMarkingId]       = useState(null);
  const [toast, setToast]               = useState('');

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(''), 3500); };

  const handleMarkCashPaid = async (appt) => {
    setMarkingId(appt._id);
    try {
      await adminAPI.markCashPaid(appt._id, {
        patientId: appt.patientId,
        doctorId:  appt.doctorId,
        amount:    0,
      });
      setAppointments((prev) =>
        prev.map((a) => a._id === appt._id ? { ...a, paymentStatus: 'paid', paymentMethod: 'cash' } : a)
      );
      showToast('Payment marked as paid.');
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to mark as paid.');
    } finally {
      setMarkingId(null);
    }
  };

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated  = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const fetchAppointments = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await adminAPI.getAllAppointments();
      setAppointments(res.data?.data || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load appointments');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchAppointments(); }, [fetchAppointments]);

  useEffect(() => {
    const q = search.trim().toLowerCase();
    let list = appointments;
    if (activeTab !== 'All') list = list.filter((a) => a.status === activeTab);
    if (q) list = list.filter(
      (a) =>
        (a.patientName || '').toLowerCase().includes(q) ||
        (a.doctorName  || '').toLowerCase().includes(q) ||
        (a.reason      || '').toLowerCase().includes(q)
    );
    setFiltered(list);
    setPage(1);
  }, [appointments, activeTab, search]);

  const counts = TABS.reduce((acc, t) => {
    acc[t] = t === 'All' ? appointments.length : appointments.filter((a) => a.status === t).length;
    return acc;
  }, {});

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 space-y-6">
      {/* Toast */}
      {toast && (
        <div className="fixed bottom-5 right-5 z-50 bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 text-sm px-4 py-2.5 rounded-md shadow-lg">
          {toast}
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">Appointments</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
            All patient–doctor appointments across the platform
          </p>
        </div>
        <button
          onClick={fetchAppointments}
          className="px-3.5 py-2 text-sm font-medium rounded-md border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition"
        >
          Refresh
        </button>
      </div>

      {/* Error */}
      {error && (
        <div className="rounded-md bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 px-4 py-3 text-sm text-red-600 dark:text-red-400">
          {error}
        </div>
      )}

      {/* Card */}
      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-md overflow-hidden">
        {/* Tabs + Search */}
        <div className="px-5 pt-4 pb-3 border-b border-gray-100 dark:border-gray-800 flex flex-col sm:flex-row sm:items-center gap-3">
          <div className="flex gap-1 flex-wrap">
            {TABS.map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-3 py-1.5 text-xs font-medium rounded-md capitalize transition ${
                  activeTab === tab
                    ? 'bg-indigo-600 text-white'
                    : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
                }`}
              >
                {tab === 'All' ? 'All' : tab.replace('_', ' ')}
                <span className={`ml-1.5 text-[10px] ${activeTab === tab ? 'text-indigo-200' : 'text-gray-400'}`}>
                  {counts[tab]}
                </span>
              </button>
            ))}
          </div>
          <input
            type="text"
            placeholder="Search patient, doctor, reason…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="sm:ml-auto w-full sm:w-56 px-3 py-1.5 text-sm border border-gray-200 dark:border-gray-700 rounded-md bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-200 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 dark:bg-gray-800/60 text-left">
                <th className="px-5 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Patient</th>
                <th className="px-5 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Doctor</th>
                <th className="px-5 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Date & Time</th>
                <th className="px-5 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Type</th>
                <th className="px-5 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Status</th>
                <th className="px-5 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Payment</th>
                <th className="px-5 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-5 py-16 text-center">
                    <div className="flex flex-col items-center gap-2 text-gray-400 dark:text-gray-500">
                      <div className="w-6 h-6 animate-spin rounded-full border-2 border-indigo-500 border-t-transparent" />
                      <span className="text-sm">Loading appointments…</span>
                    </div>
                  </td>
                </tr>
              ) : paginated.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-5 py-14 text-center text-sm text-gray-400 dark:text-gray-500">
                    No appointments found
                  </td>
                </tr>
              ) : (
                paginated.map((a) => (
                  <tr key={a._id} className="hover:bg-gray-50 dark:hover:bg-gray-800/40 transition-colors">
                    {/* Patient */}
                    <td className="px-5 py-3.5">
                      <p className="font-medium text-gray-800 dark:text-gray-100">{a.patientName || '—'}</p>
                    </td>
                    {/* Doctor */}
                    <td className="px-5 py-3.5">
                      <p className="font-medium text-gray-800 dark:text-gray-100">{a.doctorName || '—'}</p>
                    </td>
                    {/* Date & Time */}
                    <td className="px-5 py-3.5 whitespace-nowrap">
                      <p className="text-gray-700 dark:text-gray-200">{formatDate(a.appointmentDate)}</p>
                      <p className="text-xs text-gray-400 dark:text-gray-500">{a.appointmentTime || '—'}</p>
                    </td>
                    {/* Type */}
                    <td className="px-5 py-3.5">
                      <Badge
                        label={a.type === 'telemedicine' ? 'Telemedicine' : 'In-Person'}
                        style={
                          a.type === 'telemedicine'
                            ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-900/20 dark:text-indigo-400'
                            : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'
                        }
                      />
                    </td>
                    {/* Status */}
                    <td className="px-5 py-3.5">
                      <Badge
                        label={a.status?.replace('_', ' ') || '—'}
                        style={STATUS_STYLES[a.status] || 'bg-gray-100 text-gray-600'}
                      />
                    </td>
                    {/* Payment */}
                    <td className="px-5 py-3.5">
                      <Badge
                        label={a.paymentStatus || '—'}
                        style={PAY_STYLES[a.paymentStatus] || 'bg-gray-100 text-gray-600'}
                      />
                    </td>
                    {/* Actions */}
                    <td className="px-5 py-3.5">
                      {a.paymentStatus === 'pending' ? (
                        <button
                          onClick={() => handleMarkCashPaid(a)}
                          disabled={markingId === a._id}
                          className="flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold text-white
                                     bg-green-600 hover:bg-green-700 disabled:opacity-50 rounded transition"
                        >
                          {markingId === a._id ? (
                            <div className="w-3 h-3 animate-spin rounded-full border-2 border-white border-t-transparent" />
                          ) : (
                            <FiCheck className="w-3 h-3" />
                          )}
                          Mark Paid
                        </button>
                      ) : (
                        <span className="text-xs text-gray-400 dark:text-gray-600">—</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination footer */}
        <div className="px-5 py-3 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between gap-4">
          <p className="text-xs text-gray-400 dark:text-gray-500">
            {filtered.length === 0
              ? '0'
              : `${(page - 1) * PAGE_SIZE + 1}–${Math.min(page * PAGE_SIZE, filtered.length)}`}{' '}
            of {filtered.length} appointment{filtered.length !== 1 ? 's' : ''}
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
}

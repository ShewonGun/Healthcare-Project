import { useState, useEffect, useCallback } from 'react';
import { adminAPI } from '../../utils/api';

const PAGE_SIZE = 5;

const STATUS_STYLES = {
  pending:   'bg-yellow-50 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-400',
  completed: 'bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400',
  failed:    'bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400',
  cancelled: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400',
  refunded:  'bg-purple-50 text-purple-700 dark:bg-purple-900/20 dark:text-purple-400',
};

const TABS = ['All', 'pending', 'completed', 'refunded', 'failed', 'cancelled'];

function Badge({ label, style }) {
  return (
    <span className={`inline-block px-2 py-0.5 rounded text-[11px] font-medium capitalize ${style}`}>
      {label}
    </span>
  );
}

function formatDate(d) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}

function formatAmount(cents, currency = 'usd') {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency.toUpperCase(),
  }).format(cents / 100);
}

function shortId(id = '') {
  return id.length > 14 ? `…${id.slice(-10)}` : id;
}

export default function ManagePayments() {
  const [payments, setPayments]   = useState([]);
  const [apptMap, setApptMap]     = useState({});
  const [filtered, setFiltered]   = useState([]);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState(null);
  const [search, setSearch]       = useState('');
  const [activeTab, setActiveTab] = useState('All');
  const [page, setPage]           = useState(1);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated  = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const fetchPayments = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [payRes, apptRes] = await Promise.all([
        adminAPI.getAllPayments(),
        adminAPI.getAllAppointments(),
      ]);
      setPayments(payRes.data?.data || payRes.data?.payments || []);
      const map = {};
      (apptRes.data?.data || []).forEach((a) => {
        map[a._id] = { patientName: a.patientName || '', doctorName: a.doctorName || '' };
      });
      setApptMap(map);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load transactions');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchPayments(); }, [fetchPayments]);

  useEffect(() => {
    const q = search.trim().toLowerCase();
    let list = payments;
    if (activeTab !== 'All') list = list.filter((p) => p.status === activeTab);
    if (q)
      list = list.filter(
        (p) => {
          const appt = apptMap[p.appointmentId] || {};
          return (
            (appt.patientName          || '').toLowerCase().includes(q) ||
            (appt.doctorName           || '').toLowerCase().includes(q) ||
            (p.itemName                || '').toLowerCase().includes(q) ||
            (p.stripePaymentIntentId   || '').toLowerCase().includes(q)
          );
        }
      );
    setFiltered(list);
    setPage(1);
  }, [payments, activeTab, search]);

  const counts = TABS.reduce((acc, t) => {
    acc[t] = t === 'All' ? payments.length : payments.filter((p) => p.status === t).length;
    return acc;
  }, {});

  const totalRevenue = payments
    .filter((p) => p.status === 'completed')
    .reduce((sum, p) => sum + (p.amount || 0), 0);

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">Transactions</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
            All payment transactions across the platform
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-right">
            <p className="text-xs text-gray-400 dark:text-gray-500">Total Revenue</p>
            <p className="text-base font-bold text-green-600 dark:text-green-400">
              {formatAmount(totalRevenue)}
            </p>
          </div>
          <button
            onClick={fetchPayments}
            className="px-3.5 py-2 text-sm font-medium rounded-md border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition"
          >
            Refresh
          </button>
        </div>
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
                {tab === 'All' ? 'All' : tab}
                <span className={`ml-1.5 text-[10px] ${activeTab === tab ? 'text-indigo-200' : 'text-gray-400'}`}>
                  {counts[tab]}
                </span>
              </button>
            ))}
          </div>
          <input
            type="text"
            placeholder="Search patient, doctor, intent ID…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="sm:ml-auto w-full sm:w-64 px-3 py-1.5 text-sm border border-gray-200 dark:border-gray-700 rounded-md bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-200 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 dark:bg-gray-800/60 text-left">
                <th className="px-5 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Patient</th>
                <th className="px-5 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Item</th>
                <th className="px-5 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Amount</th>
                <th className="px-5 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Method</th>
                <th className="px-5 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Status</th>
                <th className="px-5 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-5 py-16 text-center">
                    <div className="flex flex-col items-center gap-2 text-gray-400 dark:text-gray-500">
                      <div className="w-6 h-6 animate-spin rounded-full border-2 border-indigo-500 border-t-transparent" />
                      <span className="text-sm">Loading transactions…</span>
                    </div>
                  </td>
                </tr>
              ) : paginated.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-5 py-14 text-center text-sm text-gray-400 dark:text-gray-500">
                    No transactions found
                  </td>
                </tr>
              ) : (
                paginated.map((p) => (
                  <tr key={p._id} className="hover:bg-gray-50 dark:hover:bg-gray-800/40 transition-colors">
                    {/* Patient */}
                    <td className="px-5 py-3.5">
                      <p className="font-medium text-gray-800 dark:text-gray-100">
                        {apptMap[p.appointmentId]?.patientName || <span className="text-gray-400">—</span>}
                      </p>
                    </td>
                    {/* Item */}
                    <td className="px-5 py-3.5">
                      <p className="font-medium text-gray-800 dark:text-gray-100">{p.itemName || 'Consultation Fee'}</p>
                      <p className="text-xs text-gray-400 dark:text-gray-500 font-mono">{shortId(p.appointmentId)}</p>
                    </td>
                    {/* Amount */}
                    <td className="px-5 py-3.5 whitespace-nowrap font-semibold text-gray-800 dark:text-gray-100">
                      {formatAmount(p.amount, p.currency)}
                    </td>
                    {/* Method */}
                    <td className="px-5 py-3.5 capitalize text-gray-600 dark:text-gray-300">
                      {p.stripePaymentMethod || '—'}
                    </td>
                    {/* Status */}
                    <td className="px-5 py-3.5">
                      <Badge label={p.status} style={STATUS_STYLES[p.status] || 'bg-gray-100 text-gray-600'} />
                    </td>
                    {/* Date */}
                    <td className="px-5 py-3.5 text-gray-500 dark:text-gray-400 whitespace-nowrap">
                      {formatDate(p.createdAt)}
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
            of {filtered.length} transaction{filtered.length !== 1 ? 's' : ''}
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

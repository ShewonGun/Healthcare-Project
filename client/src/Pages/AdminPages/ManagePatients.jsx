import { useEffect, useState } from 'react';
import { adminAPI } from '../../utils/api';

const ManagePatients = () => {
  const [patients, setPatients] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 5;

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await adminAPI.getAllPatients();
        setPatients(res.data?.data || []);
      } catch {
        setError('Failed to load patients. Please try again.');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  useEffect(() => {
    if (!search.trim()) { setFiltered(patients); return; }
    const q = search.toLowerCase();
    setFiltered(
      patients.filter(
        (p) =>
          `${p.firstName} ${p.lastName}`.toLowerCase().includes(q) ||
          p.email?.toLowerCase().includes(q) ||
          p.phone?.toLowerCase().includes(q),
      ),
    );
  }, [patients, search]);

  useEffect(() => { setPage(1); }, [filtered]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated  = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const formatDate = (d) => (d ? new Date(d).toLocaleDateString() : '—');
  const calcAge = (d) => {
    if (!d) return null;
    const diff = Date.now() - new Date(d).getTime();
    return Math.floor(diff / (1000 * 60 * 60 * 24 * 365.25));
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">Manage Patients</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
            {patients.length} registered patient{patients.length !== 1 ? 's' : ''}
          </p>
        </div>
        <button
          onClick={() => { setSearch(''); }}
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
        {/* Search */}
        <div className="px-5 pt-4 pb-3 border-b border-gray-100 dark:border-gray-800 flex items-center gap-3">
          <input
            type="text"
            placeholder="Search by name, email or phone…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full sm:w-64 px-3 py-1.5 text-sm border border-gray-200 dark:border-gray-700 rounded-md bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-200 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 dark:bg-gray-800/60 text-left">
                <th className="px-5 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Patient</th>
                <th className="px-5 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Contact</th>
                <th className="px-5 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Age / DOB</th>
                <th className="px-5 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Gender / Blood</th>
                <th className="px-5 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Address</th>
                <th className="px-5 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Joined</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-5 py-16 text-center">
                    <div className="flex flex-col items-center gap-2 text-gray-400 dark:text-gray-500">
                      <div className="w-6 h-6 animate-spin rounded-full border-2 border-indigo-500 border-t-transparent" />
                      <span className="text-sm">Loading patients…</span>
                    </div>
                  </td>
                </tr>
              ) : paginated.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-5 py-14 text-center text-sm text-gray-400 dark:text-gray-500">No patients found</td>
                </tr>
              ) : (
                paginated.map((p) => (
                  <tr
                    key={p._id}
                    className="border-b border-gray-50 dark:border-gray-800 hover:bg-gray-50/50 dark:hover:bg-gray-800/50 transition last:border-0"
                  >
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        {p.profileImage ? (
                          <img src={p.profileImage} alt="" className="w-9 h-9 rounded-full object-cover border border-gray-200 dark:border-gray-700" />
                        ) : (
                          <div className="w-9 h-9 rounded-full bg-indigo-100 dark:bg-indigo-900/40 flex items-center justify-center text-indigo-700 dark:text-indigo-300 font-semibold text-sm">
                            {p.firstName?.[0]?.toUpperCase() || 'P'}
                          </div>
                        )}
                        <div>
                          <p className="font-medium text-gray-900 dark:text-white">{p.firstName} {p.lastName}</p>
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{p.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <p className="text-gray-600 dark:text-gray-300">{p.phone || '—'}</p>
                      {p.emergencyContact && (
                        <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                          Emergency: {p.emergencyContact.name || p.emergencyContact}
                        </p>
                      )}
                    </td>
                    <td className="px-5 py-4">
                      <p className="text-gray-600 dark:text-gray-300">
                        {calcAge(p.dateOfBirth) != null ? `${calcAge(p.dateOfBirth)} yrs` : '—'}
                      </p>
                      {p.dateOfBirth && (
                        <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">{formatDate(p.dateOfBirth)}</p>
                      )}
                    </td>
                    <td className="px-5 py-4">
                      <p className="text-gray-600 dark:text-gray-300 capitalize">{p.gender || '—'}</p>
                      {p.bloodGroup ? (
                        <span className="inline-block mt-1 text-[11px] font-semibold px-2 py-0.5 rounded border bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800 text-red-700 dark:text-red-400">
                          {p.bloodGroup}
                        </span>
                      ) : (
                        <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">—</p>
                      )}
                    </td>
                    <td className="px-5 py-4 text-sm text-gray-600 dark:text-gray-300">
                      {p.address
                        ? [p.address.city, p.address.state, p.address.country].filter(Boolean).join(', ') || (typeof p.address === 'string' ? p.address : '—')
                        : p.city ? `${p.city}${p.state ? ', ' + p.state : ''}` : '—'}
                    </td>
                    <td className="px-5 py-4 text-gray-600 dark:text-gray-300">{formatDate(p.createdAt)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <div className="px-5 py-3 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between gap-4">
          <p className="text-xs text-gray-400 dark:text-gray-500">
            {filtered.length === 0 ? '0' : `${(page - 1) * PAGE_SIZE + 1}–${Math.min(page * PAGE_SIZE, filtered.length)}`} of {filtered.length} patient{filtered.length !== 1 ? 's' : ''}
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

export default ManagePatients;

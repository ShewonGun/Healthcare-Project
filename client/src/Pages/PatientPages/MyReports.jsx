import { useState, useEffect } from 'react';
import { reportAPI } from '../../utils/api';
import { FiPlus, FiFileText } from 'react-icons/fi';
import ReportCard, { REPORT_TYPES } from '../../Componets/PatientComponents/ReportCard';
import AddLabReportModal from '../../Componets/PatientComponents/AddLabReportModal';

// ── Delete confirmation modal ──────────────────────────────────────────────────
const DeleteModal = ({ report, onConfirm, onClose, deleting }) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
    <div className="absolute inset-0 bg-black/50" onClick={onClose} />
    <div className="relative bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg shadow-xl w-full max-w-sm p-6">
      <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-1">Delete report?</h3>
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-5">
        "<span className="font-medium text-gray-700 dark:text-gray-300">{report.title}</span>" will be permanently deleted and cannot be recovered.
      </p>
      <div className="flex gap-3">
        <button
          onClick={onConfirm}
          disabled={deleting}
          className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-red-600 hover:bg-red-700 disabled:opacity-60 text-white text-sm font-semibold rounded-md transition"
        >
          {deleting ? <div className="animate-spin rounded-full w-4 h-4 border-2 border-white border-t-transparent" /> : null}
          Delete
        </button>
        <button
          onClick={onClose}
          className="flex-1 py-2.5 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 text-sm font-medium rounded-md hover:bg-gray-50 dark:hover:bg-gray-800 transition"
        >
          Cancel
        </button>
      </div>
    </div>
  </div>
);

// ── Main page ─────────────────────────────────────────────────────────────────
const MyReports = () => {
  const [reports, setReports]         = useState([]);
  const [loading, setLoading]         = useState(true);
  const [error, setError]             = useState('');
  const [showUpload, setShowUpload]   = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting]       = useState(false);
  const [filter, setFilter]           = useState('all');

  useEffect(() => {
    reportAPI.getMine()
      .then(({ data }) => setReports(data.data || []))
      .catch(() => setError('Failed to load reports.'))
      .finally(() => setLoading(false));
  }, []);

  const handleUploaded = (newReport) => {
    setReports((prev) => [newReport, ...prev]);
    setShowUpload(false);
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await reportAPI.delete(deleteTarget._id);
      setReports((prev) => prev.filter((r) => r._id !== deleteTarget._id));
      setDeleteTarget(null);
    } catch {
      // keep modal open so user can retry
    } finally {
      setDeleting(false);
    }
  };

  const filtered = filter === 'all'
    ? reports
    : reports.filter((r) => r.reportType === filter);

  // ── Counts per type ────────────────────────────────────────────────────────
  const counts = REPORT_TYPES.reduce((acc, t) => {
    acc[t.value] = reports.filter((r) => r.reportType === t.value).length;
    return acc;
  }, {});

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">My Reports</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
            {reports.length} report{reports.length !== 1 ? 's' : ''} stored
          </p>
        </div>
        <button
          onClick={() => setShowUpload(true)}
          className="flex items-center gap-2 px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700
                     text-white text-sm font-semibold rounded-lg transition"
        >
          <FiPlus className="w-4 h-4" />
          Upload
        </button>
      </div>

      {/* Filter tabs */}
      {reports.length > 0 && (
        <div className="flex gap-1.5 flex-wrap mb-5">
          <button
            onClick={() => setFilter('all')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md border transition
              ${filter === 'all'
                ? 'bg-indigo-600 text-white border-indigo-600'
                : 'bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:border-indigo-400'
              }`}
          >
            All ({reports.length})
          </button>
          {REPORT_TYPES.filter((t) => counts[t.value] > 0).map((t) => (
            <button
              key={t.value}
              onClick={() => setFilter(t.value)}
              className={`px-3 py-1.5 text-xs font-medium rounded-md border transition
                ${filter === t.value
                  ? 'bg-indigo-600 text-white border-indigo-600'
                  : 'bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:border-indigo-400'
                }`}
            >
              {t.label} ({counts[t.value]})
            </button>
          ))}
        </div>
      )}

      {/* Content */}
      {loading ? (
        <div className="flex items-center justify-center py-24">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-indigo-600 border-t-transparent" />
        </div>
      ) : error ? (
        <div className="text-center py-16 text-sm text-red-500">{error}</div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <FiFileText className="w-14 h-14 text-gray-200 dark:text-gray-700 mb-4" />
          <p className="text-sm font-medium text-gray-400 dark:text-gray-500">
            {filter === 'all' ? 'No reports yet' : `No ${REPORT_TYPES.find((t) => t.value === filter)?.label} reports`}
          </p>
          {filter === 'all' && (
            <button
              onClick={() => setShowUpload(true)}
              className="mt-4 text-sm font-medium text-indigo-600 dark:text-indigo-400 hover:underline"
            >
              Upload your first report →
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((r) => (
            <ReportCard key={r._id} report={r} onDelete={setDeleteTarget} />
          ))}
        </div>
      )}

      {/* Modals */}
      {showUpload && <AddLabReportModal onClose={() => setShowUpload(false)} onUploaded={handleUploaded} />}
      {deleteTarget && (
        <DeleteModal
          report={deleteTarget}
          onConfirm={handleDeleteConfirm}
          onClose={() => setDeleteTarget(null)}
          deleting={deleting}
        />
      )}
    </div>
  );
};

export default MyReports;

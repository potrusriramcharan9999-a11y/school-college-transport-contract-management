import { useState, useEffect } from 'react';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import Table from '../components/ui/Table';
import Modal from '../components/ui/Modal';
import { ShieldAlert, Database } from 'lucide-react';

export default function AuditLogs() {
  const { user } = useAuth();
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedLog, setSelectedLog] = useState(null);

  useEffect(() => {
    if (user?.role !== 'ADMIN') {
      return;
    }

    const fetchLogs = async () => {
      try {
        const res = await api.get('/audit-logs');
        const logsData = res.data.data || res.data || [];
        setLogs(Array.isArray(logsData) ? logsData : []);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load audit logs.');
      } finally {
        setLoading(false);
      }
    };

    fetchLogs();
  }, [user]);

  if (user?.role !== 'ADMIN') {
    return (
      <div className="flex items-center justify-center py-20 p-6 text-white">
        <div className="max-w-md w-full bg-[#121827]/40 backdrop-blur-md rounded-3xl border border-red-500/20 p-8 text-center shadow-2xl">
          <ShieldAlert className="text-[#EF4444] w-12 h-12 mx-auto mb-3" />
          <h2 className="text-base font-bold text-white mb-1">Access Denied</h2>
          <p className="text-[#94A3B8] text-xs font-semibold mb-4 leading-normal">
            Only administrators are authorized to access the system audit logs.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 text-white animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white tracking-tight">System Audit Logs</h1>
        <p className="text-xs text-[#94A3B8] mt-1 font-medium">
          Review security-critical changes, data modifications, and staff actions history.
        </p>
      </div>

      {error && (
        <div className="p-4 bg-red-955/20 border border-red-500/20 text-red-400 text-xs font-bold rounded-2xl animate-fade-in">
          {error}
        </div>
      )}

      {/* Main logs listing */}
      <div>
        {loading ? (
          <div className="flex flex-col items-center justify-center py-24 gap-3 bg-[#121827]/40 border border-white/5 rounded-3xl">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#8B7CFF]" />
            <p className="text-xs text-[#94A3B8] font-bold">Fetching audit timeline...</p>
          </div>
        ) : logs.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4 bg-[#121827]/40 border border-white/5 rounded-3xl p-8 text-center shadow-2xl">
            <div className="w-16 h-16 rounded-3xl bg-[#0D1220] border border-white/5 flex items-center justify-center text-[#8B7CFF] text-2xl">
              <Database className="w-8 h-8" />
            </div>
            <div className="max-w-sm">
              <h3 className="text-sm font-bold text-white">No logs recorded</h3>
              <p className="text-xs text-[#94A3B8] mt-1 leading-normal">
                There are no system-wide event logs or historical operations recorded in the database.
              </p>
            </div>
          </div>
        ) : (
          <Table headers={['Action', 'Entity Type', 'Entity ID', 'Performed By', 'Timestamp', 'Details']}>
            {logs.map((log) => (
              <tr key={log.id} className="hover:bg-white/5 transition-colors border-b border-white/5 last:border-0">
                <td className="px-6 py-4 whitespace-nowrap">
                  <Badge variant={
                    log.action === 'CREATE' ? 'success' :
                    log.action === 'UPDATE' ? 'info' : 'danger'
                  }>
                    {log.action}
                  </Badge>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-xs font-bold text-white">
                  {log.entity_type}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-xs text-[#94A3B8]/60 font-mono">
                  {log.entity_id}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-xs">
                  <span className="block font-bold text-white">{log.full_name || 'System'}</span>
                  <span className="block font-semibold text-[#94A3B8]/80 mt-0.5">{log.email || '—'}</span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-xs text-[#94A3B8]/70 font-bold">
                  {new Date(log.created_at).toLocaleString('en-IN')}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-xs">
                  <button
                    onClick={() => setSelectedLog(log)}
                    className="text-[#8B7CFF] hover:text-[#A78BFA] transition-colors cursor-pointer font-bold"
                  >
                    View Changes
                  </button>
                </td>
              </tr>
            ))}
          </Table>
        )}
      </div>

      {/* Detail log Modal */}
      <Modal
        isOpen={!!selectedLog}
        onClose={() => setSelectedLog(null)}
        title="Audit Log Details"
      >
        {selectedLog && (
          <div className="space-y-4 text-white">
            <div className="grid grid-cols-2 gap-4 text-xs border-b border-white/5 pb-4">
              <div>
                <span className="block text-[10px] uppercase font-bold text-[#94A3B8]/60">Action</span>
                <span className="font-bold text-white">{selectedLog.action}</span>
              </div>
              <div>
                <span className="block text-[10px] uppercase font-bold text-[#94A3B8]/60">Entity Type</span>
                <span className="font-bold text-white">{selectedLog.entity_type}</span>
              </div>
              <div>
                <span className="block text-[10px] uppercase font-bold text-[#94A3B8]/60">Entity ID</span>
                <span className="font-mono text-[#94A3B8] font-semibold">{selectedLog.entity_id}</span>
              </div>
              <div>
                <span className="block text-[10px] uppercase font-bold text-[#94A3B8]/60">Timestamp</span>
                <span className="text-white font-bold">{new Date(selectedLog.created_at).toLocaleString('en-IN')}</span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
              <div>
                <h4 className="text-[10px] uppercase font-bold text-[#94A3B8]/60 mb-2">Previous State (Old)</h4>
                <pre className="bg-[#0D1220] border border-white/5 rounded-2xl p-3 text-[10px] font-mono overflow-x-auto text-[#94A3B8] max-h-64 leading-relaxed scrollbar-thin">
                  {selectedLog.old_value ? JSON.stringify(selectedLog.old_value, null, 2) : 'NULL'}
                </pre>
              </div>
              <div>
                <h4 className="text-[10px] uppercase font-bold text-[#94A3B8]/60 mb-2">New State (New)</h4>
                <pre className="bg-[#0D1220] border border-white/5 rounded-2xl p-3 text-[10px] font-mono overflow-x-auto text-[#94A3B8] max-h-64 leading-relaxed scrollbar-thin">
                  {selectedLog.new_value ? JSON.stringify(selectedLog.new_value, null, 2) : 'NULL'}
                </pre>
              </div>
            </div>

            <div className="flex items-center justify-end pt-4 border-t border-white/5">
              <Button onClick={() => setSelectedLog(null)} variant="primary">
                Close
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

import { useState, useEffect, useCallback } from 'react';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import Table from '../components/ui/Table';
import Input from '../components/ui/Input';
import StatCard from '../components/ui/StatCard';
import { canManage } from '../lib/permissions';
import {
  FileText, CheckCircle2, Clock, AlertTriangle,
  Search, Plus, X, IndianRupee, CalendarDays
} from 'lucide-react';

const STATUS_OPTIONS = ['All', 'Unpaid', 'Paid', 'Overdue'];
const STATUS_MAP = {
  'All': '',
  'Unpaid': 'UNPAID',
  'Paid': 'PAID',
  'Overdue': 'OVERDUE',
};

const formatDate = (dateStr) => {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  const day = String(d.getDate()).padStart(2, '0');
  return `${day}-${months[d.getMonth()]}-${d.getFullYear()}`;
};

const formatCurrency = (value) => {
  if (value == null) return '—';
  return '₹' + Number(value).toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
};

// ─── Create Payment Modal ───────────────────────────────────────────────────
function CreatePaymentModal({ onClose, onCreated }) {
  const [contracts, setContracts] = useState([]);
  const [loadingContracts, setLoadingContracts] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const [form, setForm] = useState({
    contract_id: '',
    invoice_number: '',
    billing_period_start: '',
    billing_period_end: '',
    amount: '',
    due_date: '',
    remarks: '',
  });

  useEffect(() => {
    (async () => {
      try {
        const res = await api.get('/contracts', { params: { limit: 200 } });
        const body = res.data.data || res.data;
        const items = body.items || body.contracts || body || [];
        setContracts(Array.isArray(items) ? items : []);
      } catch {
        setContracts([]);
      } finally {
        setLoadingContracts(false);
      }
    })();
  }, []);

  const handleChange = (field) => (e) => {
    setForm((prev) => ({ ...prev, [field]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);

    try {
      await api.post('/payments', {
        ...form,
        amount: Number(form.amount),
      });
      onCreated();
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create payment.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fade-in p-4">
      <Card className="w-full max-w-lg p-0 bg-[#121827] border border-white/10 shadow-2xl relative overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/5">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[#8B7CFF] to-[#A78BFA] flex items-center justify-center shadow-lg shadow-[#8B7CFF]/20">
              <IndianRupee className="w-4 h-4 text-white" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white">New Payment</h2>
              <p className="text-[10px] text-[#94A3B8] font-semibold">Create a new payment entry</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-[#94A3B8] hover:text-white hover:bg-white/10 transition-all cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4 max-h-[70vh] overflow-y-auto">
          {error && (
            <div className="p-3 bg-red-950/20 border border-red-500/20 text-red-400 text-xs font-bold rounded-2xl animate-fade-in">
              {error}
            </div>
          )}

          {/* Contract Selector */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-[#94A3B8] uppercase tracking-wider">
              Contract <span className="text-red-500">*</span>
            </label>
            <select
              required
              value={form.contract_id}
              onChange={handleChange('contract_id')}
              className="w-full px-4 py-3 bg-[#0D1220] text-white border border-white/10 rounded-2xl text-sm transition-all duration-200 outline-none focus:border-[#8B7CFF]/60 focus:ring-4 focus:ring-[#8B7CFF]/10 hover:border-white/20 appearance-none cursor-pointer"
            >
              <option value="" disabled>
                {loadingContracts ? 'Loading contracts...' : 'Select a contract'}
              </option>
              {contracts.map((c) => (
                <option key={c.id} value={c.id} className="bg-[#0D1220] text-white">
                  {c.contract_number} — {c.institution_name || 'No Institution'}
                </option>
              ))}
            </select>
          </div>

          {/* Invoice Number */}
          <Input
            label="Invoice Number"
            required
            value={form.invoice_number}
            onChange={handleChange('invoice_number')}
            placeholder="e.g. PAY001"
          />

          {/* Billing Period */}
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Billing Start"
              type="date"
              required
              value={form.billing_period_start}
              onChange={handleChange('billing_period_start')}
            />
            <Input
              label="Billing End"
              type="date"
              required
              value={form.billing_period_end}
              onChange={handleChange('billing_period_end')}
            />
          </div>

          {/* Amount & Due Date */}
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Amount (₹)"
              type="number"
              min="1"
              required
              value={form.amount}
              onChange={handleChange('amount')}
              placeholder="50000"
            />
            <Input
              label="Due Date"
              type="date"
              required
              value={form.due_date}
              onChange={handleChange('due_date')}
            />
          </div>

          {/* Remarks */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-[#94A3B8] uppercase tracking-wider">
              Remarks
            </label>
            <textarea
              value={form.remarks}
              onChange={handleChange('remarks')}
              placeholder="Optional notes..."
              rows={2}
              className="w-full px-4 py-3 bg-[#0D1220] text-white border border-white/10 rounded-2xl text-sm transition-all duration-200 outline-none focus:border-[#8B7CFF]/60 focus:ring-4 focus:ring-[#8B7CFF]/10 hover:border-white/20 resize-none"
            />
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="secondary" onClick={onClose} disabled={submitting}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" disabled={submitting}>
              {submitting ? 'Creating...' : 'Create Payment'}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}

// ─── Main Payments Page ─────────────────────────────────────────────────────
export default function Payments() {
  const { user } = useAuth();
  const canUpdatePayments = canManage(user);
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [markingId, setMarkingId] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);

  const fetchPayments = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const params = {};
      if (STATUS_MAP[statusFilter]) params.status = STATUS_MAP[statusFilter];
      if (search.trim()) params.search = search.trim();
      const res = await api.get('/payments', { params });
      const body = res.data.data || res.data;
      const items = body.items || body.payments || body || [];
      setPayments(Array.isArray(items) ? items : []);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load payments.');
      setPayments([]);
    } finally {
      setLoading(false);
    }
  }, [statusFilter, search]);

  useEffect(() => {
    void Promise.resolve().then(fetchPayments);
  }, [fetchPayments]);

  const handleMarkPaid = async (id) => {
    if (!canUpdatePayments) return;
    setMarkingId(id);
    try {
      await api.patch(`/payments/${id}/status`, { payment_status: 'PAID' });
      fetchPayments();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update payment status.');
    } finally {
      setMarkingId(null);
    }
  };

  // Calculate statistics based on current fetched payments
  const totalAmount = payments.reduce((acc, p) => acc + Number(p.amount || 0), 0);
  const paidAmount = payments.filter(p => (p.payment_status || p.status) === 'PAID').reduce((acc, p) => acc + Number(p.amount || 0), 0);
  const unpaidAmount = payments.filter(p => (p.payment_status || p.status) === 'UNPAID').reduce((acc, p) => acc + Number(p.amount || 0), 0);
  const overdueAmount = payments.filter(p => (p.payment_status || p.status) === 'OVERDUE').reduce((acc, p) => acc + Number(p.amount || 0), 0);

  const stats = [
    {
      title: 'Total Invoiced',
      value: formatCurrency(totalAmount),
      trend: `${payments.length} transactions`,
      trendType: 'info',
      icon: <FileText className="w-5 h-5" />,
    },
    {
      title: 'Collected Revenue',
      value: formatCurrency(paidAmount),
      trend: 'Received',
      trendType: 'success',
      icon: <CheckCircle2 className="w-5 h-5" />,
    },
    {
      title: 'Pending Invoices',
      value: formatCurrency(unpaidAmount),
      trend: 'Awaiting payment',
      trendType: 'warning',
      icon: <Clock className="w-5 h-5" />,
    },
    {
      title: 'Overdue Collections',
      value: formatCurrency(overdueAmount),
      trend: overdueAmount > 0 ? 'Action required' : 'All clear',
      trendType: overdueAmount > 0 ? 'danger' : 'success',
      icon: <AlertTriangle className="w-5 h-5" />,
    },
  ];

  // Map payment_status to user-friendly labels matching the screenshot
  const statusLabel = (raw) => {
    const map = { PAID: 'Paid', UNPAID: 'Pending', OVERDUE: 'Overdue' };
    return map[raw] || raw;
  };

  const statusVariant = (raw) => {
    const map = { PAID: 'success', UNPAID: 'warning', OVERDUE: 'danger' };
    return map[raw] || 'neutral';
  };

  return (
    <div className="space-y-6 text-white animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Payments & Invoicing</h1>
          <p className="text-xs text-[#94A3B8] mt-1 font-medium">
            Track school/college transportation subscription invoicing and collection status.
          </p>
        </div>
        {canUpdatePayments && (
          <Button variant="primary" onClick={() => setShowCreateModal(true)}>
            <Plus className="w-4 h-4" />
            New Payment
          </Button>
        )}
      </div>

      {/* Stats Summary Strip */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((s, idx) => (
          <StatCard
            key={idx}
            title={s.title}
            value={s.value}
            trend={s.trend}
            trendType={s.trendType}
            icon={s.icon}
          />
        ))}
      </div>

      {/* Filter Toolbar */}
      <Card className="p-4 bg-[#121827]/40 border border-white/5 shadow-2xl">
        <div className="flex flex-col md:flex-row md:items-center gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#94A3B8]" />
            <Input
              type="text"
              placeholder="Search by invoice number..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>

          <div className="flex flex-wrap gap-2">
            {STATUS_OPTIONS.map((s) => (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                className={`px-4 py-2 text-xs font-bold rounded-2xl transition-all duration-200 cursor-pointer ${
                  statusFilter === s
                    ? 'bg-gradient-to-tr from-[#8B7CFF] to-[#A78BFA] text-white shadow-lg shadow-[#8B7CFF]/25'
                    : 'bg-[#121827] border border-white/10 text-[#94A3B8] hover:bg-white/5 hover:text-white'
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      </Card>

      {/* Error */}
      {error && (
        <div className="p-4 bg-red-950/20 border border-red-500/20 text-red-400 text-xs font-bold rounded-2xl animate-fade-in">
          {error}
        </div>
      )}

      {/* Payment Dashboard Table */}
      <div>
        {loading ? (
          <div className="flex flex-col items-center justify-center py-24 gap-3 bg-[#121827]/40 border border-white/5 rounded-3xl">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#8B7CFF]" />
            <p className="text-xs text-[#94A3B8] font-semibold">Fetching payment logs...</p>
          </div>
        ) : payments.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4 bg-[#121827]/40 border border-white/5 rounded-3xl p-8 text-center shadow-2xl">
            <div className="w-16 h-16 rounded-3xl bg-[#0D1220] border border-white/5 flex items-center justify-center text-[#8B7CFF] text-2xl">
              <FileText className="w-8 h-8" />
            </div>
            <div className="max-w-sm">
              <h3 className="text-sm font-bold text-white">No transactions found</h3>
              <p className="text-xs text-[#94A3B8] mt-1 leading-normal">
                {canUpdatePayments
                  ? 'Click "New Payment" to create your first payment entry.'
                  : 'There are no transactions matching your search criteria or filter configuration.'}
              </p>
            </div>
            {canUpdatePayments && (
              <Button variant="primary" size="sm" onClick={() => setShowCreateModal(true)} className="mt-2">
                <Plus className="w-4 h-4" />
                Create First Payment
              </Button>
            )}
          </div>
        ) : (
          <div>
            {/* Dashboard Table Header */}
            <div className="mb-3 flex items-center gap-3">
              <CalendarDays className="w-5 h-5 text-[#8B7CFF]" />
              <h2 className="text-lg font-bold text-white tracking-tight">Payment Dashboard Table</h2>
            </div>

            <Table headers={[
              'Payment ID',
              'Institution',
              'Amount',
              'Due Date',
              'Status',
              ...(canUpdatePayments ? ['Actions'] : []),
            ]}>
              {payments.map((p) => {
                const statusVal = p.payment_status || p.status;
                return (
                  <tr key={p.id} className="hover:bg-white/5 transition-colors border-b border-white/5 last:border-0">
                    <td className="px-6 py-4 whitespace-nowrap text-xs font-bold text-white">
                      {p.invoice_number || '—'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-xs font-semibold text-[#94A3B8]">
                      {p.institution_name || p.Contract?.Institution?.institution_name || '—'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-xs font-bold text-white">
                      {formatCurrency(p.amount)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-xs text-[#94A3B8]/80 font-bold">
                      {formatDate(p.due_date)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Badge variant={statusVariant(statusVal)}>
                        {statusLabel(statusVal)}
                      </Badge>
                    </td>
                    {canUpdatePayments && (
                      <td className="px-6 py-4 whitespace-nowrap">
                        {(statusVal === 'UNPAID' || statusVal === 'OVERDUE') ? (
                          <Button
                            size="sm"
                            variant="success"
                            onClick={() => handleMarkPaid(p.id)}
                            disabled={markingId === p.id}
                          >
                            {markingId === p.id ? 'Saving...' : 'Mark Paid'}
                          </Button>
                        ) : (
                          <span className="text-[#94A3B8]/30 text-xs font-semibold">—</span>
                        )}
                      </td>
                    )}
                  </tr>
                );
              })}
            </Table>
          </div>
        )}
      </div>

      {/* Create Payment Modal */}
      {showCreateModal && (
        <CreatePaymentModal
          onClose={() => setShowCreateModal(false)}
          onCreated={fetchPayments}
        />
      )}
    </div>
  );
}

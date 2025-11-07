"use client";

import React, { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../lib/auth-context';

// Types
interface SummaryMetrics {
  owner_capital: number;
  revenue: number;
  expenses: number;
  net_income: number;
}

interface DuePayment {
  due_payment_id: number;
  purchase_order_id: number;
  due_amount: number;
  due_date: string;
  status: string; // raw status from DB
  computed_status: string; // enriched status
  paid_date?: string | null;
}

interface AIReport {
  summary: string;
  capital_analysis: string;
  liquidity_risk: string;
  due_payments_overview: string;
  recommendations: string[];
  alerts: string[];
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

// Simplified business selection for now – replace with actual selection UI later
const useActiveBusinessId = () => {
  // In a real app you would let user choose; for now read from localStorage or env
  const [bizId, setBizId] = useState<string | null>(null);
  useEffect(() => {
    const stored = localStorage.getItem('active_business_id');
    if (stored) setBizId(stored);
  }, []);
  return bizId;
};

export default function CashflowPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const businessId = useActiveBusinessId();

  const [metrics, setMetrics] = useState<SummaryMetrics | null>(null);
  const [dueTotals, setDueTotals] = useState<{ pending: number; paid: number; overdue: number } | null>(null);
  const [duePayments, setDuePayments] = useState<DuePayment[]>([]);
  const [aiReport, setAiReport] = useState<AIReport | null>(null);
  const [fetchingReport, setFetchingReport] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [businesses, setBusinesses] = useState<{ id: string; name: string }[]>([]);
  const [bizLoading, setBizLoading] = useState(false);
  const [formState, setFormState] = useState<{ purchase_order_id: string; due_amount: string; due_date: string }>({ purchase_order_id: '', due_amount: '', due_date: '' });
  const [submittingDue, setSubmittingDue] = useState(false);

  const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;
  const buildHeaders = (extra: Record<string, string> = {}): HeadersInit => {
    const h: Record<string, string> = { ...extra };
    if (token) h['Authorization'] = `Bearer ${token}`;
    return h as HeadersInit;
  };

  const loadSummary = useCallback(async () => {
    if (!businessId || !token) return;
    try {
      setError(null);
      const resp = await fetch(`${API_BASE_URL}/cashflow/summary/${businessId}`, { headers: buildHeaders() });
      if (!resp.ok) throw new Error('Failed to load summary');
      const data = await resp.json();
      setMetrics(data.metrics);
      setDueTotals(data.due_payment_totals);
    } catch (e: any) {
      setError(e.message || 'Summary error');
    }
  }, [businessId, token]);

  const loadDuePayments = useCallback(async () => {
    if (!businessId || !token) return;
    try {
      setError(null);
      const resp = await fetch(`${API_BASE_URL}/cashflow/due-payments/${businessId}`, { headers: buildHeaders() });
      if (!resp.ok) throw new Error('Failed to load due payments');
      const data = await resp.json();
      setDuePayments(data.due_payments || []);
    } catch (e: any) {
      setError(e.message || 'Due payments error');
    }
  }, [businessId, token]);

  const loadBusinesses = useCallback(async () => {
    if (!token) return;
    setBizLoading(true);
    try {
      const resp = await fetch(`${API_BASE_URL}/businesses`, { headers: buildHeaders() });
      const data = await resp.json();
      if (resp.ok) {
        setBusinesses((data.businesses || []).map((b: any) => ({ id: b.id, name: b.name })));
        // If no active set yet, pick first
        if (!businessId && data.businesses?.length) {
          localStorage.setItem('active_business_id', data.businesses[0].id);
        }
      }
    } catch (e) {
      // swallow silently
    } finally {
      setBizLoading(false);
    }
  }, [businessId, token]);

  const changeBusiness = (id: string) => {
    localStorage.setItem('active_business_id', id);
    setMetrics(null);
    setDuePayments([]);
    setAiReport(null);
    // Force reload chain
    loadSummary();
    loadDuePayments();
  };

  const submitDuePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!businessId || !token) return;
    if (!formState.purchase_order_id || !formState.due_amount || !formState.due_date) {
      setError('All fields required');
      return;
    }
    setSubmittingDue(true);
    try {
      setError(null);
      const resp = await fetch(`${API_BASE_URL}/cashflow/due-payments/${businessId}`, {
        method: 'POST',
        headers: buildHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify({
          purchase_order_id: Number(formState.purchase_order_id),
          due_amount: Number(formState.due_amount),
          due_date: formState.due_date
        })
      });
      const data = await resp.json();
      if (!resp.ok) throw new Error(data.error || 'Upsert failed');
      setFormState({ purchase_order_id: '', due_amount: '', due_date: '' });
      loadDuePayments();
      loadSummary();
    } catch (e: any) {
      setError(e.message || 'Upsert error');
    } finally {
      setSubmittingDue(false);
    }
  };

  const markPaid = async (id: number) => {
    if (!businessId || !token) return;
    try {
      const resp = await fetch(`${API_BASE_URL}/cashflow/due-payments/${businessId}/${id}/pay`, {
        method: 'POST',
        headers: buildHeaders({ 'Content-Type': 'application/json' })
      });
      const data = await resp.json();
      if (!resp.ok) throw new Error(data.error || 'Mark paid failed');
      loadDuePayments();
      loadSummary();
    } catch (e: any) {
      setError(e.message || 'Mark paid error');
    }
  };

  const deleteDue = async (id: number) => {
    if (!businessId || !token) return;
    try {
      const resp = await fetch(`${API_BASE_URL}/cashflow/due-payments/${businessId}/${id}`, {
        method: 'DELETE',
        headers: buildHeaders()
      });
      const data = await resp.json();
      if (!resp.ok) throw new Error(data.error || 'Delete failed');
      loadDuePayments();
      loadSummary();
    } catch (e: any) {
      setError(e.message || 'Delete error');
    }
  };

  const generateAIReport = async () => {
    if (!businessId || !token) return;
    setFetchingReport(true);
    setAiReport(null);
    try {
      const resp = await fetch(`${API_BASE_URL}/cashflow/ai-report/${businessId}`, {
        method: 'POST',
        headers: buildHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify({})
      });
      const data = await resp.json();
      if (!resp.ok) throw new Error(data.error || 'AI report failed');
      setAiReport(data.analysis);
    } catch (e: any) {
      setError(e.message || 'AI report error');
    } finally {
      setFetchingReport(false);
    }
  };

  useEffect(() => {
    if (businessId && token) {
      loadSummary();
      loadDuePayments();
    }
  }, [businessId, token, loadSummary, loadDuePayments]);

  useEffect(() => {
    if (token) loadBusinesses();
  }, [token, loadBusinesses]);

  if (authLoading) {
    return <div className="p-6">Loading authentication…</div>;
  }
  if (!user) {
    return <div className="p-6">Please log in to view cashflow.</div>;
  }
  const activeBizName = businesses.find(b => b.id === businessId)?.name;

  return (
    <div className="p-6 space-y-8 min-h-screen bg-gray-50">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-semibold">Cashflow Dashboard</h1>
        <div className="flex items-center gap-2">
          <label className="text-sm text-gray-600">Business:</label>
          <select
            disabled={bizLoading || businesses.length === 0}
            value={businessId || ''}
            onChange={e => changeBusiness(e.target.value)}
            className="border rounded px-2 py-1 bg-white text-sm"
          >
            <option value="" disabled>{bizLoading ? 'Loading...' : 'Select business'}</option>
            {businesses.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
          </select>
          <button
            onClick={() => router.push('/businesses')}
            className="text-indigo-600 text-sm hover:underline"
          >Manage Businesses</button>
        </div>
      </div>
      {activeBizName && (
        <div className="text-sm text-gray-500">Active: {activeBizName}</div>
      )}
      {!businessId && (
        <div className="p-4 bg-yellow-50 border border-yellow-200 rounded">
          Select or create a business to view cashflow data.
        </div>
      )}
      {error && <div className="bg-red-100 text-red-700 px-4 py-2 rounded">{error}</div>}

      {/* Summary Metrics */}
      <section className="bg-white rounded-lg shadow-sm p-5 border">
        <h2 className="text-xl font-medium mb-4">Summary</h2>
        {!metrics ? (
          <div>Loading summary…</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <MetricCard label="Owner Capital" value={metrics.owner_capital} />
            <MetricCard label="Revenue" value={metrics.revenue} />
            <MetricCard label="Expenses" value={metrics.expenses} />
            <MetricCard label="Net Income" value={metrics.net_income} highlight />
          </div>
        )}
        {dueTotals && (
          <div className="mt-4 flex flex-wrap gap-4 text-sm">
            <Badge label="Pending Due" value={dueTotals.pending} color="yellow" />
            <Badge label="Overdue" value={dueTotals.overdue} color="red" />
            <Badge label="Paid" value={dueTotals.paid} color="green" />
          </div>
        )}
      </section>

      {/* Due Payments Management */}
      <section className="bg-white rounded-lg shadow-sm p-5 border">
        <h2 className="text-xl font-medium mb-4">Due Payments</h2>
        <form onSubmit={submitDuePayment} className="flex flex-wrap gap-2 mb-4 items-end">
          <div className="flex flex-col">
            <label className="text-sm">Purchase Order ID</label>
            <input
              type="number"
              className="border px-2 py-1 rounded"
              value={formState.purchase_order_id}
              onChange={e => setFormState(s => ({ ...s, purchase_order_id: e.target.value }))}
            />
          </div>
          <div className="flex flex-col">
            <label className="text-sm">Due Amount</label>
            <input
              type="number"
              step="0.01"
              className="border px-2 py-1 rounded"
              value={formState.due_amount}
              onChange={e => setFormState(s => ({ ...s, due_amount: e.target.value }))}
            />
          </div>
          <div className="flex flex-col">
            <label className="text-sm">Due Date</label>
            <input
              type="date"
              className="border px-2 py-1 rounded"
              value={formState.due_date}
              onChange={e => setFormState(s => ({ ...s, due_date: e.target.value }))}
            />
          </div>
          <button
            disabled={submittingDue}
            className="bg-blue-600 text-white px-4 py-2 rounded disabled:opacity-50"
          >{submittingDue ? 'Saving…' : 'Save Due'}</button>
        </form>
        <div className="overflow-auto">
          <table className="min-w-full text-sm border">
            <thead>
              <tr className="bg-gray-50">
                <th className="p-2 border">PO ID</th>
                <th className="p-2 border">Amount</th>
                <th className="p-2 border">Due Date</th>
                <th className="p-2 border">Status</th>
                <th className="p-2 border">Paid Date</th>
                <th className="p-2 border">Actions</th>
              </tr>
            </thead>
            <tbody>
              {duePayments.map(dp => (
                <tr key={dp.due_payment_id} className="hover:bg-gray-50">
                  <td className="p-2 border">{dp.purchase_order_id}</td>
                  <td className="p-2 border">{dp.due_amount.toFixed(2)}</td>
                  <td className="p-2 border">{dp.due_date}</td>
                  <td className="p-2 border">
                    <span className={statusClass(dp.computed_status)}>{dp.computed_status}</span>
                  </td>
                  <td className="p-2 border">{dp.paid_date || '-'}</td>
                  <td className="p-2 border space-x-2">
                    {dp.computed_status !== 'paid' && (
                      <button onClick={() => markPaid(dp.due_payment_id)} className="text-green-600 hover:underline">Mark Paid</button>
                    )}
                    <button onClick={() => deleteDue(dp.due_payment_id)} className="text-red-600 hover:underline">Delete</button>
                  </td>
                </tr>
              ))}
              {duePayments.length === 0 && (
                <tr>
                  <td colSpan={6} className="p-4 text-center text-gray-500">No due payments yet</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* AI Report */}
      <section className="bg-white rounded-lg shadow-sm p-5 border">
        <h2 className="text-xl font-medium mb-4">AI Cashflow Report</h2>
        <button
          onClick={generateAIReport}
          disabled={fetchingReport}
          className="bg-purple-600 text-white px-4 py-2 rounded disabled:opacity-50"
        >{fetchingReport ? 'Generating…' : 'Generate Report'}</button>
        {aiReport && (
          <div className="mt-4 space-y-4 bg-white border rounded p-4 shadow-sm">
            <ReportBlock title="Summary" text={aiReport.summary} />
            <ReportBlock title="Capital" text={aiReport.capital_analysis} />
            <ReportBlock title="Liquidity Risk" text={aiReport.liquidity_risk} />
            <ReportBlock title="Due Payments" text={aiReport.due_payments_overview} />
            <div>
              <h3 className="font-semibold mb-1">Recommendations</h3>
              <ul className="list-disc pl-5 space-y-1">
                {aiReport.recommendations.map((r, i) => <li key={i}>{r}</li>)}
              </ul>
            </div>
            {aiReport.alerts && aiReport.alerts.length > 0 && (
              <div>
                <h3 className="font-semibold mb-1">Alerts</h3>
                <ul className="list-disc pl-5 space-y-1 text-red-600">
                  {aiReport.alerts.map((a, i) => <li key={i}>{a}</li>)}
                </ul>
              </div>
            )}
          </div>
        )}
      </section>
    </div>
  );
}

// Components
function MetricCard({ label, value, highlight }: { label: string; value: number; highlight?: boolean }) {
  return (
    <div className={`border rounded p-4 bg-gradient-to-br from-white to-gray-50 shadow-sm ${highlight ? 'ring-2 ring-green-500' : ''}`}>
      <div className="text-sm text-gray-500">{label}</div>
      <div className="text-lg font-semibold">{value.toFixed(2)}</div>
    </div>
  );
}

function Badge({ label, value, color }: { label: string; value: number; color: 'red' | 'green' | 'yellow' }) {
  const colorMap: Record<string, string> = {
    red: 'bg-red-100 text-red-700',
    green: 'bg-green-100 text-green-700',
    yellow: 'bg-yellow-100 text-yellow-700'
  };
  return (
    <div className={`px-3 py-1 rounded ${colorMap[color]} text-xs font-medium`}>{label}: {value.toFixed(2)}</div>
  );
}

function statusClass(status: string) {
  switch (status) {
    case 'paid': return 'text-green-600';
    case 'overdue': return 'text-red-600 font-semibold';
    default: return 'text-yellow-600';
  }
}

function ReportBlock({ title, text }: { title: string; text: string }) {
  return (
    <div>
      <h3 className="font-semibold mb-1">{title}</h3>
      <p className="text-sm leading-relaxed whitespace-pre-line">{text}</p>
    </div>
  );
}


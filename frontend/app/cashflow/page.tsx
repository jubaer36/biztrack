"use client";

import React, { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../lib/auth-context';

// Icons components
const DollarIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
  </svg>
);

const TrendingUpIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
  </svg>
);

const TrendingDownIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6" />
  </svg>
);

const CalculatorIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01m-4.01 0h.01M12 4h.01M8 4h.01M16 4h.01" />
  </svg>
);

const ClockIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const CheckCircleIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const ExclamationTriangleIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.464 0L4.35 16.5c-.77.833.192 2.5 1.732 2.5z" />
  </svg>
);

const XIcon = () => (
  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
  </svg>
);

const SparklesIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
  </svg>
);

const BuildingIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
  </svg>
);

const CogIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
  </svg>
);

const DocumentReportIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
  </svg>
);

const PlusIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
  </svg>
);

const TrashIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
  </svg>
);

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

  const updateBusinessId = (newId: string) => {
    localStorage.setItem('active_business_id', newId);
    setBizId(newId);
  };

  return { businessId: bizId, updateBusinessId };
};

export default function CashflowPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const { businessId, updateBusinessId } = useActiveBusinessId();

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
  const [showReportModal, setShowReportModal] = useState(false);

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
          updateBusinessId(data.businesses[0].id);
        }
      }
    } catch (e) {
      // swallow silently
    } finally {
      setBizLoading(false);
    }
  }, [businessId, token]);

  const changeBusiness = (id: string) => {
    setMetrics(null);
    setDuePayments([]);
    setAiReport(null);
    setError(null);
    updateBusinessId(id);
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
      setShowReportModal(true);
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
  }, [businessId, token, loadBusinesses]);

  if (authLoading) {
    return <div className="p-6">Loading authentication…</div>;
  }
  if (!user) {
    return <div className="p-6">Please log in to view cashflow.</div>;
  }
  const activeBizName = businesses.find(b => b.id === businessId)?.name;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-sm border-b border-gray-200/50 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg">
                <DollarIcon />
              </div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">
                Cashflow Dashboard
              </h1>
            </div>
            <div className="flex items-center gap-4">
              <button
                onClick={generateAIReport}
                disabled={fetchingReport || !businessId}
                className="flex items-center gap-2 bg-gradient-to-r from-purple-600 to-indigo-600 text-white px-4 py-2.5 rounded-xl disabled:opacity-50 hover:from-purple-700 hover:to-indigo-700 transition-all duration-200 shadow-lg hover:shadow-xl disabled:cursor-not-allowed font-medium"
              >
                <SparklesIcon />
                {fetchingReport ? 'Generating…' : 'Generate AI Report'}
              </button>
              <div className="flex items-center gap-3 bg-white/70 backdrop-blur-sm rounded-xl px-4 py-2 border border-gray-200/50">
                <BuildingIcon />
                <label className="text-sm font-medium text-gray-600">Business:</label>
                <select
                  disabled={bizLoading || businesses.length === 0}
                  value={businessId || ''}
                  onChange={e => changeBusiness(e.target.value)}
                  className="border-0 bg-transparent text-sm font-medium focus:ring-2 focus:ring-blue-500 rounded-lg px-2 py-1"
                >
                  <option value="" disabled>{bizLoading ? 'Loading...' : 'Select business'}</option>
                  {businesses.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                </select>
                <button
                  onClick={() => router.push('/businesses')}
                  className="flex items-center gap-1 text-indigo-600 text-sm hover:text-indigo-800 font-medium transition-colors"
                >
                  <CogIcon />
                  Manage
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8 space-y-8">
        {activeBizName && (
          <div className="flex items-center gap-2 text-sm text-gray-600 bg-white/60 backdrop-blur-sm rounded-full px-4 py-2 w-fit">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            Active: <span className="font-medium">{activeBizName}</span>
          </div>
        )}
        {!businessId && (
          <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-xl p-6 flex items-center gap-3">
            <ExclamationTriangleIcon />
            <span className="font-medium text-amber-800">Select or create a business to view cashflow data.</span>
          </div>
        )}
        {error && (
          <div className="bg-gradient-to-r from-red-50 to-pink-50 border border-red-200 text-red-700 px-6 py-4 rounded-xl flex items-center gap-3">
            <ExclamationTriangleIcon />
            <span className="font-medium">{error}</span>
          </div>
        )}

        {/* Summary Metrics */}
        <section className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-xl p-8 border border-gray-200/50">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-gradient-to-r from-green-500 to-emerald-500 rounded-lg">
              <CalculatorIcon />
            </div>
            <h2 className="text-xl font-bold text-gray-800">Financial Overview</h2>
          </div>
          {!metrics ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <span className="ml-3 text-gray-600">Loading summary…</span>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <MetricCard
                label="Owner Capital"
                value={metrics.owner_capital}
                icon={<DollarIcon />}
                color="blue"
              />
              <MetricCard
                label="Revenue"
                value={metrics.revenue}
                icon={<TrendingUpIcon />}
                color="green"
              />
              <MetricCard
                label="Expenses"
                value={metrics.expenses}
                icon={<TrendingDownIcon />}
                color="red"
              />
              <MetricCard
                label="Net Income"
                value={metrics.net_income}
                icon={<CalculatorIcon />}
                color="purple"
                highlight
              />
            </div>
          )}
          {dueTotals && (
            <div className="mt-8 flex flex-wrap gap-4">
              <Badge label="Pending Due" value={dueTotals.pending} color="yellow" icon={<ClockIcon />} />
              <Badge label="Overdue" value={dueTotals.overdue} color="red" icon={<ExclamationTriangleIcon />} />
              <Badge label="Paid" value={dueTotals.paid} color="green" icon={<CheckCircleIcon />} />
            </div>
          )}
        </section>

        {/* Due Payments Management */}
        <section className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-xl p-8 border border-gray-200/50">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-gradient-to-r from-orange-500 to-red-500 rounded-lg">
              <DocumentReportIcon />
            </div>
            <h2 className="text-xl font-bold text-gray-800">Due Payments Management</h2>
          </div>

          {/* Add New Due Payment Form */}
          {/* <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6 mb-6 border border-blue-200/50">
            <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <PlusIcon />
              Add New Due Payment
            </h3>
            <form onSubmit={submitDuePayment} className="flex flex-wrap gap-4 items-end">
              <div className="flex flex-col min-w-0 flex-1">
                <label className="text-sm font-medium text-gray-700 mb-1">Purchase Order ID</label>
                <input
                  type="number"
                  className="border border-gray-300 px-3 py-2 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all bg-white/80"
                  value={formState.purchase_order_id}
                  onChange={e => setFormState(s => ({ ...s, purchase_order_id: e.target.value }))}
                  placeholder="Enter PO ID"
                />
              </div>
              <div className="flex flex-col min-w-0 flex-1">
                <label className="text-sm font-medium text-gray-700 mb-1">Due Amount</label>
                <input
                  type="number"
                  step="0.01"
                  className="border border-gray-300 px-3 py-2 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all bg-white/80"
                  value={formState.due_amount}
                  onChange={e => setFormState(s => ({ ...s, due_amount: e.target.value }))}
                  placeholder="0.00"
                />
              </div>
              <div className="flex flex-col min-w-0 flex-1">
                <label className="text-sm font-medium text-gray-700 mb-1">Due Date</label>
                <input
                  type="date"
                  className="border border-gray-300 px-3 py-2 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all bg-white/80"
                  value={formState.due_date}
                  onChange={e => setFormState(s => ({ ...s, due_date: e.target.value }))}
                />
              </div>
              <button
                disabled={submittingDue}
                className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-6 py-2.5 rounded-lg disabled:opacity-50 hover:from-blue-700 hover:to-indigo-700 transition-all font-medium shadow-lg hover:shadow-xl flex items-center gap-2"
              >
                <PlusIcon />
                {submittingDue ? 'Saving…' : 'Save Due'}
              </button>
            </form>
          </div> */}

          {/* Due Payments Table */}
          <div className="overflow-hidden rounded-xl border border-gray-200/50 bg-white/80">
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
                  <tr>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">PO ID</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Amount</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Due Date</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Status</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Paid Date</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {duePayments.map(dp => (
                    <tr key={dp.due_payment_id} className="hover:bg-blue-50/50 transition-colors">
                      <td className="px-6 py-4 text-sm font-medium text-gray-900">{dp.purchase_order_id}</td>
                      <td className="px-6 py-4 text-sm text-gray-700 font-medium">${dp.due_amount.toFixed(2)}</td>
                      <td className="px-6 py-4 text-sm text-gray-700">{dp.due_date}</td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${statusClass(dp.computed_status)}`}>
                          {dp.computed_status === 'paid' && <CheckCircleIcon />}
                          {dp.computed_status === 'overdue' && <ExclamationTriangleIcon />}
                          {dp.computed_status === 'pending' && <ClockIcon />}
                          <span className="ml-1">{dp.computed_status}</span>
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-700">{dp.paid_date || '-'}</td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          {dp.computed_status !== 'paid' && (
                            <button
                              onClick={() => markPaid(dp.due_payment_id)}
                              className="inline-flex items-center gap-1 text-green-600 hover:text-green-800 text-sm font-medium transition-colors"
                            >
                              <CheckCircleIcon />
                              Mark Paid
                            </button>
                          )}
                          <button
                            onClick={() => deleteDue(dp.due_payment_id)}
                            className="inline-flex items-center gap-1 text-red-600 hover:text-red-800 text-sm font-medium transition-colors"
                          >
                            <TrashIcon />
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {duePayments.length === 0 && (
                    <tr>
                      <td colSpan={6} className="px-6 py-12 text-center">
                        <div className="flex flex-col items-center gap-2 text-gray-500">
                          <DocumentReportIcon />
                          <span className="text-sm">No due payments yet</span>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        {/* AI Report Modal */}
        {showReportModal && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
              <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gradient-to-r from-purple-50 to-indigo-50">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-gradient-to-r from-purple-600 to-indigo-600 rounded-lg">
                    <SparklesIcon />
                  </div>
                  <h2 className="text-xl font-bold text-gray-800">AI Cashflow Report</h2>
                </div>
                <button
                  onClick={() => setShowReportModal(false)}
                  className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-all"
                >
                  <XIcon />
                </button>
              </div>
              <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)] bg-gradient-to-b from-white to-gray-50">
                {aiReport && (
                  <div className="space-y-8">
                    <ReportBlock title="Summary" text={aiReport.summary} icon={<DocumentReportIcon />} />
                    <ReportBlock title="Capital Analysis" text={aiReport.capital_analysis} icon={<DollarIcon />} />
                    <ReportBlock title="Liquidity Risk" text={aiReport.liquidity_risk} icon={<ExclamationTriangleIcon />} />
                    <ReportBlock title="Due Payments Overview" text={aiReport.due_payments_overview} icon={<ClockIcon />} />
                    <div className="bg-blue-50 rounded-xl p-6 border border-blue-200">
                      <h3 className="flex items-center gap-2 font-bold mb-4 text-lg text-blue-800">
                        <TrendingUpIcon />
                        Recommendations
                      </h3>
                      <ul className="space-y-3">
                        {aiReport.recommendations.map((r, i) => (
                          <li key={i} className="flex items-start gap-3 text-sm leading-relaxed">
                            <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                            <span>{r}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                    {aiReport.alerts && aiReport.alerts.length > 0 && (
                      <div className="bg-red-50 rounded-xl p-6 border border-red-200">
                        <h3 className="flex items-center gap-2 font-bold mb-4 text-lg text-red-800">
                          <ExclamationTriangleIcon />
                          Alerts
                        </h3>
                        <ul className="space-y-3">
                          {aiReport.alerts.map((a, i) => (
                            <li key={i} className="flex items-start gap-3 text-sm leading-relaxed text-red-700">
                              <div className="w-2 h-2 bg-red-500 rounded-full mt-2 flex-shrink-0"></div>
                              <span>{a}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// Components
function MetricCard({ label, value, highlight, icon, color }: {
  label: string;
  value: number;
  highlight?: boolean;
  icon?: React.ReactNode;
  color?: string;
}) {
  const colorMap: Record<string, string> = {
    blue: 'from-slate-600 to-slate-700 border-slate-200',
    green: 'from-slate-600 to-slate-700 border-slate-200',
    red: 'from-slate-600 to-slate-700 border-slate-200',
    purple: 'from-slate-600 to-slate-700 border-slate-200',
  };

  const bgColorMap: Record<string, string> = {
    blue: 'from-white to-slate-50',
    green: 'from-white to-slate-50',
    red: 'from-white to-slate-50',
    purple: 'from-white to-slate-50',
  };

  const accentColors: Record<string, string> = {
    blue: 'text-blue-600',
    green: 'text-green-600',
    red: 'text-red-600',
    purple: 'text-purple-600',
  };

  return (
    <div className={`relative overflow-hidden rounded-xl border ${highlight ? 'ring-2 ring-slate-300 ring-opacity-50' : ''} border-slate-200 bg-gradient-to-br ${color ? bgColorMap[color] : 'from-white to-gray-50'} p-6 shadow-sm hover:shadow-md transition-all duration-200`}>
      <div className="flex items-center justify-between mb-2">
        <div className="text-sm font-medium text-gray-600">{label}</div>
        {icon && (
          <div className={`p-2 rounded-lg bg-gradient-to-r ${color ? colorMap[color] : 'from-gray-500 to-gray-600'} text-white opacity-80`}>
            {icon}
          </div>
        )}
      </div>
      <div className={`text-2xl font-bold ${color ? accentColors[color] : 'text-gray-800'}`}>${value.toFixed(2)}</div>
      {highlight && (
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-slate-400 to-slate-500"></div>
      )}
    </div>
  );
}

function Badge({ label, value, color, icon }: {
  label: string;
  value: number;
  color: 'red' | 'green' | 'yellow';
  icon?: React.ReactNode;
}) {
  const colorMap: Record<string, string> = {
    red: 'bg-gradient-to-r from-red-100 to-red-200 text-red-800 border-red-300',
    green: 'bg-gradient-to-r from-green-100 to-green-200 text-green-800 border-green-300',
    yellow: 'bg-gradient-to-r from-yellow-100 to-yellow-200 text-yellow-800 border-yellow-300'
  };
  return (
    <div className={`flex items-center gap-2 px-4 py-2 rounded-full border ${colorMap[color]} text-sm font-semibold shadow-sm`}>
      {icon}
      <span>{label}: ${value.toFixed(2)}</span>
    </div>
  );
}

function statusClass(status: string) {
  switch (status) {
    case 'paid': return 'bg-green-100 text-green-800 border-green-300';
    case 'overdue': return 'bg-red-100 text-red-800 border-red-300';
    default: return 'bg-yellow-100 text-yellow-800 border-yellow-300';
  }
}

function ReportBlock({ title, text, icon }: { title: string; text: string; icon?: React.ReactNode }) {
  return (
    <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
      <h3 className="flex items-center gap-2 font-bold mb-3 text-lg text-gray-800">
        {icon}
        {title}
      </h3>
      <p className="text-sm leading-relaxed text-gray-700 whitespace-pre-line">{text}</p>
    </div>
  );
}


"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ForecastChart } from "@/components/ForecastChart";

interface Business { id: string; name: string; description?: string | null }
interface ForecastItem {
	product_id: string;
	product_name: string;
	demand_forecast_units: number;
	confidence_score?: number;
}

interface TopProductItem {
	product_id: string;
	product_name: string;
	units_sold: number;
}

interface AiHeadsUpItem {
	product_id: string;
	product_name: string;
	demand_level: 'high' | 'medium' | 'low';
	anomaly?: boolean;
	rationale?: string;
}

interface AiInsightsPayload {
	heads_up: AiHeadsUpItem[];
	window: string;
	notes?: string[];
}

type WindowKey = '7' | '15' | '30' | 'all';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

export default function ForecastPage() {
	const { user, loading } = useAuth();
	const router = useRouter();

	const [businesses, setBusinesses] = useState<Business[]>([]);
	const [selectedBusiness, setSelectedBusiness] = useState<string>("");
	const [forecast, setForecast] = useState<ForecastItem[]>([]);
	const [pageLoading, setPageLoading] = useState<boolean>(false);
	const [error, setError] = useState<string | null>(null);

	const [topWindow, setTopWindow] = useState<WindowKey>('7');
	const [topLoading, setTopLoading] = useState<boolean>(false);
	const [topError, setTopError] = useState<string | null>(null);
	const [topProducts, setTopProducts] = useState<TopProductItem[]>([]);

	const [aiLoading, setAiLoading] = useState<boolean>(false);
	const [aiError, setAiError] = useState<string | null>(null);
	const [aiInsights, setAiInsights] = useState<AiInsightsPayload | null>(null);

	useEffect(() => {
		if (!loading && !user) router.push("/auth/login");
	}, [loading, user, router]);

	useEffect(() => {
		const loadBusinesses = async () => {
			try {
				const token = localStorage.getItem("access_token");
				const resp = await fetch(`${API_BASE}/businesses`, {
					headers: { Authorization: `Bearer ${token}` },
				});
				const data = await resp.json();
				setBusinesses(data.businesses || []);
				if (data.businesses?.[0]?.id) setSelectedBusiness(data.businesses[0].id);
			} catch (e) {
				setError("Failed to load businesses");
			}
		};
		loadBusinesses();
	}, []);

	useEffect(() => {
		const loadForecast = async () => {
			if (!selectedBusiness) return;
			try {
				setPageLoading(true);
				setError(null);
				const token = localStorage.getItem("access_token");
				const resp = await fetch(`${API_BASE}/forecast/generate/${selectedBusiness}`, {
					headers: { Authorization: `Bearer ${token}` },
				});
				if (!resp.ok) {
					const e = await resp.json().catch(() => ({}));
					throw new Error(e.error || "Failed to load forecast");
				}
				const data = await resp.json();
				setForecast(data.forecast || []);
			} catch (e: any) {
				setError(e.message || "Failed to load forecast");
			} finally {
				setPageLoading(false);
			}
		};
		loadForecast();
	}, [selectedBusiness]);

	useEffect(() => {
		const loadTopProducts = async () => {
			if (!selectedBusiness) return;
			try {
				setTopLoading(true);
				setTopError(null);
				const token = localStorage.getItem("access_token");
				const resp = await fetch(`${API_BASE}/analytics/top-products/${selectedBusiness}?window=${topWindow}`, {
					headers: { Authorization: `Bearer ${token}` },
				});
				if (!resp.ok) {
					const e = await resp.json().catch(() => ({}));
					throw new Error(e.error || "Failed to load top products");
				}
				const data = await resp.json();
				setTopProducts(data.products || []);
			} catch (e: any) {
				setTopError(e.message || "Failed to load top products");
			} finally {
				setTopLoading(false);
			}
		};
		loadTopProducts();
	}, [selectedBusiness, topWindow]);

	const chartData = useMemo(() => {
		if (!forecast?.length) return [{ month: "Next", forecast: 0 }];
		// Show top 6 products; use product name as x-axis label
		return forecast.slice(0, 6).map((f) => ({
			month: f.product_name || f.product_id,
			forecast: f.demand_forecast_units,
			confidence: typeof f.confidence_score === 'number' ? `${Math.round(f.confidence_score * 100)}%` : undefined,
		}));
	}, [forecast]);

	const handleGenerateAi = async () => {
		if (!selectedBusiness) return;
		try {
			setAiLoading(true);
			setAiError(null);
			setAiInsights(null);
			const token = localStorage.getItem("access_token");
			const windowParam = topWindow === 'all' ? '30' : topWindow;

			// 1) Fetch legit holidays and weather for Bangladesh (and optional coords later)
			const ctxResp = await fetch(`${API_BASE}/forecast/context/${selectedBusiness}?window=${windowParam}`, {
				headers: { Authorization: `Bearer ${token}` }
			});
			if (!ctxResp.ok) {
				const e = await ctxResp.json().catch(() => ({}));
				throw new Error(e.error || 'Failed to load forecasting context');
			}
			const ctx = await ctxResp.json();

			// 2) Call AI endpoint with fetched holidays and weather
			const resp = await fetch(`${API_BASE}/forecast/ai/${selectedBusiness}`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
				body: JSON.stringify({ window: windowParam, holidays: ctx.holidays || [], weather: ctx.weather || [] })
			});
			if (!resp.ok) {
				const e = await resp.json().catch(() => ({}));
				throw new Error(e.error || 'Failed to generate AI insights');
			}
			const data = await resp.json();
			setAiInsights(data.insights || null);
		} catch (e: any) {
			setAiError(e.message || 'Failed to generate AI insights');
		} finally {
			setAiLoading(false);
		}
	};

	return (
		<div className="min-h-screen bg-gradient-to-br from-background via-background to-muted">
			<header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-40">
				<div className="container mx-auto px-4 py-4 flex items-center justify-between gap-4">
					<div>
						<h1 className="text-2xl font-bold text-foreground">Demand Forecasting</h1>
						<p className="text-sm text-muted-foreground">AI predictions per product for the next period</p>
					</div>
					<div>
						<select
							value={selectedBusiness}
							onChange={(e) => setSelectedBusiness(e.target.value)}
							className="px-4 py-2 rounded-md border border-border bg-card text-foreground min-w-[220px]"
						>
							{businesses.map((b) => (
								<option key={b.id} value={b.id}>{b.name}</option>
							))}
						</select>
					</div>
				</div>
			</header>

			<main className="container mx-auto px-4 py-8 space-y-6">
				{error && (
					<div className="text-sm text-red-600 border border-red-200 bg-red-50 rounded p-3">{error}</div>
				)}

				<Card>
					<CardHeader>
						<CardTitle>Next Period Forecast</CardTitle>
						<CardDescription>Top products by expected units</CardDescription>
					</CardHeader>
					<CardContent>
						<ForecastChart data={chartData} />
						<div className="mt-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
							{forecast.slice(0, 12).map((f) => (
								<div key={f.product_id} className="p-4 rounded-lg border border-border bg-card/50">
									<div className="flex items-center justify-between">
										<div>
											<div className="font-medium truncate max-w-[220px]" title={f.product_name}>{f.product_name}</div>
											<div className="text-xs text-muted-foreground">ID: {f.product_id}</div>
										</div>
										<div className="text-right">
											<div className="text-xl font-bold">{f.demand_forecast_units.toLocaleString()} units</div>
											{typeof f.confidence_score === 'number' && (
												<div className="text-xs text-muted-foreground">Confidence: {Math.round(f.confidence_score * 100)}%</div>
											)}
										</div>
									</div>
								</div>
							))}
							{!forecast.length && !pageLoading && (
								<div className="text-sm text-muted-foreground">No forecast yet. Upload and map data first.</div>
							)}
						</div>
					</CardContent>
				</Card>

				<Card>
					<CardHeader>
						<CardTitle>Top Selling Products</CardTitle>
						<CardDescription>7 / 15 / 30 days and all-time selling trends</CardDescription>
					</CardHeader>
					<CardContent>
						<div className="flex gap-2 mb-4">
							{(['7','15','30','all'] as WindowKey[]).map(w => (
								<button
									key={w}
									onClick={() => setTopWindow(w)}
									className={`px-3 py-1.5 rounded-md border ${topWindow===w ? 'bg-primary text-primary-foreground border-primary' : 'bg-card border-border text-foreground'}`}
								>
									{w === 'all' ? 'All time' : `${w} days`}
								</button>
							))}
						</div>

						{topError && (
							<div className="text-sm text-red-600 border border-red-200 bg-red-50 rounded p-3 mb-3">{topError}</div>
						)}

						<div className="overflow-x-auto border border-border rounded-lg">
							<table className="w-full text-sm">
								<thead className="bg-muted/50">
									<tr>
										<th className="text-left p-3 font-medium">#</th>
										<th className="text-left p-3 font-medium">Product</th>
										<th className="text-right p-3 font-medium">Units sold</th>
									</tr>
								</thead>
								<tbody>
									{(topProducts || []).map((p, idx) => (
										<tr key={p.product_id} className="border-t border-border">
											<td className="p-3">{idx + 1}</td>
											<td className="p-3">
												<div className="font-medium">{p.product_name}</div>
												<div className="text-xs text-muted-foreground">{p.product_id}</div>
											</td>
											<td className="p-3 text-right font-semibold">{p.units_sold.toLocaleString()}</td>
										</tr>
									))}
									{!topLoading && (!topProducts || topProducts.length === 0) && (
										<tr>
											<td className="p-3 text-muted-foreground" colSpan={3}>No sales yet for this window.</td>
										</tr>
									)}
								</tbody>
							</table>
						</div>
					</CardContent>
				</Card>

				<Card>
					<CardHeader>
						<CardTitle>AI Insights</CardTitle>
						<CardDescription>Demand heads-up using holidays and weather context</CardDescription>
					</CardHeader>
					<CardContent>
						<div className="flex items-center gap-3 mb-4">
							<button
								onClick={handleGenerateAi}
								disabled={aiLoading || !selectedBusiness}
								className={`px-4 py-2 rounded-md border ${aiLoading ? 'opacity-70 cursor-not-allowed' : ''} bg-primary text-primary-foreground border-primary`}
							>
								{aiLoading ? 'Generating…' : `Generate AI for ${topWindow === 'all' ? '30' : topWindow} days`}
							</button>
							<span className="text-xs text-muted-foreground">Uses BD public holidays and local weather</span>
						</div>

						{aiError && (
							<div className="text-sm text-red-600 border border-red-200 bg-red-50 rounded p-3 mb-3">{aiError}</div>
						)}

						{aiInsights && (
							<div className="space-y-3">
								<div className="overflow-x-auto border border-border rounded-lg">
									<table className="w-full text-sm">
										<thead className="bg-muted/50">
											<tr>
												<th className="text-left p-3 font-medium">Product</th>
												<th className="text-left p-3 font-medium">Demand</th>
												<th className="text-left p-3 font-medium">Anomaly</th>
												<th className="text-left p-3 font-medium">Rationale</th>
											</tr>
										</thead>
										<tbody>
											{aiInsights.heads_up?.map((it) => (
												<tr key={it.product_id} className="border-t border-border">
													<td className="p-3">
														<div className="font-medium">{it.product_name}</div>
														<div className="text-xs text-muted-foreground">{it.product_id}</div>
													</td>
													<td className="p-3">
														<span className={`px-2 py-0.5 rounded text-xs ${it.demand_level==='high' ? 'bg-green-100 text-green-700' : it.demand_level==='medium' ? 'bg-yellow-100 text-yellow-700' : 'bg-gray-100 text-gray-700'}`}>{it.demand_level}</span>
													</td>
													<td className="p-3">
														{it.anomaly ? <span className="px-2 py-0.5 rounded text-xs bg-red-100 text-red-700">Yes</span> : <span className="text-xs text-muted-foreground">No</span>}
													</td>
													<td className="p-3 max-w-[520px]">{it.rationale}</td>
												</tr>
											))}
											{(!aiInsights.heads_up || aiInsights.heads_up.length === 0) && (
												<tr>
													<td className="p-3 text-muted-foreground" colSpan={4}>No AI heads-up available.</td>
												</tr>
											)}
										</tbody>
									</table>
								</div>
								{aiInsights.notes?.length ? (
									<div className="text-xs text-muted-foreground">
										<ul className="list-disc pl-5">
											{aiInsights.notes.map((n, idx) => <li key={idx}>{n}</li>)}
										</ul>
									</div>
								) : null}
							</div>
						)}
					</CardContent>
				</Card>
			</main>
		</div>
	);
}

"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

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

interface ContextHoliday { date: string; name: string }
interface ContextWeather { date: string; weather: string }

type WindowKey = '7' | '15' | '30' | 'all' | 'last_year';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

export default function ForecastPage() {
	const { user, loading } = useAuth();
	const router = useRouter();

	const [businesses, setBusinesses] = useState<Business[]>([]);
	const [selectedBusiness, setSelectedBusiness] = useState<string>("");
	const [error, setError] = useState<string | null>(null);

	const [aiLoading, setAiLoading] = useState<boolean>(false);
	const [aiError, setAiError] = useState<string | null>(null);
	const [aiInsights, setAiInsights] = useState<AiInsightsPayload | null>(null);

	const [ctxLoading, setCtxLoading] = useState<boolean>(false);
	const [ctxError, setCtxError] = useState<string | null>(null);
	const [ctxHolidays, setCtxHolidays] = useState<ContextHoliday[]>([]);
	const [ctxWeather, setCtxWeather] = useState<ContextWeather[]>([]);

	const [topWindow, setTopWindow] = useState<WindowKey>('7');
	const [topLoading, setTopLoading] = useState<boolean>(false);
	const [topError, setTopError] = useState<string | null>(null);
	const [topProducts, setTopProducts] = useState<TopProductItem[]>([]);

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

	// Auto-fetch context (7 days) for weather; fetch all holidays for current year
	useEffect(() => {
		const loadContext = async () => {
			if (!selectedBusiness) return;
			try {
				setCtxLoading(true);
				setCtxError(null);
				const token = localStorage.getItem("access_token");
				// Weather week via context
				const resp = await fetch(`${API_BASE}/forecast/context/${selectedBusiness}?window=7`, {
					headers: { Authorization: `Bearer ${token}` },
				});
				if (resp.ok) {
					const data = await resp.json();
					setCtxWeather((data.weather || []).slice(0, 7));
				}
				// All holidays this year
				const year = new Date().getFullYear();
				const hResp = await fetch(`${API_BASE}/forecast/holidays/${selectedBusiness}?year=${year}`, {
					headers: { Authorization: `Bearer ${token}` }
				});
				if (!hResp.ok) {
					const e = await hResp.json().catch(() => ({}));
					throw new Error(e.error || "Failed to load holidays");
				}
				const hData = await hResp.json();
				setCtxHolidays(hData.holidays || []);
			} catch (e: any) {
				setCtxError(e.message || "Failed to load context");
			} finally {
				setCtxLoading(false);
			}
		};
		loadContext();
	}, [selectedBusiness]);

	// Fetch trending products for selected window
	useEffect(() => {
		const loadTrending = async () => {
			if (!selectedBusiness) return;
			try {
				setTopLoading(true);
				setTopError(null);
				const token = localStorage.getItem("access_token");

				// Use historical endpoint for "Last Year" option
				if (topWindow === 'last_year') {
					const resp = await fetch(`${API_BASE}/forecast/historical/${selectedBusiness}`, {
						headers: { Authorization: `Bearer ${token}` },
					});
					if (!resp.ok) {
						const e = await resp.json().catch(() => ({}));
						throw new Error(e.error || "Failed to load historical data");
					}
					const data = await resp.json();
					// Convert historical trending format to match top products format
					const historicalProducts = (data.historicalTrending || []).map((item: any) => ({
						product_id: item.product_id,
						product_name: item.product_name,
						units_sold: item.units_sold_last_year || 0
					}));
					setTopProducts(historicalProducts);
				} else {
					const resp = await fetch(`${API_BASE}/analytics/top-products/${selectedBusiness}?window=${topWindow}`, {
						headers: { Authorization: `Bearer ${token}` },
					});
					if (!resp.ok) {
						const e = await resp.json().catch(() => ({}));
						throw new Error(e.error || "Failed to load trending products");
					}
					const data = await resp.json();
					setTopProducts(data.products || []);
				}
			} catch (e: any) {
				setTopError(e.message || "Failed to load trending products");
			} finally {
				setTopLoading(false);
			}
		};
		loadTrending();
	}, [selectedBusiness, topWindow]);

	const handleGenerateAi = async () => {
		if (!selectedBusiness) return;
		try {
			setAiLoading(true);
			setAiError(null);
			setAiInsights(null);
			const token = localStorage.getItem("access_token");
			// Reuse context fetched above; if empty, fetch on-demand
			let holidays = ctxHolidays;
			let weather = ctxWeather;
			if (!holidays.length || !weather.length) {
				const ctxResp = await fetch(`${API_BASE}/forecast/context/${selectedBusiness}?window=15`, {
					headers: { Authorization: `Bearer ${token}` }
				});
				const ctx = await ctxResp.json().catch(() => ({}));
				holidays = ctx.holidays || holidays;
				weather = ctx.weather || weather;
			}

			// Fetch historical trending data for AI context
			let historicalTrending = [];
			try {
				const histResp = await fetch(`${API_BASE}/forecast/historical/${selectedBusiness}`, {
					headers: { Authorization: `Bearer ${token}` }
				});
				if (histResp.ok) {
					const histData = await histResp.json();
					historicalTrending = histData.historicalTrending || [];
				}
			} catch (e) {
				console.warn('Failed to fetch historical data for AI:', e);
				// Continue without historical data
			}

			const resp = await fetch(`${API_BASE}/forecast/ai/${selectedBusiness}`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
				body: JSON.stringify({ window: '15', holidays, weather, historicalTrending })
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
						<p className="text-sm text-muted-foreground">AI-driven demand heads-up with holidays and weather</p>
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

				{/* Context panels */}
				<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
					<Card>
						<CardHeader>
							<CardTitle>All Holidays ({new Date().getFullYear()})</CardTitle>
							<CardDescription>Bangladesh holidays this year</CardDescription>
						</CardHeader>
						<CardContent>
							{ctxError && <div className="text-xs text-red-600 mb-3">{ctxError}</div>}
							<div className="space-y-2 max-h-[360px] overflow-auto pr-1">
								{(ctxHolidays || []).map((h, idx) => (
									<div key={`${h.date}-${idx}`} className="flex items-center justify-between border border-border rounded-md px-3 py-2 bg-card/50">
										<div className="font-medium">{h.name}</div>
										<div className="text-sm text-muted-foreground">{h.date}</div>
									</div>
								))}
								{!ctxLoading && (!ctxHolidays || ctxHolidays.length === 0) && (
									<div className="text-sm text-muted-foreground">No holidays found.</div>
								)}
							</div>
						</CardContent>
					</Card>

					<Card>
						<CardHeader>
							<CardTitle>This Week's Weather</CardTitle>
							<CardDescription>Daily summary for next 7 days</CardDescription>
						</CardHeader>
						<CardContent>
							{ctxError && <div className="text-xs text-red-600 mb-3">{ctxError}</div>}
							<div className="overflow-x-auto border border-border rounded-lg">
								<table className="w-full text-sm">
									<thead className="bg-muted/50">
										<tr>
											<th className="text-left p-3 font-medium">Date</th>
											<th className="text-left p-3 font-medium">Weather</th>
										</tr>
									</thead>
									<tbody>
										{(ctxWeather || []).slice(0, 7).map((w) => (
											<tr key={w.date} className="border-t border-border">
												<td className="p-3">{w.date}</td>
												<td className="p-3">{w.weather}</td>
											</tr>
										))}
										{!ctxLoading && (!ctxWeather || ctxWeather.length === 0) && (
											<tr><td className="p-3 text-muted-foreground" colSpan={2}>No weather data.</td></tr>
										)}
									</tbody>
								</table>
							</div>
						</CardContent>
					</Card>
				</div>

				{/* Trending products */}
				<Card>
					<CardHeader>
						<CardTitle>Trending Products</CardTitle>
						<CardDescription>Top sellers by units in 7 / 15 / 30 days, All time, or Last Year</CardDescription>
					</CardHeader>
					<CardContent>
						<div className="flex gap-2 mb-4 flex-wrap">
							{(['7', '15', '30', 'all', 'last_year'] as WindowKey[]).map(w => (
								<button
									key={w}
									onClick={() => setTopWindow(w)}
									className={`px-3 py-1.5 rounded-md border ${topWindow === w ? 'bg-primary text-primary-foreground border-primary' : 'bg-card border-border text-foreground'}`}
								>
									{w === 'all' ? 'All time' : w === 'last_year' ? 'Last Year' : `${w} days`}
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
										<th className="text-right p-3 font-medium">
											{topWindow === 'last_year' ? 'Units sold (Last Year)' : 'Units sold'}
										</th>
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
											<td className="p-3 text-muted-foreground" colSpan={3}>
												{topWindow === 'last_year' ? 'No sales data from last year for this period.' : 'No sales yet for this window.'}
											</td>
										</tr>
									)}
								</tbody>
							</table>
						</div>
					</CardContent>
				</Card>

				{/* AI Insights */}
				<Card>
					<CardHeader>
						<CardTitle>AI Insights</CardTitle>
						<CardDescription>Demand heads-up using holidays and weather</CardDescription>
					</CardHeader>
					<CardContent>
						<div className="flex items-center gap-3 mb-4">
							<button
								onClick={handleGenerateAi}
								disabled={aiLoading || !selectedBusiness}
								className={`px-4 py-2 rounded-md border ${aiLoading ? 'opacity-70 cursor-not-allowed' : ''} bg-primary text-primary-foreground border-primary`}
							>
								{aiLoading ? 'Generating…' : 'Generate AI'}
							</button>
							<span className="text-xs text-muted-foreground">Uses BD holidays and local weather</span>
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
														<span className={`px-2 py-0.5 rounded text-xs ${it.demand_level === 'high' ? 'bg-green-100 text-green-700' : it.demand_level === 'medium' ? 'bg-yellow-100 text-yellow-700' : 'bg-gray-100 text-gray-700'}`}>{it.demand_level}</span>
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

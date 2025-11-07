"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@/components/ui/dialog";
import {
	Sun,
	Cloud,
	CloudRain,
	CloudSnow,
	CloudDrizzle,
	CloudLightning,
	Cloudy,
	Calendar,
	MapPin,
	Thermometer,
	Wind,
	Droplets,
	Sparkles,
	TrendingUp,
	AlertTriangle,
	CheckCircle,
	Clock,
	Star,
	Gift
} from "lucide-react";

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

// Helper function to get weather icon based on weather description
const getWeatherIcon = (weather: string) => {
	const weatherLower = weather.toLowerCase();

	if (weatherLower.includes('sun') || weatherLower.includes('clear')) {
		return <Sun className="h-5 w-5 text-yellow-500" />;
	} else if (weatherLower.includes('rain') || weatherLower.includes('shower')) {
		return <CloudRain className="h-5 w-5 text-blue-500" />;
	} else if (weatherLower.includes('drizzle')) {
		return <CloudDrizzle className="h-5 w-5 text-blue-400" />;
	} else if (weatherLower.includes('snow')) {
		return <CloudSnow className="h-5 w-5 text-gray-300" />;
	} else if (weatherLower.includes('thunder') || weatherLower.includes('storm')) {
		return <CloudLightning className="h-5 w-5 text-purple-500" />;
	} else if (weatherLower.includes('cloud') || weatherLower.includes('overcast')) {
		return <Cloudy className="h-5 w-5 text-gray-500" />;
	} else {
		return <Cloud className="h-5 w-5 text-gray-400" />;
	}
};

// Helper function to get weather color class
const getWeatherColorClass = (weather: string) => {
	const weatherLower = weather.toLowerCase();

	if (weatherLower.includes('sun') || weatherLower.includes('clear')) {
		return 'bg-gradient-to-r from-yellow-50 to-orange-50 border-yellow-200';
	} else if (weatherLower.includes('rain') || weatherLower.includes('shower')) {
		return 'bg-gradient-to-r from-blue-50 to-cyan-50 border-blue-200';
	} else if (weatherLower.includes('drizzle')) {
		return 'bg-gradient-to-r from-blue-50 to-sky-50 border-blue-100';
	} else if (weatherLower.includes('snow')) {
		return 'bg-gradient-to-r from-gray-50 to-slate-50 border-gray-200';
	} else if (weatherLower.includes('thunder') || weatherLower.includes('storm')) {
		return 'bg-gradient-to-r from-purple-50 to-indigo-50 border-purple-200';
	} else if (weatherLower.includes('cloud') || weatherLower.includes('overcast')) {
		return 'bg-gradient-to-r from-gray-50 to-neutral-50 border-gray-200';
	} else {
		return 'bg-gradient-to-r from-slate-50 to-gray-50 border-gray-100';
	}
};

// Helper function to format date for holidays
const formatHolidayDate = (dateStr: string) => {
	try {
		const date = new Date(dateStr);
		return date.toLocaleDateString('en-US', {
			month: 'short',
			day: 'numeric',
			weekday: 'short'
		});
	} catch {
		return dateStr;
	}
};

// Helper function to check if holiday is upcoming (within next 30 days)
const isUpcomingHoliday = (dateStr: string) => {
	try {
		const holiday = new Date(dateStr);
		const today = new Date();
		const daysDiff = Math.ceil((holiday.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
		return daysDiff >= 0 && daysDiff <= 30;
	} catch {
		return false;
	}
};

export default function ForecastPage() {
	const { user, loading } = useAuth();
	const router = useRouter();

	const [businesses, setBusinesses] = useState<Business[]>([]);
	const [selectedBusiness, setSelectedBusiness] = useState<string>("");
	const [error, setError] = useState<string | null>(null);

	const [aiLoading, setAiLoading] = useState<boolean>(false);
	const [aiError, setAiError] = useState<string | null>(null);
	const [aiInsights, setAiInsights] = useState<AiInsightsPayload | null>(null);
	const [showModal, setShowModal] = useState<boolean>(false);

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
			setShowModal(true); // Show modal when results are ready
		} catch (e: any) {
			setAiError(e.message || 'Failed to generate AI insights');
		} finally {
			setAiLoading(false);
		}
	};

	return (
		<div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
			<header className="border-b border-border bg-white/80 backdrop-blur-sm sticky top-0 z-40 shadow-sm">
				<div className="container mx-auto px-4 py-6 flex items-center justify-between gap-4">
					<div className="flex items-center gap-3">
						<div className="p-2 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-lg">
							<TrendingUp className="h-6 w-6 text-white" />
						</div>
						<div>
							<h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
								Demand Forecasting
							</h1>
							<p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
								<Sparkles className="h-4 w-4" />
								AI-driven demand insights with holidays and weather context
							</p>
						</div>
					</div>
					<div className="flex items-center gap-3">
						<div className="flex items-center gap-2 text-sm text-muted-foreground">
							<MapPin className="h-4 w-4" />
							<span>Bangladesh</span>
						</div>

						{/* Generate AI Button in Header */}
						<Dialog open={showModal} onOpenChange={setShowModal}>
							<DialogTrigger asChild>
								<button
									onClick={handleGenerateAi}
									disabled={aiLoading || !selectedBusiness}
									className={`px-6 py-3 rounded-lg border transition-all font-medium flex items-center gap-2 ${aiLoading
										? 'opacity-70 cursor-not-allowed bg-gray-100 border-gray-300'
										: 'bg-gradient-to-r from-purple-500 to-indigo-600 text-white border-purple-500 hover:from-purple-600 hover:to-indigo-700 shadow-md'
										}`}
								>
									{aiLoading ? (
										<>
											<Clock className="h-4 w-4 animate-spin" />
											Generating...
										</>
									) : (
										<>
											<Sparkles className="h-4 w-4" />
											Generate AI Insights
										</>
									)}
								</button>
							</DialogTrigger>
							<DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
								<DialogHeader>
									<DialogTitle className="flex items-center gap-2 text-xl">
										<Sparkles className="h-5 w-5 text-purple-500" />
										AI Demand Insights
									</DialogTitle>
									<DialogDescription>
										Smart demand forecasting with contextual analysis including holidays and weather
									</DialogDescription>
								</DialogHeader>

								<div className="mt-4">
									{aiError && (
										<div className="text-sm text-red-600 border border-red-200 bg-red-50 rounded-lg p-3 mb-4 flex items-center gap-2">
											<AlertTriangle className="h-4 w-4" />
											{aiError}
										</div>
									)}

									{aiInsights && (
										<div className="space-y-4">
											<div className="space-y-3">
												{aiInsights.heads_up?.map((item) => (
													<div
														key={item.product_id}
														className="bg-gradient-to-r from-gray-50 to-slate-50 border border-gray-200 rounded-xl p-4 hover:shadow-md transition-all"
													>
														<div className="flex items-start justify-between mb-3">
															<div className="flex-1">
																<div className="font-semibold text-gray-900 mb-1">{item.product_name}</div>
																<div className="text-xs text-muted-foreground">{item.product_id}</div>
															</div>
															<div className="flex items-center gap-2">
																<Badge
																	variant={
																		item.demand_level === 'high' ? 'success' :
																			item.demand_level === 'medium' ? 'warning' :
																				'secondary'
																	}
																	className="text-xs font-medium"
																>
																	{item.demand_level.toUpperCase()} DEMAND
																</Badge>
																{item.anomaly && (
																	<Badge variant="destructive" className="text-xs">
																		<AlertTriangle className="h-3 w-3 mr-1" />
																		ANOMALY
																	</Badge>
																)}
															</div>
														</div>
														{item.rationale && (
															<div className="text-sm text-gray-700 bg-white/70 rounded-lg p-3 border border-gray-100">
																<div className="flex items-start gap-2">
																	<div className="p-1 bg-blue-100 rounded-full flex-shrink-0 mt-0.5">
																		<Sparkles className="h-3 w-3 text-blue-600" />
																	</div>
																	<p className="leading-relaxed">{item.rationale}</p>
																</div>
															</div>
														)}
													</div>
												))}
												{(!aiInsights.heads_up || aiInsights.heads_up.length === 0) && (
													<div className="text-center py-8 text-muted-foreground">
														<Sparkles className="h-12 w-12 mx-auto mb-3 text-gray-300" />
														<p>No AI insights available. Try generating new insights.</p>
													</div>
												)}
											</div>
											{aiInsights.notes?.length ? (
												<div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
													<div className="flex items-start gap-2 mb-2">
														<div className="p-1 bg-blue-100 rounded-full">
															<CheckCircle className="h-4 w-4 text-blue-600" />
														</div>
														<h4 className="font-medium text-blue-900">Additional Notes</h4>
													</div>
													<ul className="list-disc pl-6 space-y-1 text-sm text-blue-800">
														{aiInsights.notes.map((note, idx) => (
															<li key={idx}>{note}</li>
														))}
													</ul>
												</div>
											) : null}
										</div>
									)}

									{!aiInsights && !aiError && (
										<div className="text-center py-8 text-muted-foreground">
											<Sparkles className="h-12 w-12 mx-auto mb-3 text-gray-300" />
											<p>Click "Generate AI Insights" to start the analysis</p>
										</div>
									)}
								</div>
							</DialogContent>
						</Dialog>

						<select
							value={selectedBusiness}
							onChange={(e) => setSelectedBusiness(e.target.value)}
							className="px-4 py-2 rounded-lg border border-border bg-white text-foreground min-w-[220px] shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
				<div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
					<Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
						<CardHeader className="pb-4">
							<CardTitle className="flex items-center gap-2 text-xl">
								<Gift className="h-5 w-5 text-red-500" />
								Holidays ({new Date().getFullYear()})
								<Badge variant="secondary" className="ml-2">
									{ctxHolidays.filter(h => isUpcomingHoliday(h.date)).length} upcoming
								</Badge>
							</CardTitle>
							<CardDescription>Bangladesh national holidays this year</CardDescription>
						</CardHeader>
						<CardContent>
							{ctxError && (
								<div className="text-xs text-red-600 border border-red-200 bg-red-50 rounded-lg p-3 mb-3 flex items-center gap-2">
									<AlertTriangle className="h-4 w-4" />
									{ctxError}
								</div>
							)}
							<div className="space-y-3 max-h-[400px] overflow-auto pr-2">
								{(ctxHolidays || []).map((h, idx) => {
									const isUpcoming = isUpcomingHoliday(h.date);
									return (
										<div
											key={`${h.date}-${idx}`}
											className={`flex items-center justify-between rounded-xl px-4 py-3 transition-all hover:shadow-md ${isUpcoming
												? 'bg-gradient-to-r from-red-50 to-pink-50 border border-red-200 shadow-sm'
												: 'bg-gradient-to-r from-gray-50 to-slate-50 border border-gray-200'
												}`}
										>
											<div className="flex items-center gap-3">
												<div className={`p-2 rounded-full ${isUpcoming ? 'bg-red-100' : 'bg-gray-100'}`}>
													<Calendar className={`h-4 w-4 ${isUpcoming ? 'text-red-600' : 'text-gray-600'}`} />
												</div>
												<div>
													<div className="font-semibold text-gray-900">{h.name}</div>
													<div className="text-sm text-muted-foreground">{formatHolidayDate(h.date)}</div>
												</div>
											</div>
											{isUpcoming && (
												<Badge variant="destructive" className="text-xs">
													Upcoming
												</Badge>
											)}
										</div>
									);
								})}
								{!ctxLoading && (!ctxHolidays || ctxHolidays.length === 0) && (
									<div className="text-center py-8 text-muted-foreground">
										<Calendar className="h-12 w-12 mx-auto mb-3 text-gray-300" />
										<p>No holidays found for this year.</p>
									</div>
								)}
							</div>
						</CardContent>
					</Card>

					<Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
						<CardHeader className="pb-4">
							<CardTitle className="flex items-center gap-2 text-xl">
								<Thermometer className="h-5 w-5 text-blue-500" />
								This Week's Weather
							</CardTitle>
							<CardDescription>Daily forecast for the next 7 days</CardDescription>
						</CardHeader>
						<CardContent>
							{ctxError && (
								<div className="text-xs text-red-600 border border-red-200 bg-red-50 rounded-lg p-3 mb-3 flex items-center gap-2">
									<AlertTriangle className="h-4 w-4" />
									{ctxError}
								</div>
							)}
							<div className="space-y-3 max-h-[400px] overflow-auto">
								{(ctxWeather || []).slice(0, 7).map((w, idx) => (
									<div
										key={w.date}
										className={`flex items-center justify-between rounded-xl px-4 py-3 transition-all hover:shadow-md ${getWeatherColorClass(w.weather)}`}
									>
										<div className="flex items-center gap-3">
											<div className="p-2 bg-white/70 rounded-full">
												{getWeatherIcon(w.weather)}
											</div>
											<div>
												<div className="font-semibold text-gray-900">
													{new Date(w.date).toLocaleDateString('en-US', {
														weekday: 'short',
														month: 'short',
														day: 'numeric'
													})}
												</div>
												<div className="text-sm text-gray-600 capitalize">{w.weather}</div>
											</div>
										</div>
										{idx === 0 && (
											<Badge variant="secondary" className="text-xs">
												Today
											</Badge>
										)}
									</div>
								))}
								{!ctxLoading && (!ctxWeather || ctxWeather.length === 0) && (
									<div className="text-center py-8 text-muted-foreground">
										<Cloud className="h-12 w-12 mx-auto mb-3 text-gray-300" />
										<p>No weather data available.</p>
									</div>
								)}
							</div>
						</CardContent>
					</Card>
				</div>

				{/* Trending products */}
				<Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
					<CardHeader className="pb-4">
						<CardTitle className="flex items-center gap-2 text-xl">
							<Star className="h-5 w-5 text-yellow-500" />
							Trending Products
						</CardTitle>
						<CardDescription>Top performing products by sales volume</CardDescription>
					</CardHeader>
					<CardContent>
						<div className="flex gap-2 mb-6 flex-wrap">
							{(['7', '15', '30', 'all', 'last_year'] as WindowKey[]).map(w => (
								<button
									key={w}
									onClick={() => setTopWindow(w)}
									className={`px-4 py-2 rounded-lg border transition-all font-medium ${topWindow === w
										? 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white border-blue-500 shadow-md'
										: 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50 hover:border-gray-300'
										}`}
								>
									{w === 'all' ? 'All time' : w === 'last_year' ? 'Last Year' : `${w} days`}
								</button>
							))}
						</div>

						{topError && (
							<div className="text-sm text-red-600 border border-red-200 bg-red-50 rounded-lg p-3 mb-4 flex items-center gap-2">
								<AlertTriangle className="h-4 w-4" />
								{topError}
							</div>
						)}

						<div className="space-y-3">
							{(topProducts || []).map((p, idx) => (
								<div
									key={p.product_id}
									className="flex items-center justify-between bg-gradient-to-r from-gray-50 to-slate-50 border border-gray-200 rounded-xl px-4 py-3 hover:shadow-md transition-all"
								>
									<div className="flex items-center gap-3">
										<div className={`flex items-center justify-center w-8 h-8 rounded-full font-bold text-sm ${idx === 0 ? 'bg-yellow-100 text-yellow-700' :
											idx === 1 ? 'bg-gray-100 text-gray-700' :
												idx === 2 ? 'bg-orange-100 text-orange-700' :
													'bg-blue-100 text-blue-700'
											}`}>
											{idx + 1}
										</div>
										<div>
											<div className="font-semibold text-gray-900">{p.product_name}</div>
											<div className="text-xs text-muted-foreground">{p.product_id}</div>
										</div>
									</div>
									<div className="text-right">
										<div className="font-bold text-lg text-gray-900">
											{p.units_sold.toLocaleString()}
										</div>
										<div className="text-xs text-muted-foreground">
											{topWindow === 'last_year' ? 'units (last year)' : 'units sold'}
										</div>
									</div>
								</div>
							))}
							{!topLoading && (!topProducts || topProducts.length === 0) && (
								<div className="text-center py-8 text-muted-foreground">
									<TrendingUp className="h-12 w-12 mx-auto mb-3 text-gray-300" />
									<p>
										{topWindow === 'last_year'
											? 'No sales data from last year for this period.'
											: 'No sales data available for this time window.'
										}
									</p>
								</div>
							)}
						</div>
					</CardContent>
				</Card>
			</main>
		</div>
	);
}

'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { Navigation } from '@/components/Navigation';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Store, Database, FileSpreadsheet, Loader2, Eye } from "lucide-react";

interface Business {
    id: string;
    name: string;
    description: string | null;
    created_at: string;
    updated_at: string;
}

interface PostgresTable {
    table_name: string;
    record_count: number;
    columns: string[];
    sample_data: any[];
}

export default function UnifiedBusinessDataPage() {
    const { user, loading } = useAuth();
    const router = useRouter();
    const params = useParams();
    const businessId = params.id as string;

    const [business, setBusiness] = useState<Business | null>(null);
    const [loadingBusiness, setLoadingBusiness] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Business selection state
    const [businesses, setBusinesses] = useState<Business[]>([]);
    const [loadingBusinesses, setLoadingBusinesses] = useState(false);

    // PostgreSQL data states
    const [postgresData, setPostgresData] = useState<PostgresTable[]>([]);
    const [loadingPostgres, setLoadingPostgres] = useState(false);
    const [selectedTable, setSelectedTable] = useState<PostgresTable | null>(null);

    useEffect(() => {
        if (!loading && !user) {
            router.push('/auth/login');
        }
    }, [user, loading, router]);

    useEffect(() => {
        if (user && businessId) {
            fetchBusiness();
            fetchPostgresData();
        }
    }, [user, businessId]);

    useEffect(() => {
        if (user) {
            fetchBusinesses();
        }
    }, [user]);

    const fetchBusiness = async () => {
        try {
            setLoadingBusiness(true);
            const token = localStorage.getItem('access_token');
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'}/businesses/${businessId}`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
            });

            if (response.ok) {
                const data = await response.json();
                setBusiness(data.business);
            } else {
                setError('Failed to fetch business');
            }
        } catch (error) {
            console.error('Error fetching business:', error);
            setError('Network error while fetching business');
        } finally {
            setLoadingBusiness(false);
        }
    };

    const fetchBusinesses = async () => {
        try {
            setLoadingBusinesses(true);
            const token = localStorage.getItem('access_token');
            
            // First fetch all businesses
            const businessesResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'}/businesses`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
            });

            if (!businessesResponse.ok) {
                console.error('Failed to fetch businesses');
                return;
            }

            const businessesData = await businessesResponse.json();
            const allBusinesses = businessesData.businesses || [];

            // Filter businesses that have PostgreSQL data
            const businessesWithData = [];
            
            for (const business of allBusinesses) {
                // Always include the current business
                if (business.id === businessId) {
                    businessesWithData.push(business);
                    continue;
                }
                
                try {
                    const dataResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'}/data/businesses/${business.id}/postgres-data`, {
                        headers: {
                            'Authorization': `Bearer ${token}`,
                        },
                    });
                    
                    if (dataResponse.ok) {
                        const data = await dataResponse.json();
                        // Check if business has any tables with data
                        if (data.tables && data.tables.length > 0 && data.tables.some((table: any) => table.record_count > 0)) {
                            businessesWithData.push(business);
                        }
                    }
                } catch (error) {
                    console.error(`Error checking data for business ${business.id}:`, error);
                    // Skip this business if we can't check its data
                }
            }

            setBusinesses(businessesWithData);
        } catch (error) {
            console.error('Error fetching businesses:', error);
        } finally {
            setLoadingBusinesses(false);
        }
    };

    const fetchPostgresData = async () => {
        try {
            setLoadingPostgres(true);
            const token = localStorage.getItem('access_token');
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'}/data/businesses/${businessId}/postgres-data`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
            });

            if (response.ok) {
                const data = await response.json();
                setPostgresData(data.tables || []);
            } else {
                console.error('Failed to fetch PostgreSQL data');
            }
        } catch (error) {
            console.error('Error fetching PostgreSQL data:', error);
        } finally {
            setLoadingPostgres(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-indigo-600 mb-4"></div>
                    <p className="text-slate-600 font-medium">Loading...</p>
                </div>
            </div>
        );
    }

    if (!user) {
        return null; // Will redirect to login
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
            {/* Navigation */}
            <Navigation
                selectedBusiness={businessId}
                businesses={businesses}
                onBusinessChange={(id) => {
                    if (id && id !== businessId) {
                        router.push(`/businesses/${id}/unified-data`);
                    }
                }}
                showBusinessSelector={true}
            />

            <main className="container mx-auto px-4 py-8 space-y-6">
                {error && (
                    <Card className="border-2 border-red-200/50 bg-gradient-to-br from-red-50 to-white shadow-lg rounded-xl overflow-hidden">
                        <CardContent className="pt-6">
                            <p className="text-red-700 font-semibold">{error}</p>
                        </CardContent>
                    </Card>
                )}

                {loadingBusiness ? (
                    <div className="flex items-center justify-center py-20">
                        <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
                        <span className="ml-2 text-slate-600">Loading business details...</span>
                    </div>
                ) : business ? (
                    <div>
                        {/* Business Info Card */}
                        <Card className="border-2 border-slate-200/50 bg-gradient-to-br from-white to-slate-50 shadow-xl rounded-xl overflow-hidden">
                            <CardHeader className="pb-4">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 rounded-lg bg-gradient-to-br from-emerald-600 to-green-600 shadow-lg">
                                            <Store className="h-5 w-5 text-white" />
                                        </div>
                                        <div>
                                            <CardTitle className="text-xl font-bold text-slate-800">{business.name} - Unified Data</CardTitle>
                                            <CardDescription className="text-slate-600">
                                                PostgreSQL database tables (read-only)
                                            </CardDescription>
                                        </div>
                                    </div>
                                    <div className="flex gap-3">
                                        <Button
                                            onClick={() => router.push(`/businesses/${businessId}/raw-data`)}
                                            className="bg-slate-600 hover:bg-slate-700 text-white shadow-md font-medium"
                                        >
                                            <Database className="h-4 w-4 mr-2" />
                                            View Raw Data
                                        </Button>
                                    </div>
                                </div>
                            </CardHeader>
                        </Card>

                        {/* PostgreSQL Data Section */}
                        <Card className="border-2 border-slate-200/50 bg-gradient-to-br from-white to-slate-50 shadow-xl rounded-xl overflow-hidden">
                            <CardHeader className="pb-4">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 rounded-lg bg-gradient-to-br from-emerald-600 to-teal-600 shadow-lg">
                                        <FileSpreadsheet className="h-5 w-5 text-white" />
                                    </div>
                                    <div>
                                        <CardTitle className="text-xl font-bold text-slate-800 flex items-center gap-2">
                                            PostgreSQL Database Tables
                                        </CardTitle>
                                        <CardDescription className="text-slate-600">
                                            View your unified business data from PostgreSQL
                                        </CardDescription>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent>
                                {loadingPostgres ? (
                                    <div className="flex items-center justify-center py-20">
                                        <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
                                        <span className="ml-2 text-slate-600">Loading PostgreSQL data...</span>
                                    </div>
                                ) : postgresData.length > 0 ? (
                                    <div className="space-y-4">
                                        {postgresData.map((table, index) => (
                                            <div key={index} className="border border-slate-200/70 rounded-xl p-6 hover:border-slate-300/80 transition-all duration-200 shadow-sm hover:shadow-md bg-white">
                                                <div className="flex items-center justify-between">
                                                    <div className="flex-1">
                                                        <button
                                                            onClick={() => setSelectedTable(selectedTable?.table_name === table.table_name ? null : table)}
                                                            className="text-left w-full group"
                                                        >
                                                            <div className="flex items-center gap-4">
                                                                <div className="p-2.5 rounded-lg bg-gradient-to-br from-slate-600 to-slate-700 shadow-sm group-hover:shadow-md transition-all duration-200">
                                                                    <FileSpreadsheet className="h-5 w-5 text-white" />
                                                                </div>
                                                                <div className="flex-1">
                                                                    <h4 className="text-base font-semibold text-slate-800 group-hover:text-slate-900 transition-colors duration-200 mb-1">
                                                                        {table.table_name}
                                                                    </h4>
                                                                    <div className="flex items-center gap-4 text-xs text-slate-600">
                                                                        <div className="flex items-center gap-1.5">
                                                                            <div className="w-1.5 h-1.5 rounded-full bg-blue-500"></div>
                                                                            <span className="font-semibold">{table.record_count.toLocaleString()}</span>
                                                                            <span>records</span>
                                                                        </div>
                                                                        <div className="flex items-center gap-1.5">
                                                                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div>
                                                                            <span className="font-semibold">{table.columns.length}</span>
                                                                            <span>columns</span>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                                <div className="ml-4">
                                                                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-200 ${selectedTable?.table_name === table.table_name ? 'bg-slate-100 rotate-180' : 'bg-slate-50 group-hover:bg-slate-100'}`}>
                                                                        <svg className={`w-4 h-4 transition-colors duration-200 ${selectedTable?.table_name === table.table_name ? 'text-slate-700' : 'text-slate-400 group-hover:text-slate-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                                                        </svg>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </button>

                                                            {/* Table Data View - Read-only */}
                                                            {selectedTable?.table_name === table.table_name && table.sample_data.length > 0 && (
                                                                <div className="mt-6 overflow-x-auto">
                                                                    <div className="inline-block min-w-full align-middle">
                                                                        <div className="overflow-hidden border-2 border-slate-200/50 rounded-xl shadow-lg bg-white">
                                                                            <table className="min-w-full" style={{ borderCollapse: 'separate', borderSpacing: 0 }}>
                                                                                <thead>
                                                                                    <tr className="bg-gradient-to-r from-slate-50 to-blue-50/30">
                                                                                        <th className="px-4 py-3 text-center text-xs font-bold text-slate-700 border-b-2 border-r border-slate-200/50 sticky left-0 z-10 bg-slate-50" style={{ minWidth: '60px', maxWidth: '60px' }}>
                                                                                            #
                                                                                        </th>
                                                                                        {table.columns.map((column, idx) => (
                                                                                            <th key={idx} className="px-4 py-3 text-left text-xs font-bold text-slate-700 border-b-2 border-r border-slate-200/50 last:border-r-0 bg-gradient-to-r from-slate-50 to-blue-50/30" style={{ minWidth: '150px' }}>
                                                                                                <div className="flex items-center gap-2">
                                                                                                    <div className="w-1.5 h-1.5 rounded-full bg-blue-400"></div>
                                                                                                    <span className="uppercase tracking-wide">{column}</span>
                                                                                                </div>
                                                                                            </th>
                                                                                        ))}
                                                                                    </tr>
                                                                                </thead>
                                                                                <tbody>
                                                                                    {table.sample_data.map((row, rowIdx) => (
                                                                                        <tr key={rowIdx} className={`group transition-all duration-150 ${rowIdx % 2 === 0 ? 'bg-white hover:bg-blue-50/30' : 'bg-slate-50/30 hover:bg-blue-50/40'}`}>
                                                                                            <td className="px-4 py-2.5 text-center text-xs font-semibold text-slate-600 border-b border-r border-slate-200/50 sticky left-0 z-10 bg-inherit">
                                                                                                <span className="inline-flex items-center justify-center w-6 h-6 rounded-md bg-blue-50 text-blue-700 font-bold text-xs">
                                                                                                    {rowIdx + 1}
                                                                                                </span>
                                                                                            </td>
                                                                                            {table.columns.map((column, cellIdx) => {
                                                                                                const value = row[column];
                                                                                                return (
                                                                                                    <td 
                                                                                                        key={cellIdx} 
                                                                                                        className="border-b border-r border-slate-200/50 last:border-r-0 p-0"
                                                                                                    >
                                                                                                        <div className="px-4 py-2.5 text-sm text-slate-800 min-h-[42px] flex items-center font-medium">
                                                                                    {value === '' || value === null || value === undefined ? (
                                                                                        <span className="text-slate-400 italic text-xs">—</span>
                                                                                    ) : (
                                                                                        <span>
                                                                                            {String(value)}
                                                                                        </span>
                                                                                    )}
                                                                                </div>
                                                                            </td>
                                                                        );
                                                                    })}
                                                                                        </tr>
                                                                                    ))}
                                                                                </tbody>
                                                                            </table>
                                                                        </div>
                                                                    </div>
                                                                    <div className="mt-4 flex items-center justify-between px-2">
                                                                        <div className="flex items-center gap-3">
                                                                            <div className="flex items-center gap-2 text-xs bg-gradient-to-r from-blue-50 to-indigo-50 text-slate-700 px-3 py-2 rounded-lg border border-blue-200/50 shadow-sm">
                                                                                <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                                                                                <span className="font-bold">{table.record_count.toLocaleString()}</span>
                                                                                <span className="font-medium">total rows</span>
                                                                            </div>
                                                                            <div className="flex items-center gap-2 text-xs bg-gradient-to-r from-emerald-50 to-teal-50 text-slate-700 px-3 py-2 rounded-lg border border-emerald-200/50 shadow-sm">
                                                                                <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                                                                                <span className="font-bold">{table.sample_data.length}</span>
                                                                                <span className="font-medium">showing</span>
                                                                            </div>
                                                                        </div>
                                                                        <div className="flex items-center gap-2 text-xs bg-gradient-to-r from-amber-50 to-orange-50 text-amber-700 px-3 py-2 rounded-lg border border-amber-200/50 shadow-sm">
                                                                            <Eye className="h-3.5 w-3.5" />
                                                                            <span className="font-semibold">Read-only view</span>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                        <div className="text-center py-20">
                                            <div className="max-w-md mx-auto">
                                                <div className="p-4 rounded-full bg-gradient-to-br from-slate-400 to-slate-500 shadow-lg w-fit mx-auto mb-4">
                                                    <FileSpreadsheet className="h-12 w-12 text-white" />
                                                </div>
                                                <h4 className="text-lg font-semibold text-slate-800 mb-2">No PostgreSQL data found</h4>
                                                <p className="text-sm text-slate-600 mb-6">No tables were found in the PostgreSQL database for this business</p>
                                                <Button
                                                    onClick={() => router.push(`/businesses/${businessId}/raw-data`)}
                                                    className="bg-slate-600 hover:bg-slate-700 text-white shadow-md font-medium"
                                                >
                                                    <Database className="h-4 w-4 mr-2" />
                                                    View Raw Data
                                                </Button>
                                            </div>
                                        </div>
                                    )}
                            </CardContent>
                        </Card>
                    </div>
                ) : (
                    <Card className="border-2 border-slate-200/50 bg-gradient-to-br from-white to-slate-50 shadow-xl rounded-xl overflow-hidden">
                        <CardContent className="pt-8 pb-8">
                            <div className="text-center">
                                <div className="p-4 rounded-full bg-gradient-to-br from-slate-400 to-slate-500 shadow-lg w-fit mx-auto mb-6">
                                    <Store className="h-12 w-12 text-white" />
                                </div>
                                <h3 className="text-xl font-semibold text-slate-800 mb-2">Business not found</h3>
                                <p className="text-slate-600 mb-6 max-w-md mx-auto">The business you're looking for doesn't exist or you don't have access to it.</p>
                                <Button
                                    onClick={() => router.push('/businesses')}
                                    className="bg-slate-600 hover:bg-slate-700 text-white shadow-md font-medium"
                                >
                                    Back to Businesses
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                )}
            </main>
        </div>
    );
}
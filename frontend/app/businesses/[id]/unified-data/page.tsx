'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ArrowLeft, Store, Database, FileSpreadsheet, Loader2, Eye } from "lucide-react";

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
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-indigo-600"></div>
                    <p className="mt-4 text-gray-600">Loading...</p>
                </div>
            </div>
        );
    }

    if (!user) {
        return null; // Will redirect to login
    }

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
                <div className="container mx-auto px-4 py-4">
                    <div className="flex items-center justify-between gap-4">
                        <div className="flex items-center gap-4">
                            <Button variant="ghost" size="icon" onClick={() => router.push(`/businesses/${businessId}`)}>
                                <ArrowLeft className="h-5 w-5" />
                            </Button>
                            <div>
                                <h1 className="text-2xl font-bold text-foreground">Unified Data</h1>
                                <p className="text-sm text-muted-foreground">PostgreSQL database tables (read-only)</p>
                            </div>
                        </div>

                        {/* Business Selector */}
                        <div className="flex items-center gap-2">
                            <Store className="h-5 w-5 text-muted-foreground" />
                            <select
                                value={businessId}
                                onChange={(e) => {
                                    if (e.target.value && e.target.value !== businessId) {
                                        router.push(`/businesses/${e.target.value}/unified-data`);
                                    }
                                }}
                                className="px-4 py-2 rounded-lg border-2 border-slate-200 bg-white text-slate-900 font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 min-w-[200px] shadow-sm"
                                disabled={loadingBusinesses}
                            >
                                {loadingBusinesses ? (
                                    <option>Loading...</option>
                                ) : (
                                    businesses.map((biz) => (
                                        <option key={biz.id} value={biz.id}>
                                            {biz.name}
                                        </option>
                                    ))
                                )}
                            </select>
                        </div>
                    </div>
                </div>
            </header>

            <main className="container mx-auto px-4 py-8 space-y-6">
                {error && (
                    <Card className="border-2 border-red-200/50 bg-gradient-to-br from-red-50 to-white shadow-lg rounded-xl overflow-hidden">
                        <CardContent className="pt-6">
                            <p className="text-red-700 font-semibold">{error}</p>
                        </CardContent>
                    </Card>
                )}

                {loadingBusiness ? (
                    <div className="flex items-center justify-center py-8">
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    </div>
                ) : business ? (
                    <>
                        {/* Business Info Card */}
                        <Card className="border-2 border-slate-200/50 bg-gradient-to-br from-white to-slate-50 shadow-xl rounded-xl overflow-hidden">
                            <CardHeader>
                                <div className="flex items-center justify-between">
                                    <div>
                                        <CardTitle className="text-xl font-bold text-slate-800">{business.name} - Unified Data</CardTitle>
                                        <CardDescription className="text-slate-600">
                                            PostgreSQL database tables (read-only)
                                        </CardDescription>
                                    </div>
                                    <div className="flex gap-3">
                                        <Button
                                            onClick={() => router.push(`/businesses/${businessId}/raw-data`)}
                                            className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white shadow-md"
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
                            <CardHeader>
                                <CardTitle className="text-xl font-bold text-slate-800 flex items-center gap-2">
                                    <FileSpreadsheet className="h-5 w-5 text-emerald-600" />
                                    PostgreSQL Database Tables
                                </CardTitle>
                                <CardDescription className="text-slate-600">
                                    View your unified business data from PostgreSQL
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                {loadingPostgres ? (
                                    <div className="flex items-center justify-center py-8">
                                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                                        <span className="ml-2 text-slate-600">Loading PostgreSQL data...</span>
                                    </div>
                                ) : postgresData.length > 0 ? (
                                    <div className="space-y-4">
                                        {postgresData.map((table, index) => (
                                            <div key={index} className="border border-slate-200 rounded-lg p-4 hover:bg-slate-50/50 transition-colors">
                                                <div className="flex items-center justify-between">
                                                    <div className="flex-1">
                                                            <button
                                                                onClick={() => setSelectedTable(selectedTable?.table_name === table.table_name ? null : table)}
                                                                className="text-left w-full"
                                                            >
                                                                <h4 className="text-sm font-medium text-indigo-600 hover:text-indigo-900">
                                                                    {table.table_name}
                                                                </h4>
                                                                <p className="text-xs text-gray-500 mt-1">
                                                                    {table.record_count} records • {table.columns.length} columns
                                                                </p>
                                                            </button>

                                                            {/* Table Data View - Read-only */}
                                                            {selectedTable?.table_name === table.table_name && table.sample_data.length > 0 && (
                                                                <div className="mt-4 overflow-x-auto">
                                                                    <div className="inline-block min-w-full align-middle">
                                                                        <div className="overflow-hidden border border-gray-300 rounded-lg">
                                                                            <table className="min-w-full divide-y divide-gray-300" style={{ borderCollapse: 'collapse' }}>
                                                                                <thead className="bg-gray-100">
                                                                                    <tr>
                                                                                        <th className="px-2 py-2 text-center text-xs font-bold text-gray-700 border-r border-gray-300 bg-gray-200 sticky left-0 z-10" style={{ minWidth: '50px', maxWidth: '50px' }}>
                                                                                            #
                                                                                        </th>
                                                                                        {table.columns.map((column, idx) => (
                                                                                            <th key={idx} className="px-3 py-2 text-left text-xs font-semibold text-gray-700 border-r border-gray-300 bg-gray-50" style={{ minWidth: '120px' }}>
                                                                                                {column}
                                                                                            </th>
                                                                                        ))}
                                                                                    </tr>
                                                                                </thead>
                                                                                <tbody className="bg-white divide-y divide-gray-200">
                                                                                    {table.sample_data.map((row, rowIdx) => (
                                                                                        <tr key={rowIdx} className="hover:bg-blue-50 transition-colors">
                                                                                            <td className="px-2 py-1 text-center text-xs font-medium text-gray-500 border-r border-gray-300 bg-gray-50 sticky left-0 z-10">
                                                                                                {rowIdx + 1}
                                                                                            </td>
                                                                                            {table.columns.map((column, cellIdx) => {
                                                                                                const value = row[column];
                                                                                                return (
                                                                                                    <td key={cellIdx} className="border-r border-gray-300 p-0">
                                                                                                        <div className="px-3 py-2 text-xs text-gray-900 min-h-[32px] flex items-center bg-gray-50">
                                                                                    {value === '' || value === null || value === undefined ? (
                                                                                        <span className="text-gray-300">—</span>
                                                                                    ) : (
                                                                                        String(value)
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
                                                                    <div className="mt-3 flex items-center justify-between px-2">
                                                                        <p className="text-xs text-gray-600">
                                                                            <span className="font-semibold">{table.record_count}</span> rows total
                                                                            <span> • Showing {table.sample_data.length} rows</span>
                                                                        </p>
                                                                        <p className="text-xs text-blue-600 italic">
                                                                            📖 Read-only view • Empty cells shown as <span className="text-gray-300">—</span>
                                                                        </p>
                                                                    </div>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="text-center py-8">
                                            <div className="text-gray-400 text-4xl mb-2">🗄️</div>
                                            <h4 className="text-sm font-medium text-gray-900 mb-1">No PostgreSQL data found</h4>
                                            <p className="text-xs text-gray-600">No tables were found in the PostgreSQL database for this business</p>
                                        </div>
                                    )}
                            </CardContent>
                        </Card>
                    </>
                ) : (
                    <Card className="border-2 border-slate-200/50 bg-gradient-to-br from-white to-slate-50 shadow-xl rounded-xl overflow-hidden">
                        <CardContent className="pt-6">
                                <div className="text-center">
                                    <div className="text-gray-400 text-6xl mb-4">🏢</div>
                                    <h3 className="text-lg font-medium text-slate-900 mb-2">Business not found</h3>
                                    <p className="text-slate-600 mb-6">The business you're looking for doesn't exist or you don't have access to it.</p>
                                    <Button
                                        onClick={() => router.push('/businesses')}
                                        className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white shadow-md"
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
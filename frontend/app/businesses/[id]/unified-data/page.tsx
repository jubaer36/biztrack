'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';

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
            <nav className="bg-white shadow">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between h-16">
                        <div className="flex items-center">
                            <button
                                onClick={() => router.push(`/businesses/${businessId}`)}
                                className="text-indigo-600 hover:text-indigo-900 mr-4"
                            >
                                ← Back to Business
                            </button>
                            <h1 className="text-xl font-semibold text-gray-900">Unified Business Data</h1>
                        </div>
                        <div className="flex items-center space-x-4">
                            <span className="text-gray-700">Welcome, {user.name || user.email}</span>
                        </div>
                    </div>
                </div>
            </nav>

            <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
                <div className="px-4 py-6 sm:px-0">
                    {error && (
                        <div className="mb-4 bg-red-50 border-l-4 border-red-400 p-4">
                            <div className="flex">
                                <div className="ml-3">
                                    <p className="text-sm text-red-700">{error}</p>
                                </div>
                            </div>
                        </div>
                    )}

                    {loadingBusiness ? (
                        <div className="text-center py-12">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
                            <p className="mt-4 text-gray-600">Loading business...</p>
                        </div>
                    ) : business ? (
                        <>
                            <div className="bg-white shadow overflow-hidden sm:rounded-lg mb-6">
                                <div className="px-4 py-5 sm:px-6 flex justify-between items-center">
                                    <div>
                                        <h2 className="text-lg font-medium text-gray-900">{business.name} - Unified Data</h2>
                                        <p className="mt-1 text-sm text-gray-600">
                                            PostgreSQL database tables (read-only)
                                        </p>
                                    </div>
                                    <div className="flex space-x-3">
                                        <button
                                            onClick={() => router.push(`/businesses/${businessId}/raw-data`)}
                                            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                                        >
                                            View Raw Data
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {/* PostgreSQL Data Section */}
                            <div className="bg-white shadow overflow-hidden sm:rounded-lg">
                                <div className="px-4 py-5 sm:px-6">
                                    <h3 className="text-lg font-medium text-gray-900">PostgreSQL Database Tables</h3>
                                    <p className="mt-1 text-sm text-gray-600">
                                        View your unified business data from PostgreSQL
                                    </p>
                                </div>
                                <div className="border-t border-gray-200">
                                    {loadingPostgres ? (
                                        <div className="text-center py-8">
                                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto"></div>
                                            <p className="mt-2 text-sm text-gray-600">Loading PostgreSQL data...</p>
                                        </div>
                                    ) : postgresData.length > 0 ? (
                                        <div className="divide-y divide-gray-200">
                                            {postgresData.map((table, index) => (
                                                <div key={index} className="px-4 py-4 hover:bg-gray-50">
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
                                                                                    {table.sample_data.slice(0, 100).map((row, rowIdx) => (
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
                                                                            {table.sample_data.length > 100 && <span> • Showing first 100</span>}
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
                                </div>
                            </div>
                        </>
                    ) : (
                        <div className="text-center py-12">
                            <div className="text-gray-400 text-6xl mb-4">🏢</div>
                            <h3 className="text-lg font-medium text-gray-900 mb-2">Business not found</h3>
                            <p className="text-gray-600 mb-6">The business you're looking for doesn't exist or you don't have access to it.</p>
                            <button
                                onClick={() => router.push('/businesses')}
                                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
                            >
                                Back to Businesses
                            </button>
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}
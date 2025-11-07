'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth-context';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

interface MappingStatus {
    businessId: string;
    businessName: string;
    supabaseStatus: Record<string, { recordCount: number; hasData: boolean; error?: string }>;
    mongoStatus: Record<string, { recordCount: number; sheetName: string }>;
    hasMappedData: boolean;
    totalMongoCollections: number;
    totalSupabaseTables: number;
}



interface DataMapperProps {
    businessId: string;
    onMappingComplete?: () => void;
}

export default function DataMapper({ businessId, onMappingComplete }: DataMapperProps) {
    const { user } = useAuth();
    const [mappingStatus, setMappingStatus] = useState<MappingStatus | null>(null);
    const [loading, setLoading] = useState(false);
    const [mapping, setMapping] = useState(false);
    const [clearing, setClearing] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (businessId) {
            fetchMappingStatus();
        }
    }, [businessId]);

    const fetchMappingStatus = async () => {
        try {
            setLoading(true);
            setError(null);

            const token = localStorage.getItem('access_token');
            const response = await fetch(`${API_BASE_URL}/mapping/mapping-status/${businessId}`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
            });

            if (response.ok) {
                const data = await response.json();
                setMappingStatus(data);
            } else {
                const errorData = await response.json();
                setError(errorData.error || 'Failed to fetch mapping status');
            }
        } catch (err) {
            console.error('Error fetching mapping status:', err);
            setError('Network error while fetching mapping status');
        } finally {
            setLoading(false);
        }
    };



    const startMapping = async () => {
        try {
            setMapping(true);
            setError(null);

            const token = localStorage.getItem('access_token');
            const response = await fetch(`${API_BASE_URL}/mapping/map/${businessId}`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
            });

            if (response.ok) {
                const data = await response.json();
                console.log('Mapping completed:', data);
                
                // Refresh status
                await fetchMappingStatus();
                
                if (onMappingComplete) {
                    onMappingComplete();
                }
            } else {
                const errorData = await response.json();
                setError(errorData.error || 'Failed to start mapping');
            }
        } catch (err) {
            console.error('Error starting mapping:', err);
            setError('Network error while starting mapping');
        } finally {
            setMapping(false);
        }
    };

    const clearMappedData = async () => {
        try {
            setClearing(true);
            setError(null);

            const token = localStorage.getItem('access_token');
            const response = await fetch(`${API_BASE_URL}/mapping/clear-mapped/${businessId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
            });

            if (response.ok) {
                await fetchMappingStatus();
            } else {
                const errorData = await response.json();
                setError(errorData.error || 'Failed to clear mapped data');
            }
        } catch (err) {
            console.error('Error clearing mapped data:', err);
            setError('Network error while clearing data');
        } finally {
            setClearing(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center p-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
                <span className="ml-2">Loading mapping status...</span>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="bg-white shadow rounded-lg p-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="text-lg font-medium text-gray-900">🤖 AI-Powered Data Mapping</h2>
                        <p className="text-sm text-gray-600 mt-1">
                            Automatically convert Excel data to structured database tables in Supabase
                        </p>
                    </div>
                    <div className="flex items-center space-x-2">
                        {mappingStatus?.hasMappedData && (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                ✅ Data Mapped
                            </span>
                        )}
                        {mappingStatus && !mappingStatus.hasMappedData && mappingStatus.totalMongoCollections > 0 && (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                                📋 Ready for Mapping
                            </span>
                        )}
                    </div>
                </div>
            </div>

            {error && (
                <div className="bg-red-50 border border-red-200 rounded-md p-4">
                    <div className="text-sm text-red-600">{error}</div>
                </div>
            )}

            {mappingStatus && (
                <>
                    {/* Status Overview */}
                    <div className="bg-white shadow rounded-lg p-6">
                        <h3 className="text-base font-medium text-gray-900 mb-4">Mapping Status Overview</h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="bg-blue-50 p-4 rounded-lg">
                                <div className="text-2xl font-bold text-blue-600">{mappingStatus.totalMongoCollections}</div>
                                <div className="text-sm text-blue-600">Excel Collections</div>
                            </div>
                            <div className="bg-green-50 p-4 rounded-lg">
                                <div className="text-2xl font-bold text-green-600">{mappingStatus.totalSupabaseTables}</div>
                                <div className="text-sm text-green-600">Mapped Tables</div>
                            </div>
                            <div className="bg-purple-50 p-4 rounded-lg">
                                <div className="text-2xl font-bold text-purple-600">
                                    {Object.values(mappingStatus.supabaseStatus).reduce((sum, status) => sum + status.recordCount, 0)}
                                </div>
                                <div className="text-sm text-purple-600">Total Records</div>
                            </div>
                        </div>
                    </div>

                    {/* Source Data (MongoDB Collections) */}
                    {Object.keys(mappingStatus.mongoStatus).length > 0 && !mappingStatus.hasMappedData && (
                        <div className="bg-white shadow rounded-lg p-6">
                            <h3 className="text-base font-medium text-gray-900 mb-4">📊 Source Data (Excel Sheets)</h3>
                            <div className="space-y-3">
                                {Object.entries(mappingStatus.mongoStatus).map(([collectionName, info]) => (
                                    <div key={collectionName} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                        <div>
                                            <div className="font-medium text-gray-900">{info.sheetName}</div>
                                            <div className="text-sm text-gray-600">{info.recordCount} rows</div>
                                        </div>
                                        <div className="text-blue-600 font-medium">Ready for mapping</div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}



                    {/* Mapped Data (Supabase Tables) */}
                    {mappingStatus.hasMappedData && (
                        <div className="bg-white shadow rounded-lg p-6">
                            <h3 className="text-base font-medium text-gray-900 mb-4">🗄️ Unified Database Tables</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                {Object.entries(mappingStatus.supabaseStatus)
                                    .filter(([_, status]) => status.hasData)
                                    .map(([table, status]) => (
                                        <div key={table} className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                                            <div>
                                                <div className="font-medium text-green-900">{table.replace('_', ' ')}</div>
                                                <div className="text-sm text-green-600">{status.recordCount} records</div>
                                            </div>
                                            <div className="text-green-500">✅</div>
                                        </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Action Buttons */}
                    <div className="bg-white shadow rounded-lg p-6">
                        <div className="flex flex-col sm:flex-row gap-4">
                            {!mappingStatus.hasMappedData && mappingStatus.totalMongoCollections > 0 && (
                                <button
                                    onClick={startMapping}
                                    disabled={mapping}
                                    className="flex-1 bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 disabled:opacity-50 font-medium"
                                >
                                    {mapping ? '🤖 AI Mapping & Storing to Supabase...' : '🚀 Start AI Mapping to Supabase'}
                                </button>
                            )}

                            {mappingStatus.hasMappedData && (
                                <button
                                    onClick={clearMappedData}
                                    disabled={clearing}
                                    className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 disabled:opacity-50"
                                >
                                    {clearing ? 'Clearing...' : '🗑️ Clear Mapped Data'}
                                </button>
                            )}

                            <button
                                onClick={fetchMappingStatus}
                                disabled={loading}
                                className="bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700 disabled:opacity-50"
                            >
                                🔄 Refresh Status
                            </button>
                        </div>
                        
                        {mappingStatus.totalMongoCollections === 0 && (
                            <div className="mt-4 p-4 bg-yellow-50 rounded-lg">
                                <div className="text-sm text-yellow-800">
                                    📝 No Excel data found. Please upload your business Excel files first to start the AI mapping process.
                                </div>
                            </div>
                        )}
                    </div>
                </>
            )}
        </div>
    );
}
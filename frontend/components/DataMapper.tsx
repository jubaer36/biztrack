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
    const [mappingProgress, setMappingProgress] = useState<{
        currentStep: number;
        steps: string[];
        completed: boolean;
        cancellable: boolean;
    } | null>(null);
    const [abortController, setAbortController] = useState<AbortController | null>(null);
    const [progressInterval, setProgressInterval] = useState<NodeJS.Timeout | null>(null);

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

            // Initialize progress steps
            const steps = [
                'Analyzing Excel data structure...',
                'Identifying data relationships...',
                'Creating database schema...',
                'Mapping data fields...',
                'Storing data to Supabase...',
                'Validating data integrity...',
                'Finalizing mapping process...'
            ];

            setMappingProgress({
                currentStep: 0,
                steps,
                completed: false,
                cancellable: true
            });

            const controller = new AbortController();
            setAbortController(controller);

            const token = localStorage.getItem('access_token');

            // Simulate progress updates
            const interval = setInterval(() => {
                setMappingProgress(prev => {
                    if (!prev) return prev;
                    const nextStep = prev.currentStep + 1;
                    if (nextStep >= prev.steps.length) {
                        clearInterval(interval);
                        return { ...prev, completed: true };
                    }
                    // Make non-cancellable when reaching "Storing data to Supabase..." (step 4)
                    const isCancellable = nextStep < 4; // Steps 0-3 are cancellable, 4+ are not
                    return { ...prev, currentStep: nextStep, cancellable: isCancellable };
                });
            }, 2000); // Update every 2 seconds

            setProgressInterval(interval);

            const response = await fetch(`${API_BASE_URL}/mapping/map/${businessId}`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
                signal: controller.signal,
            });

            clearInterval(interval);

            if (response.ok) {
                const data = await response.json();
                console.log('Mapping completed:', data);

                setMappingProgress(prev => prev ? { ...prev, completed: true } : null);
                
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
            if (progressInterval) {
                clearInterval(progressInterval);
                setProgressInterval(null);
            }
            setAbortController(null);
            // Clear progress after a short delay
            setTimeout(() => setMappingProgress(null), 2000);
        }
    };

    const cancelMapping = () => {
        if (progressInterval) {
            clearInterval(progressInterval);
            setProgressInterval(null);
        }
        if (abortController) {
            abortController.abort();
            setAbortController(null);
        }
        setMapping(false);
        setMappingProgress(null);
        setError('Mapping cancelled by user');
    };

    const clearMappedData = async () => {
        if (!confirm('⚠️ Are you sure you want to clear all mapped data?\n\nThis will delete all data from the unified PostgreSQL database for this business.\n\nThis action cannot be undone!')) {
            return;
        }

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
        <div className={`space-y-6 ${mapping ? 'pointer-events-none' : ''}`}>
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

                    {/* Action Buttons */}
                    <div className="bg-white shadow rounded-lg p-6">
                        <div className="flex flex-col sm:flex-row gap-4">
                            {!mappingStatus.hasMappedData && mappingStatus.totalMongoCollections > 0 && (
                                <button
                                    onClick={startMapping}
                                    disabled={mapping}
                                    className={`flex-1 px-4 py-2 rounded-lg font-medium transition-all duration-300 ${
                                        mapping
                                            ? 'bg-slate-600 text-white animate-pulse cursor-not-allowed'
                                            : 'bg-slate-600 text-white hover:bg-slate-700 hover:shadow-md'
                                    }`}
                                >
                                    {mapping ? (
                                        <div className="flex items-center justify-center space-x-2">
                                            <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                                            <span>🤖 AI Mapping & Storing to Supabase...</span>
                                        </div>
                                    ) : (
                                        '🚀 Start AI Mapping to Supabase'
                                    )}
                                </button>
                            )}

                            {mappingStatus.hasMappedData && (
                                <button
                                    onClick={clearMappedData}
                                    disabled={clearing}
                                    className="border-2 border-red-200 text-red-600 px-4 py-2 rounded-lg hover:bg-red-50 disabled:opacity-50 font-medium transition-colors"
                                >
                                    {clearing ? 'Clearing...' : '🗑️ Clear Mapped Data'}
                                </button>
                            )}

                            <button
                                onClick={fetchMappingStatus}
                                disabled={loading}
                                className="border-2 border-slate-300 text-slate-700 px-4 py-2 rounded-lg hover:bg-slate-50 disabled:opacity-50 font-medium transition-colors"
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

            {/* Loading Overlay */}
            {mapping && mappingProgress && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-8 max-w-md w-full mx-4 shadow-2xl">
                        <div className="text-center">
                            <div className="mb-6">
                                <div className="animate-spin rounded-full h-16 w-16 border-4 border-indigo-600 border-t-transparent mx-auto"></div>
                            </div>
                            
                            <h3 className="text-xl font-semibold text-gray-900 mb-4">
                                🤖 AI Mapping in Progress
                            </h3>
                            
                            <div className="space-y-3 mb-6">
                                {mappingProgress.steps.map((step, index) => (
                                    <div
                                        key={index}
                                        className={`flex items-center space-x-3 text-left ${
                                            index < mappingProgress.currentStep
                                                ? 'text-green-600'
                                                : index === mappingProgress.currentStep
                                                ? 'text-indigo-600 font-medium'
                                                : 'text-gray-400'
                                        }`}
                                    >
                                        <div className={`w-2 h-2 rounded-full ${
                                            index < mappingProgress.currentStep
                                                ? 'bg-green-500'
                                                : index === mappingProgress.currentStep
                                                ? 'bg-indigo-500 animate-pulse'
                                                : 'bg-gray-300'
                                        }`}></div>
                                        <span className="text-sm">
                                            {index < mappingProgress.currentStep && '✅ '}
                                            {index === mappingProgress.currentStep && '🔄 '}
                                            {step}
                                        </span>
                                    </div>
                                ))}
                            </div>
                            
                            {mappingProgress.cancellable && (
                                <div className="mb-4">
                                    <button
                                        onClick={cancelMapping}
                                        className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors font-medium"
                                    >
                                        Cancel Mapping
                                    </button>
                                </div>
                            )}
                            
                            <div className="text-sm text-gray-600">
                                {mappingProgress.cancellable 
                                    ? 'You can cancel this process before data storage begins.' 
                                    : 'Please wait while we process your data...'
                                }
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
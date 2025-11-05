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

interface SheetData {
    sheetName: string;
    collectionName: string;
    documentCount: number;
    preview: any[];
}

interface UploadResult {
    fileName: string;
    sheets?: {
        sheetName: string;
        collectionName: string;
        rowCount: number;
        headers: string[];
    }[];
    error?: string;
}

export default function BusinessRawDataPage() {
    const { user, loading } = useAuth();
    const router = useRouter();
    const params = useParams();
    const businessId = params.id as string;

    const [business, setBusiness] = useState<Business | null>(null);
    const [loadingBusiness, setLoadingBusiness] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Excel upload states
    const [uploadingFiles, setUploadingFiles] = useState(false);
    const [uploadResults, setUploadResults] = useState<UploadResult[]>([]);
    const [sheetData, setSheetData] = useState<SheetData[]>([]);
    const [loadingData, setLoadingData] = useState(false);
    const [selectedSheet, setSelectedSheet] = useState<SheetData | null>(null);
    const [editingCell, setEditingCell] = useState<{rowIndex: number, field: string, value: any} | null>(null);
    const [savingCell, setSavingCell] = useState(false);

    useEffect(() => {
        if (!loading && !user) {
            router.push('/auth/login');
        }
    }, [user, loading, router]);

    useEffect(() => {
        if (user && businessId) {
            fetchBusiness();
            fetchBusinessData();
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

    const fetchBusinessData = async () => {
        try {
            setLoadingData(true);
            const token = localStorage.getItem('access_token');
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'}/data/businesses/${businessId}/data`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
            });

            if (response.ok) {
                const data = await response.json();
                setSheetData(data.collections || []);
            } else {
                console.error('Failed to fetch business data');
            }
        } catch (error) {
            console.error('Error fetching business data:', error);
        } finally {
            setLoadingData(false);
        }
    };

    const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const files = event.target.files;
        if (!files || files.length === 0) return;

        try {
            setUploadingFiles(true);
            setUploadResults([]);
            setError(null);

            const formData = new FormData();
            for (let i = 0; i < files.length; i++) {
                formData.append('files', files[i]);
            }

            const token = localStorage.getItem('access_token');
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'}/data/businesses/${businessId}/upload-excel`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
                body: formData,
            });

            if (response.ok) {
                const data = await response.json();
                setUploadResults(data.results || []);
                // Refresh the business data to show new sheets
                await fetchBusinessData();
            } else {
                const errorData = await response.json();
                setError(errorData.error || 'Failed to upload files');
            }
        } catch (error) {
            console.error('Error uploading files:', error);
            setError('Network error while uploading files');
        } finally {
            setUploadingFiles(false);
            // Reset the file input
            event.target.value = '';
        }
    };

    const handleDeleteAllData = async () => {
        if (!confirm('Are you sure you want to delete all uploaded data for this business? This action cannot be undone.')) {
            return;
        }

        try {
            const token = localStorage.getItem('access_token');
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'}/data/businesses/${businessId}/data`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
            });

            if (response.ok) {
                setSheetData([]);
                setSelectedSheet(null);
                setUploadResults([]);
            } else {
                const errorData = await response.json();
                setError(errorData.error || 'Failed to delete data');
            }
        } catch (error) {
            console.error('Error deleting data:', error);
            setError('Network error while deleting data');
        }
    };

    const handleDeleteCollection = async (collectionName: string) => {
        if (!confirm(`Are you sure you want to delete the collection "${collectionName}"? This action cannot be undone.`)) {
            return;
        }

        try {
            const token = localStorage.getItem('access_token');
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'}/data/businesses/${businessId}/collections/${collectionName}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
            });

            if (response.ok) {
                // Refresh the business data
                await fetchBusinessData();
                if (selectedSheet?.collectionName === collectionName) {
                    setSelectedSheet(null);
                }
            } else {
                const errorData = await response.json();
                setError(errorData.error || 'Failed to delete collection');
            }
        } catch (error) {
            console.error('Error deleting collection:', error);
            setError('Network error while deleting collection');
        }
    };

    const handleCellEdit = (rowIndex: number, field: string, currentValue: any) => {
        setEditingCell({ rowIndex, field, value: currentValue });
    };

    const handleCellSave = async () => {
        if (!editingCell || !selectedSheet) return;

        try {
            setSavingCell(true);
            const token = localStorage.getItem('access_token');
            const document = selectedSheet.preview[editingCell.rowIndex];
            const documentId = document._id;

            // Save exactly as entered - empty string is valid
            const valueToSave = editingCell.value === null || editingCell.value === undefined ? '' : editingCell.value;

            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'}/data/businesses/${businessId}/collections/${selectedSheet.collectionName}/documents/${documentId}`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    [editingCell.field]: valueToSave
                }),
            });

            if (response.ok) {
                // Update local state
                const updatedPreview = [...selectedSheet.preview];
                updatedPreview[editingCell.rowIndex] = {
                    ...updatedPreview[editingCell.rowIndex],
                    [editingCell.field]: editingCell.value
                };
                setSelectedSheet({
                    ...selectedSheet,
                    preview: updatedPreview
                });

                // Update in sheetData as well
                const updatedSheetData = sheetData.map(sheet =>
                    sheet.collectionName === selectedSheet.collectionName
                        ? { ...sheet, preview: updatedPreview }
                        : sheet
                );
                setSheetData(updatedSheetData);

                setEditingCell(null);
            } else {
                const errorData = await response.json();
                setError(errorData.error || 'Failed to update cell');
            }
        } catch (error) {
            console.error('Error updating cell:', error);
            setError('Network error while updating cell');
        } finally {
            setSavingCell(false);
        }
    };

    const handleCellCancel = () => {
        setEditingCell(null);
    };

    const handleDeleteDocument = async (documentId: string, collectionName: string) => {
        if (!confirm('Are you sure you want to delete this row?')) {
            return;
        }

        try {
            const token = localStorage.getItem('access_token');
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'}/data/businesses/${businessId}/collections/${collectionName}/documents/${documentId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
            });

            if (response.ok) {
                // Refresh the business data
                await fetchBusinessData();
            } else {
                const errorData = await response.json();
                setError(errorData.error || 'Failed to delete row');
            }
        } catch (error) {
            console.error('Error deleting row:', error);
            setError('Network error while deleting row');
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
                            <h1 className="text-xl font-semibold text-gray-900">Business Raw Data</h1>
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
                                        <h2 className="text-lg font-medium text-gray-900">{business.name} - Raw Data</h2>
                                        <p className="mt-1 text-sm text-gray-600">
                                            Excel-uploaded data collections
                                        </p>
                                    </div>
                                    <div className="flex space-x-3">
                                        <button
                                            onClick={() => router.push(`/businesses/${businessId}/unified-data`)}
                                            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                                        >
                                            View Unified Data
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {/* Excel Upload Section */}
                            <div className="bg-white shadow overflow-hidden sm:rounded-lg mb-6">
                                <div className="px-4 py-5 sm:px-6">
                                    <h3 className="text-lg font-medium text-gray-900 mb-2">Upload Excel Files</h3>
                                    <p className="text-sm text-gray-600 mb-4">
                                        Upload Excel files (.xls, .xlsx) to create MongoDB collections. Each sheet will be converted to a separate collection with documents mapped from the rows and columns.
                                    </p>
                                    <div className="flex items-center space-x-4">
                                        <label className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 cursor-pointer">
                                            <input
                                                type="file"
                                                multiple
                                                accept=".xls,.xlsx,.xlsm"
                                                onChange={handleFileUpload}
                                                disabled={uploadingFiles}
                                                className="hidden"
                                            />
                                            {uploadingFiles ? 'Uploading...' : 'Choose Excel Files'}
                                        </label>
                                        {sheetData.length > 0 && (
                                            <button
                                                onClick={handleDeleteAllData}
                                                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                                            >
                                                Delete All Data
                                            </button>
                                        )}
                                    </div>

                                    {/* Upload Results */}
                                    {uploadResults.length > 0 && (
                                        <div className="mt-4">
                                            <h4 className="text-sm font-medium text-gray-900 mb-2">Upload Results:</h4>
                                            <div className="space-y-2">
                                                {uploadResults.map((result, index) => (
                                                    <div key={index} className={`p-3 rounded-md ${result.error ? 'bg-red-50' : 'bg-green-50'}`}>
                                                        <p className={`text-sm font-medium ${result.error ? 'text-red-800' : 'text-green-800'}`}>
                                                            {result.fileName}
                                                        </p>
                                                        {result.error ? (
                                                            <p className="text-xs text-red-600 mt-1">{result.error}</p>
                                                        ) : (
                                                            <div className="text-xs text-green-700 mt-1">
                                                                {result.sheets?.map((sheet, idx) => (
                                                                    <div key={idx}>
                                                                        Sheet &quot;{sheet.sheetName}&quot;: {sheet.rowCount} rows → {sheet.collectionName}
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        )}
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Collections/Data Section */}
                            <div className="bg-white shadow overflow-hidden sm:rounded-lg">
                                <div className="px-4 py-5 sm:px-6">
                                    <h3 className="text-lg font-medium text-gray-900">Uploaded Data Collections</h3>
                                    <p className="mt-1 text-sm text-gray-600">
                                        View and manage your uploaded Excel data
                                    </p>
                                </div>
                                <div className="border-t border-gray-200">
                                    {loadingData ? (
                                        <div className="text-center py-8">
                                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto"></div>
                                            <p className="mt-2 text-sm text-gray-600">Loading data...</p>
                                        </div>
                                    ) : sheetData.length > 0 ? (
                                        <div className="divide-y divide-gray-200">
                                            {sheetData.map((sheet, index) => (
                                                <div key={index} className="px-4 py-4 hover:bg-gray-50">
                                                    <div className="flex items-center justify-between">
                                                        <div className="flex-1">
                                                            <button
                                                                onClick={() => setSelectedSheet(selectedSheet?.collectionName === sheet.collectionName ? null : sheet)}
                                                                className="text-left w-full"
                                                            >
                                                                <h4 className="text-sm font-medium text-indigo-600 hover:text-indigo-900">
                                                                    {sheet.sheetName}
                                                                </h4>
                                                                <p className="text-xs text-gray-500 mt-1">
                                                                    Collection: {sheet.collectionName} • {sheet.documentCount} documents
                                                                </p>
                                                            </button>

                                                            {/* Preview Data Table - Excel-like View */}
                                                            {selectedSheet?.collectionName === sheet.collectionName && sheet.preview.length > 0 && (
                                                                <div className="mt-4 overflow-x-auto">
                                                                    <div className="inline-block min-w-full align-middle">
                                                                        <div className="overflow-hidden border border-gray-300 rounded-lg">
                                                                            <table className="min-w-full divide-y divide-gray-300" style={{ borderCollapse: 'collapse' }}>
                                                                                <thead className="bg-gray-100">
                                                                                    <tr>
                                                                                        <th className="px-2 py-2 text-center text-xs font-bold text-gray-700 border-r border-gray-300 bg-gray-200 sticky left-0 z-10" style={{ minWidth: '50px', maxWidth: '50px' }}>
                                                                                            #
                                                                                        </th>
                                                                                        <th className="px-2 py-2 text-center text-xs font-medium text-gray-700 border-r border-gray-300" style={{ minWidth: '60px', maxWidth: '60px' }}>
                                                                                            Actions
                                                                                        </th>
                                                                                        {Object.keys(sheet.preview[0]).filter(key => key !== '_id' && key !== '_rowNumber').map((header, idx) => (
                                                                                            <th key={idx} className="px-3 py-2 text-left text-xs font-semibold text-gray-700 border-r border-gray-300 bg-gray-50" style={{ minWidth: '120px' }}>
                                                                                                {header}
                                                                                            </th>
                                                                                        ))}
                                                                                    </tr>
                                                                                </thead>
                                                                                <tbody className="bg-white divide-y divide-gray-200">
                                                                                    {sheet.preview.slice(0, 100).map((row, rowIdx) => (
                                                                                        <tr key={rowIdx} className="hover:bg-blue-50 transition-colors">
                                                                                            <td className="px-2 py-1 text-center text-xs font-medium text-gray-500 border-r border-gray-300 bg-gray-50 sticky left-0 z-10">
                                                                                                {row._rowNumber || rowIdx + 1}
                                                                                            </td>
                                                                                            <td className="px-2 py-1 text-center border-r border-gray-300 bg-white">
                                                                                                <button
                                                                                                    onClick={() => handleDeleteDocument(row._id, sheet.collectionName)}
                                                                                                    className="text-red-500 hover:text-red-700 text-xs hover:bg-red-50 px-2 py-1 rounded"
                                                                                                    title="Delete row"
                                                                        >
                                                                            🗑️
                                                                        </button>
                                                                    </td>
                                                                    {Object.entries(row).filter(([key]) => key !== '_id' && key !== '_rowNumber').map(([field, value], cellIdx) => {
                                                                        const isEditing = editingCell?.rowIndex === rowIdx && editingCell?.field === field;
                                                                        return (
                                                                            <td key={cellIdx} className="border-r border-gray-300 p-0">
                                                                                {isEditing ? (
                                                                                    <div className="flex items-center space-x-1 px-1 py-1">
                                                                                        <input
                                                                                            type="text"
                                                                                            value={editingCell.value ?? ''}
                                                                                            onChange={(e) => setEditingCell({ ...editingCell, value: e.target.value })}
                                                                                            className="w-full px-2 py-1 border-2 border-blue-500 rounded text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                                                            autoFocus
                                                                                            onKeyDown={(e) => {
                                                                                                if (e.key === 'Enter') handleCellSave();
                                                                                                if (e.key === 'Escape') handleCellCancel();
                                                                                            }}
                                                                                        />
                                                                                        <button
                                                                                            onClick={handleCellSave}
                                                                                            disabled={savingCell}
                                                                                            className="text-green-600 hover:text-green-800 disabled:opacity-50 font-bold"
                                                                                            title="Save (Enter)"
                                                                                        >
                                                                                            ✓
                                                                                        </button>
                                                                                        <button
                                                                                            onClick={handleCellCancel}
                                                                                            disabled={savingCell}
                                                                                            className="text-red-600 hover:text-red-800 disabled:opacity-50 font-bold"
                                                                                            title="Cancel (Esc)"
                                                                                        >
                                                                                            ✕
                                                                                        </button>
                                                                                    </div>
                                                                                ) : (
                                                                                    <div
                                                                                        onClick={() => handleCellEdit(rowIdx, field, value)}
                                                                                        className="cursor-pointer hover:bg-blue-100 px-3 py-2 text-xs text-gray-900 min-h-[32px] flex items-center"
                                                                                        title="Click to edit"
                                                                                    >
                                                                                        {value === '' || value === null || value === undefined ? (
                                                                                            <span className="text-gray-300">—</span>
                                                                                        ) : (
                                                                                            String(value)
                                                                                        )}
                                                                                    </div>
                                                                                )}
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
                                                                            <span className="font-semibold">{sheet.documentCount}</span> rows total
                                                                            {sheet.preview.length > 100 && <span> • Showing first 100</span>}
                                                                        </p>
                                                                        <p className="text-xs text-blue-600 italic">
                                                                            💡 Click any cell to edit • Empty cells shown as <span className="text-gray-300">—</span>
                                                                        </p>
                                                                    </div>
                                                                </div>
                                                            )}
                                                        </div>
                                                        <button
                                                            onClick={() => handleDeleteCollection(sheet.collectionName)}
                                                            className="ml-4 text-red-600 hover:text-red-900 text-sm"
                                                        >
                                                            Delete
                                                        </button>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="text-center py-8">
                                            <div className="text-gray-400 text-4xl mb-2">📊</div>
                                            <h4 className="text-sm font-medium text-gray-900 mb-1">No data uploaded yet</h4>
                                            <p className="text-xs text-gray-600">Upload Excel files to get started</p>
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
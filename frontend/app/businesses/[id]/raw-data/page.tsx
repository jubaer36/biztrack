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
import { Store, Upload, Database, FileSpreadsheet, Loader2, Edit, Trash2, Eye, EyeOff } from "lucide-react";

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

    // Business selection state
    const [businesses, setBusinesses] = useState<Business[]>([]);
    const [loadingBusinesses, setLoadingBusinesses] = useState(false);

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

            // Filter businesses that have MongoDB data
            const businessesWithData = [];
            
            for (const business of allBusinesses) {
                // Always include the current business
                if (business.id === businessId) {
                    businessesWithData.push(business);
                    continue;
                }
                
                try {
                    const dataResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'}/data/businesses/${business.id}/data`, {
                        headers: {
                            'Authorization': `Bearer ${token}`,
                        },
                    });
                    
                    if (dataResponse.ok) {
                        const data = await dataResponse.json();
                        // Check if business has any collections with data
                        if (data.collections && data.collections.length > 0 && data.collections.some((collection: any) => collection.documentCount > 0)) {
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

        // Check if there's existing data and warn the user
        if (sheetData.length > 0) {
            const confirmed = confirm(
                'Warning: Uploading new Excel files will remove all existing uploaded data for this business. This action cannot be undone.\n\nDo you want to continue?'
            );
            if (!confirmed) {
                // Reset the file input
                event.target.value = '';
                return;
            }
        }

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
        if (!confirm(`⚠️ Are you sure you want to delete ALL uploaded data for "${business?.name}"?\n\nThis will permanently remove:\n• All Excel file collections\n• All raw data from MongoDB\n• All uploaded records\n\nThis action CANNOT be undone!`)) {
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
        if (!confirm(`⚠️ Delete Collection: "${collectionName}"?\n\nThis will permanently delete:\n• The entire "${collectionName}" collection\n• All data records within it\n\nThis action CANNOT be undone!`)) {
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
                        router.push(`/businesses/${id}/raw-data`);
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
                    <>
                        {/* Business Info Card */}
                        <Card className="border-2 border-slate-200/50 bg-gradient-to-br from-white to-slate-50 shadow-xl rounded-xl overflow-hidden">
                            <CardHeader className="pb-4">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 rounded-lg bg-gradient-to-br from-emerald-600 to-green-600 shadow-lg">
                                            <Store className="h-5 w-5 text-white" />
                                        </div>
                                        <div>
                                            <CardTitle className="text-xl font-bold text-slate-800">{business.name} - Raw Data</CardTitle>
                                            <CardDescription className="text-slate-600">
                                                Excel-uploaded data collections
                                            </CardDescription>
                                        </div>
                                    </div>
                                    <div className="flex gap-3">
                                        <Button
                                            onClick={() => router.push(`/businesses/${businessId}/unified-data`)}
                                            className="bg-slate-700 hover:bg-slate-800 text-white shadow-md font-medium"
                                        >
                                            <Eye className="h-4 w-4 mr-2" />
                                            View Unified Data
                                        </Button>
                                    </div>
                                </div>
                            </CardHeader>
                        </Card>

                        {/* Excel Upload Section */}
                        <Card className="border-2 border-slate-200/50 bg-gradient-to-br from-white to-slate-50 shadow-xl rounded-xl overflow-hidden">
                            <CardHeader className="pb-4">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 rounded-lg bg-gradient-to-br from-indigo-600 to-purple-600 shadow-lg">
                                        <Upload className="h-5 w-5 text-white" />
                                    </div>
                                    <div>
                                        <CardTitle className="text-xl font-bold text-slate-800 flex items-center gap-2">
                                            Upload Excel Files
                                        </CardTitle>
                                        <CardDescription className="text-slate-600">
                                            Upload Excel files (.xls, .xlsx) to create MongoDB collections. Each sheet will be converted to a separate collection with documents mapped from the rows and columns.
                                        </CardDescription>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent>
                                <div className="flex items-center gap-4 mb-4">
                                    <label className="inline-flex items-center px-5 py-2.5 border border-transparent text-sm font-medium rounded-lg text-white bg-slate-600 hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-500 cursor-pointer shadow-md hover:shadow-lg transition-all duration-300">
                                        <Upload className="h-4 w-4 mr-2" />
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
                                        <Button
                                            onClick={handleDeleteAllData}
                                            variant="outline"
                                            className="border-2 border-red-200 text-red-600 hover:bg-red-50 font-medium"
                                        >
                                            <Trash2 className="h-4 w-4 mr-2" />
                                            Delete All Data
                                        </Button>
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
                            </CardContent>
                        </Card>

                        {/* Collections/Data Section */}
                        <Card className="border-2 border-slate-200/50 bg-gradient-to-br from-white to-slate-50 shadow-xl rounded-xl overflow-hidden">
                            <CardHeader className="pb-4">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 rounded-lg bg-gradient-to-br from-emerald-600 to-teal-600 shadow-lg">
                                        <FileSpreadsheet className="h-5 w-5 text-white" />
                                    </div>
                                    <div>
                                        <CardTitle className="text-xl font-bold text-slate-800 flex items-center gap-2">
                                            Uploaded Data Collections
                                        </CardTitle>
                                        <CardDescription className="text-slate-600">
                                            View and manage your uploaded Excel data
                                        </CardDescription>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent>
                                {loadingData ? (
                                    <div className="flex items-center justify-center py-20">
                                        <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
                                        <span className="ml-2 text-slate-600">Loading data...</span>
                                    </div>
                                ) : sheetData.length > 0 ? (
                                    <div className="space-y-4">
                                        {sheetData.map((sheet, index) => (
                                            <div key={index} className="border border-slate-200/70 rounded-xl p-6 hover:border-slate-300/80 transition-all duration-200 shadow-sm hover:shadow-md bg-white">
                                                <div className="flex items-center justify-between">
                                                    <div className="flex-1">
                                                            <button
                                                                onClick={() => setSelectedSheet(selectedSheet?.collectionName === sheet.collectionName ? null : sheet)}
                                                                className="text-left w-full group"
                                                            >
                                                                <div className="flex items-center gap-4">
                                                                    <div className="p-2.5 rounded-lg bg-gradient-to-br from-slate-600 to-slate-700 shadow-sm group-hover:shadow-md transition-all duration-200">
                                                                        <FileSpreadsheet className="h-5 w-5 text-white" />
                                                                    </div>
                                                                    <div className="flex-1">
                                                                        <h4 className="text-base font-semibold text-slate-800 group-hover:text-slate-900 transition-colors duration-200 mb-1">
                                                                            {sheet.sheetName}
                                                                        </h4>
                                                                        <p className="text-xs text-slate-600">
                                                                            Collection: <span className="font-semibold">{sheet.collectionName}</span> • <span className="font-semibold">{sheet.documentCount.toLocaleString()}</span> documents
                                                                        </p>
                                                                    </div>
                                                                    <div className="ml-4">
                                                                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-200 ${selectedSheet?.collectionName === sheet.collectionName ? 'bg-slate-100 rotate-180' : 'bg-slate-50 group-hover:bg-slate-100'}`}>
                                                                            <svg className={`w-4 h-4 transition-colors duration-200 ${selectedSheet?.collectionName === sheet.collectionName ? 'text-slate-700' : 'text-slate-400 group-hover:text-slate-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                                                            </svg>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            </button>

                                                            {/* Preview Data Table - Excel-like View */}
                                                            {selectedSheet?.collectionName === sheet.collectionName && sheet.preview.length > 0 && (
                                                                <div className="mt-6 overflow-x-auto">
                                                                    <div className="inline-block min-w-full align-middle">
                                                                        <div className="overflow-hidden border-2 border-slate-200/50 rounded-xl shadow-lg bg-white">
                                                                            <table className="min-w-full" style={{ borderCollapse: 'separate', borderSpacing: 0 }}>
                                                                                <thead>
                                                                                    <tr className="bg-gradient-to-r from-slate-50 to-blue-50/30">
                                                                                        <th className="px-4 py-3 text-center text-xs font-bold text-slate-700 border-b-2 border-r border-slate-200/50 sticky left-0 z-10 bg-slate-50" style={{ minWidth: '60px', maxWidth: '60px' }}>
                                                                                            #
                                                                                        </th>
                                                                                        <th className="px-4 py-3 text-center text-xs font-bold text-slate-700 border-b-2 border-r border-slate-200/50 bg-gradient-to-r from-slate-50 to-blue-50/30" style={{ minWidth: '80px', maxWidth: '80px' }}>
                                                                                            <span className="uppercase tracking-wide">Actions</span>
                                                                                        </th>
                                                                                        {Object.keys(sheet.preview[0]).filter(key => key !== '_id' && key !== '_rowNumber').map((header, idx) => (
                                                                                            <th key={idx} className="px-4 py-3 text-left text-xs font-bold text-slate-700 border-b-2 border-r border-slate-200/50 last:border-r-0 bg-gradient-to-r from-slate-50 to-blue-50/30" style={{ minWidth: '150px' }}>
                                                                                                <div className="flex items-center gap-2">
                                                                                                    <div className="w-1.5 h-1.5 rounded-full bg-blue-400"></div>
                                                                                                    <span className="uppercase tracking-wide">{header}</span>
                                                                                                </div>
                                                                                            </th>
                                                                                        ))}
                                                                                    </tr>
                                                                                </thead>
                                                                                <tbody>
                                                                                    {sheet.preview.slice(0, 100).map((row, rowIdx) => (
                                                                                        <tr key={rowIdx} className={`group transition-all duration-150 ${rowIdx % 2 === 0 ? 'bg-white hover:bg-blue-50/30' : 'bg-slate-50/30 hover:bg-blue-50/40'}`}>
                                                                                            <td className="px-4 py-2.5 text-center text-xs font-semibold text-slate-600 border-b border-r border-slate-200/50 sticky left-0 z-10 bg-inherit">
                                                                                                <span className="inline-flex items-center justify-center w-6 h-6 rounded-md bg-blue-50 text-blue-700 font-bold text-xs">
                                                                                                    {row._rowNumber || rowIdx + 1}
                                                                                                </span>
                                                                                            </td>
                                                                                            <td className="px-3 py-2.5 text-center border-b border-r border-slate-200/50">
                                                                                                <button
                                                                                                    onClick={() => handleDeleteDocument(row._id, sheet.collectionName)}
                                                                                                    className="inline-flex items-center justify-center w-7 h-7 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-md transition-colors duration-150"
                                                                                                    title="Delete row"
                                                                        >
                                                                            <Trash2 className="h-3.5 w-3.5" />
                                                                        </button>
                                                                    </td>
                                                                    {Object.entries(row).filter(([key]) => key !== '_id' && key !== '_rowNumber').map(([field, value], cellIdx) => {
                                                                        const isEditing = editingCell?.rowIndex === rowIdx && editingCell?.field === field;
                                                                        return (
                                                                            <td 
                                                                                key={cellIdx} 
                                                                                className="border-b border-r border-slate-200/50 last:border-r-0 p-0"
                                                                            >
                                                                                {isEditing ? (
                                                                                    <div className="flex items-center gap-1.5 px-2 py-2">
                                                                                        <input
                                                                                            type="text"
                                                                                            value={editingCell.value ?? ''}
                                                                                            onChange={(e) => setEditingCell({ ...editingCell, value: e.target.value })}
                                                                                            className="w-full px-3 py-1.5 border-2 border-blue-500 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm"
                                                                                            autoFocus
                                                                                            onKeyDown={(e) => {
                                                                                                if (e.key === 'Enter') handleCellSave();
                                                                                                if (e.key === 'Escape') handleCellCancel();
                                                                                            }}
                                                                                        />
                                                                                        <button
                                                                                            onClick={handleCellSave}
                                                                                            disabled={savingCell}
                                                                                            className="inline-flex items-center justify-center w-7 h-7 text-green-600 hover:text-green-800 hover:bg-green-50 rounded-md disabled:opacity-50 transition-colors duration-150"
                                                                                            title="Save (Enter)"
                                                                                        >
                                                                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                                                                            </svg>
                                                                                        </button>
                                                                                        <button
                                                                                            onClick={handleCellCancel}
                                                                                            disabled={savingCell}
                                                                                            className="inline-flex items-center justify-center w-7 h-7 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-md disabled:opacity-50 transition-colors duration-150"
                                                                                            title="Cancel (Esc)"
                                                                                        >
                                                                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                                                                            </svg>
                                                                                        </button>
                                                                                    </div>
                                                                                ) : (
                                                                                    <div
                                                                                        onClick={() => handleCellEdit(rowIdx, field, value)}
                                                                                        className="cursor-pointer px-4 py-2.5 text-sm text-slate-800 min-h-[42px] flex items-center font-medium hover:bg-blue-100/50 transition-colors duration-150"
                                                                                        title="Click to edit"
                                                                                    >
                                                                                        {value === '' || value === null || value === undefined ? (
                                                                                            <span className="text-slate-400 italic text-xs">—</span>
                                                                                        ) : (
                                                                                            <span>
                                                                                                {String(value)}
                                                                                            </span>
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
                                                                    <div className="mt-4 flex items-center justify-between px-2">
                                                                        <div className="flex items-center gap-3">
                                                                            <div className="flex items-center gap-2 text-xs bg-gradient-to-r from-blue-50 to-indigo-50 text-slate-700 px-3 py-2 rounded-lg border border-blue-200/50 shadow-sm">
                                                                                <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                                                                                <span className="font-bold">{sheet.documentCount.toLocaleString()}</span>
                                                                                <span className="font-medium">total rows</span>
                                                                            </div>
                                                                            {sheet.preview.length > 100 && (
                                                                                <div className="flex items-center gap-2 text-xs bg-gradient-to-r from-emerald-50 to-teal-50 text-slate-700 px-3 py-2 rounded-lg border border-emerald-200/50 shadow-sm">
                                                                                    <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                                                                                    <span className="font-bold">100</span>
                                                                                    <span className="font-medium">showing</span>
                                                                                </div>
                                                                            )}
                                                                        </div>
                                                                        <div className="flex items-center gap-2 text-xs bg-gradient-to-r from-purple-50 to-indigo-50 text-purple-700 px-3 py-2 rounded-lg border border-purple-200/50 shadow-sm">
                                                                            <Edit className="h-3.5 w-3.5" />
                                                                            <span className="font-semibold">Click any cell to edit</span>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            )}
                                                        </div>
                                                        <button
                                                            onClick={() => handleDeleteCollection(sheet.collectionName)}
                                                            className="px-3 py-1.5 text-sm font-semibold text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg border-2 border-red-200 transition-all duration-300"
                                                        >
                                                            <Trash2 className="h-4 w-4 inline mr-1" />
                                                            Delete
                                                        </button>
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
                                                <h4 className="text-lg font-semibold text-slate-800 mb-2">No data uploaded yet</h4>
                                                <p className="text-sm text-slate-600">Upload Excel files to get started</p>
                                            </div>
                                        </div>
                                    )}
                            </CardContent>
                        </Card>
                    </>
                ) : (
                    <Card className="border-2 border-slate-200/50 bg-gradient-to-br from-white to-slate-50 shadow-xl rounded-xl overflow-hidden">
                        <CardContent className="pt-8 pb-8">
                            <div className="text-center">
                                <div className="p-4 rounded-full bg-gradient-to-br from-slate-400 to-slate-500 shadow-lg w-fit mx-auto mb-6">
                                    <Store className="h-12 w-12 text-white" />
                                </div>
                                <h3 className="text-xl font-semibold text-slate-800 mb-2">Business not found</h3>
                                <p className="text-sm text-slate-600 mb-6 max-w-md mx-auto">The business you're looking for doesn't exist or you don't have access to it.</p>
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
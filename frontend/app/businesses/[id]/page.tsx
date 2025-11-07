'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import DataMapper from '@/components/DataMapper';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ArrowLeft, Store, Upload, Database, FileSpreadsheet, Loader2, Edit, Trash2, Eye, EyeOff, Brain } from "lucide-react";

interface Business {
    id: string;
    name: string;
    description: string | null;
    created_at: string;
    updated_at: string;
}

interface BusinessFormData {
    name: string;
    description: string;
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

export default function BusinessDetailPage() {
    const { user, loading } = useAuth();
    const router = useRouter();
    const params = useParams();
    const businessId = params.id as string;

    const [business, setBusiness] = useState<Business | null>(null);
    const [loadingBusiness, setLoadingBusiness] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [showEditModal, setShowEditModal] = useState(false);
    const [formData, setFormData] = useState<BusinessFormData>({ name: '', description: '' });
    const [submitting, setSubmitting] = useState(false);
    
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
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'}/businesses`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
            });

            if (response.ok) {
                const data = await response.json();
                setBusinesses(data.businesses || []);
            } else {
                console.error('Failed to fetch businesses');
            }
        } catch (error) {
            console.error('Error fetching businesses:', error);
        } finally {
            setLoadingBusinesses(false);
        }
    };

    const handleEditBusiness = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.name.trim()) return;

        try {
            setSubmitting(true);
            const token = localStorage.getItem('access_token');
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'}/businesses/${businessId}`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    name: formData.name.trim(),
                    description: formData.description.trim() || null,
                }),
            });

            if (response.ok) {
                setShowEditModal(false);
                setFormData({ name: '', description: '' });
                fetchBusiness(); // Refresh the data
            } else {
                const errorData = await response.json();
                setError(errorData.error || 'Failed to update business');
            }
        } catch (error) {
            console.error('Error updating business:', error);
            setError('Network error while updating business');
        } finally {
            setSubmitting(false);
        }
    };

    const handleDeleteBusiness = async () => {
        if (!confirm('Are you sure you want to delete this business? This action cannot be undone.')) {
            return;
        }

        try {
            const token = localStorage.getItem('access_token');
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'}/businesses/${businessId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
            });

            if (response.ok) {
                router.push('/businesses'); // Redirect to businesses list
            } else {
                const errorData = await response.json();
                setError(errorData.error || 'Failed to delete business');
            }
        } catch (error) {
            console.error('Error deleting business:', error);
            setError('Network error while deleting business');
        }
    };

    const openEditModal = () => {
        if (business) {
            setFormData({ name: business.name, description: business.description || '' });
            setShowEditModal(true);
        }
    };

    const closeModals = () => {
        setShowEditModal(false);
        setFormData({ name: '', description: '' });
        setError(null);
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
            {/* Header */}
            <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
                <div className="container mx-auto px-4 py-4">
                    <div className="flex items-center justify-between gap-4">
                        <div className="flex items-center gap-4">
                            <Button variant="ghost" size="icon" onClick={() => router.push("/businesses")}>
                                <ArrowLeft className="h-5 w-5" />
                            </Button>
                            <div>
                                <h1 className="text-2xl font-bold text-foreground">Business Details</h1>
                                <p className="text-sm text-muted-foreground">Manage your business data and settings</p>
                            </div>
                        </div>

                        {/* Business Selector */}
                        <div className="flex items-center gap-2">
                            <Store className="h-5 w-5 text-muted-foreground" />
                            <select
                                value={businessId}
                                onChange={(e) => {
                                    if (e.target.value && e.target.value !== businessId) {
                                        router.push(`/businesses/${e.target.value}`);
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
                                        <CardTitle className="text-xl font-bold text-slate-800">{business.name}</CardTitle>
                                        <CardDescription className="text-slate-600 mt-1">
                                            {business.description || 'No description provided'}
                                        </CardDescription>
                                    </div>
                                    <div className="flex gap-3">
                                        <Button
                                            onClick={openEditModal}
                                            variant="outline"
                                            className="border-2 border-slate-200 bg-white text-slate-700 hover:bg-slate-50 transition-all duration-300"
                                        >
                                            <Edit className="h-4 w-4 mr-2" />
                                            Edit Business
                                        </Button>
                                        <Button
                                            onClick={handleDeleteBusiness}
                                            className="bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700 text-white shadow-md"
                                        >
                                            <Trash2 className="h-4 w-4 mr-2" />
                                            Delete Business
                                        </Button>
                                        <Button
                                            onClick={() => router.push(`/businesses/${businessId}/raw-data`)}
                                            className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white shadow-md"
                                        >
                                            <Database className="h-4 w-4 mr-2" />
                                            View Raw Data
                                        </Button>
                                        <Button
                                            onClick={() => router.push(`/businesses/${businessId}/unified-data`)}
                                            className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white shadow-md"
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
                            <CardHeader>
                                <CardTitle className="text-xl font-bold text-slate-800 flex items-center gap-2">
                                    <Upload className="h-5 w-5 text-indigo-600" />
                                    Upload Excel Files
                                </CardTitle>
                                <CardDescription className="text-slate-600">
                                    Upload Excel files (.xls, .xlsx) to create MongoDB collections. Each sheet will be converted to a separate collection with documents mapped from the rows and columns.
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="flex items-center gap-4 mb-4">
                                    <label className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg text-white bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 cursor-pointer shadow-md">
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
                                            className="border-2 border-red-600 text-red-600 hover:bg-red-600 hover:text-white transition-all duration-300"
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

                        {/* AI Data Mapping Section */}
                        <Card className="border-2 border-slate-200/50 bg-gradient-to-br from-white to-slate-50 shadow-xl rounded-xl overflow-hidden">
                            <CardHeader>
                                <CardTitle className="text-xl font-bold text-slate-800 flex items-center gap-2">
                                    <Brain className="h-5 w-5 text-purple-600" />
                                    AI Data Mapping
                                </CardTitle>
                                <CardDescription className="text-slate-600">
                                    Use AI to automatically map and structure your uploaded data
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <DataMapper
                                    businessId={businessId}
                                    onMappingComplete={() => {
                                        // Refresh data when mapping completes
                                        fetchBusinessData();
                                    }}
                                />
                            </CardContent>
                        </Card>

                        {/* Collections/Data Section */}
                        <Card className="border-2 border-slate-200/50 bg-gradient-to-br from-white to-slate-50 shadow-xl rounded-xl overflow-hidden">
                            <CardHeader>
                                <CardTitle className="text-xl font-bold text-slate-800 flex items-center gap-2">
                                    <FileSpreadsheet className="h-5 w-5 text-emerald-600" />
                                    Uploaded Data Collections
                                </CardTitle>
                                <CardDescription className="text-slate-600">
                                    View and manage your uploaded Excel data
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                {loadingData ? (
                                    <div className="flex items-center justify-center py-8">
                                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                                        <span className="ml-2 text-slate-600">Loading data...</span>
                                    </div>
                                ) : sheetData.length > 0 ? (
                                    <div className="space-y-4">
                                        {sheetData.map((sheet, index) => (
                                            <div key={index} className="border border-slate-200 rounded-lg p-4 hover:bg-slate-50/50 transition-colors">
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
                            </CardContent>
                        </Card>
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

            {/* Edit Business Modal */}
            {showEditModal && business && (
                <Dialog open={showEditModal} onOpenChange={setShowEditModal}>
                    <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-white border-2 border-slate-200 shadow-2xl rounded-xl">
                        <DialogHeader>
                            <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">Edit Business</DialogTitle>
                            <DialogDescription className="text-slate-600">
                                Update your business information and settings.
                            </DialogDescription>
                        </DialogHeader>

                        <form onSubmit={handleEditBusiness} className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="edit-name">Business Name *</Label>
                                <Input
                                    id="edit-name"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    required
                                    maxLength={100}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="edit-description">Description</Label>
                                <Textarea
                                    id="edit-description"
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    rows={3}
                                    maxLength={500}
                                />
                            </div>
                            <DialogFooter>
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={closeModals}
                                    className="border-2 border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                                >
                                    Cancel
                                </Button>
                                <Button
                                    type="submit"
                                    disabled={submitting}
                                    className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white shadow-md"
                                >
                                    {submitting ? (
                                        <>
                                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                            Saving...
                                        </>
                                    ) : (
                                        'Save Changes'
                                    )}
                                </Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>
            )}
        </div>
    );
}

'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { Navigation } from '@/components/Navigation';
import DataMapper from '@/components/DataMapper';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Store, Upload, Database, FileSpreadsheet, Loader2, Edit, Trash2, Eye, EyeOff, Brain } from "lucide-react";

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
            <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="relative">
                        <div className="animate-spin rounded-full h-24 w-24 border-b-4 border-t-4 border-indigo-600 mx-auto"></div>
                        <div className="absolute inset-0 flex items-center justify-center">
                            <Loader2 className="h-10 w-10 text-indigo-600 animate-pulse" />
                        </div>
                    </div>
                    <p className="mt-6 text-slate-700 font-semibold text-lg">Loading...</p>
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
                        router.push(`/businesses/${id}`);
                    }
                }}
                showBusinessSelector={true}
            />

            <div className="container mx-auto px-4 py-6">
            <main className="space-y-6">
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
                        <Card className="border-2 border-blue-200/50 bg-white/80 backdrop-blur-sm shadow-xl rounded-xl overflow-hidden hover:shadow-2xl transition-all duration-300">
                            <CardHeader>
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg">
                                            <Store className="h-6 w-6 text-white" />
                                        </div>
                                        <div>
                                            <CardTitle className="text-xl font-bold text-slate-800">{business.name}</CardTitle>
                                            <CardDescription className="text-slate-600 mt-1">
                                                {business.description || 'No description provided'}
                                            </CardDescription>
                                        </div>
                                    </div>
                                    <div className="flex gap-3">
                                        <Button
                                            onClick={openEditModal}
                                            variant="outline"
                                            className="border-2 border-slate-300 bg-white text-slate-700 hover:bg-slate-50 font-medium"
                                        >
                                            <Edit className="h-4 w-4 mr-2" />
                                            Edit Business
                                        </Button>
                                        <Button
                                            onClick={handleDeleteBusiness}
                                            variant="outline"
                                            className="border-2 border-red-200 text-red-600 hover:bg-red-50 font-medium"
                                        >
                                            <Trash2 className="h-4 w-4 mr-2" />
                                            Delete Business
                                        </Button>
                                        <Button
                                            onClick={() => router.push(`/businesses/${businessId}/raw-data`)}
                                            className="bg-slate-600 hover:bg-slate-700 text-white shadow-md font-medium"
                                        >
                                            <Database className="h-4 w-4 mr-2" />
                                            View Raw Data
                                        </Button>
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
                        <Card className="border-2 border-purple-200/50 bg-white/80 backdrop-blur-sm shadow-xl rounded-xl overflow-hidden hover:shadow-2xl transition-all duration-300">
                            <CardHeader>
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center shadow-md">
                                        <Upload className="h-5 w-5 text-white" />
                                    </div>
                                    <div>
                                        <CardTitle className="text-xl font-bold text-slate-800">Upload Excel Files</CardTitle>
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
                                        <h4 className="text-sm font-semibold text-slate-900 mb-3">Upload Results:</h4>
                                        <div className="space-y-2">
                                            {uploadResults.map((result, index) => (
                                                <div key={index} className={`p-4 rounded-xl border-2 ${result.error ? 'bg-red-50 border-red-200' : 'bg-emerald-50 border-emerald-200'} shadow-sm`}>
                                                    <p className={`text-sm font-semibold ${result.error ? 'text-red-800' : 'text-emerald-800'}`}>
                                                        {result.fileName}
                                                    </p>
                                                    {result.error ? (
                                                        <p className="text-xs text-red-600 mt-1">{result.error}</p>
                                                    ) : (
                                                        <div className="text-xs text-emerald-700 mt-1 space-y-0.5">
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
                        <Card className="border-2 border-indigo-200/50 bg-white/80 backdrop-blur-sm shadow-xl rounded-xl overflow-hidden hover:shadow-2xl transition-all duration-300">
                            <CardHeader>
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-indigo-500 to-blue-600 flex items-center justify-center shadow-md">
                                        <Brain className="h-5 w-5 text-white" />
                                    </div>
                                    <div>
                                        <CardTitle className="text-xl font-bold text-slate-800">AI Data Mapping</CardTitle>
                                        <CardDescription className="text-slate-600">
                                            Use AI to automatically map and structure your uploaded data
                                        </CardDescription>
                                    </div>
                                </div>
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
                        <Card className="border-2 border-emerald-200/50 bg-white/80 backdrop-blur-sm shadow-xl rounded-xl overflow-hidden hover:shadow-2xl transition-all duration-300">
                            <CardHeader>
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-md">
                                        <FileSpreadsheet className="h-5 w-5 text-white" />
                                    </div>
                                    <div>
                                        <CardTitle className="text-xl font-bold text-slate-800">Uploaded Data Collections</CardTitle>
                                        <CardDescription className="text-slate-600">
                                            View and manage your uploaded Excel data
                                        </CardDescription>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent>
                                {loadingData ? (
                                    <div className="flex items-center justify-center py-12">
                                        <div className="text-center">
                                            <Loader2 className="h-12 w-12 animate-spin text-indigo-600 mx-auto mb-3" />
                                            <span className="text-slate-700 font-semibold">Loading data...</span>
                                        </div>
                                    </div>
                                ) : sheetData.length > 0 ? (
                                    <div className="space-y-4">
                                        {sheetData.map((sheet, index) => (
                                            <div key={index} className="border-2 border-blue-200/50 rounded-xl p-4 bg-gradient-to-r from-blue-50/30 to-indigo-50/30 hover:from-blue-50/50 hover:to-indigo-50/50 transition-all duration-300 shadow-sm hover:shadow-md">
                                                <div className="flex items-center justify-between">
                                                    <div className="flex-1">
                                                            <button
                                                                onClick={() => setSelectedSheet(selectedSheet?.collectionName === sheet.collectionName ? null : sheet)}
                                                                className="text-left w-full flex items-center gap-2"
                                                            >
                                                                <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                                                                <div>
                                                                    <h4 className="text-sm font-bold text-indigo-700 hover:text-indigo-900">
                                                                        {sheet.sheetName}
                                                                    </h4>
                                                                    <p className="text-xs text-slate-600 mt-0.5">
                                                                        Collection: <span className="font-medium">{sheet.collectionName}</span> • <span className="font-medium">{sheet.documentCount}</span> documents
                                                                    </p>
                                                                </div>
                                                            </button>

                                                            {/* Preview Data Table - Excel-like View */}
                                                            {selectedSheet?.collectionName === sheet.collectionName && sheet.preview.length > 0 && (
                                                                <div className="mt-4 overflow-x-auto">
                                                                    <div className="inline-block min-w-full align-middle">
                                                                        <div className="overflow-hidden border-2 border-blue-200/50 rounded-xl shadow-lg">
                                                                            <table className="min-w-full divide-y divide-blue-200" style={{ borderCollapse: 'collapse' }}>
                                                                                <thead className="bg-gradient-to-r from-slate-50 to-blue-50/30">
                                                                                    <tr>
                                                                                        <th className="px-3 py-3 text-center text-xs font-bold text-slate-700 border-r-2 border-blue-200/50 bg-gradient-to-br from-slate-100 to-blue-100/40 sticky left-0 z-10" style={{ minWidth: '50px', maxWidth: '50px' }}>
                                                                                            #
                                                                                        </th>
                                                                                        <th className="px-3 py-3 text-center text-xs font-bold text-slate-700 border-r-2 border-blue-200/50" style={{ minWidth: '80px', maxWidth: '80px' }}>
                                                                                            Actions
                                                                                        </th>
                                                                                        {Object.keys(sheet.preview[0]).filter(key => key !== '_id' && key !== '_rowNumber').map((header, idx) => (
                                                                                            <th key={idx} className="px-4 py-3 text-left text-xs font-bold text-slate-700 border-r-2 border-blue-200/50 bg-gradient-to-r from-slate-50 to-blue-50/20" style={{ minWidth: '120px' }}>
                                                                                                <div className="flex items-center gap-2">
                                                                                                    <div className="w-1.5 h-1.5 rounded-full bg-blue-400"></div>
                                                                                                    {header}
                                                                                                </div>
                                                                                            </th>
                                                                                        ))}
                                                                                    </tr>
                                                                                </thead>
                                                                                <tbody className="bg-white divide-y divide-blue-100">
                                                                                    {sheet.preview.slice(0, 100).map((row, rowIdx) => (
                                                                                        <tr key={rowIdx} className="hover:bg-blue-50/40 transition-all duration-200">
                                                                                            <td className="px-3 py-2 text-center border-r-2 border-blue-200/50 bg-slate-50/50 sticky left-0 z-10">
                                                                                                <span className="inline-block px-2 py-0.5 text-xs font-bold text-blue-700 bg-blue-50 rounded-md">
                                                                                                    {row._rowNumber || rowIdx + 1}
                                                                                                </span>
                                                                                            </td>
                                                                                            <td className="px-2 py-2 text-center border-r-2 border-blue-200/50 bg-white">
                                                                                                <button
                                                                                                    onClick={() => handleDeleteDocument(row._id, sheet.collectionName)}
                                                                                                    className="text-red-500 hover:text-red-700 hover:bg-red-50 px-2 py-1 rounded-lg transition-colors font-medium"
                                                                                                    title="Delete row"
                                                                        >
                                                                            <Trash2 className="h-3.5 w-3.5" />
                                                                        </button>
                                                                    </td>
                                                                    {Object.entries(row).filter(([key]) => key !== '_id' && key !== '_rowNumber').map(([field, value], cellIdx) => {
                                                                        const isEditing = editingCell?.rowIndex === rowIdx && editingCell?.field === field;
                                                                        return (
                                                                            <td key={cellIdx} className="border-r-2 border-blue-200/50 p-0">
                                                                                {isEditing ? (
                                                                                    <div className="flex items-center space-x-1 px-2 py-2 bg-blue-50/30">
                                                                                        <input
                                                                                            type="text"
                                                                                            value={editingCell.value ?? ''}
                                                                                            onChange={(e) => setEditingCell({ ...editingCell, value: e.target.value })}
                                                                                            className="w-full px-2 py-1.5 border-2 border-indigo-500 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                                                                                            autoFocus
                                                                                            onKeyDown={(e) => {
                                                                                                if (e.key === 'Enter') handleCellSave();
                                                                                                if (e.key === 'Escape') handleCellCancel();
                                                                                            }}
                                                                                        />
                                                                                        <button
                                                                                            onClick={handleCellSave}
                                                                                            disabled={savingCell}
                                                                                            className="text-emerald-600 hover:text-emerald-800 disabled:opacity-50 font-bold px-1.5 py-0.5 hover:bg-emerald-50 rounded"
                                                                                            title="Save (Enter)"
                                                                                        >
                                                                                            ✓
                                                                                        </button>
                                                                                        <button
                                                                                            onClick={handleCellCancel}
                                                                                            disabled={savingCell}
                                                                                            className="text-red-600 hover:text-red-800 disabled:opacity-50 font-bold px-1.5 py-0.5 hover:bg-red-50 rounded"
                                                                                            title="Cancel (Esc)"
                                                                                        >
                                                                                            ✕
                                                                                        </button>
                                                                                    </div>
                                                                                ) : (
                                                                                    <div
                                                                                        onClick={() => handleCellEdit(rowIdx, field, value)}
                                                                                        className="cursor-pointer hover:bg-blue-100/50 px-4 py-2.5 text-xs text-slate-700 min-h-[36px] flex items-center transition-colors"
                                                                                        title="Click to edit"
                                                                                    >
                                                                                        {value === '' || value === null || value === undefined ? (
                                                                                            <span className="text-slate-300 italic">empty</span>
                                                                                        ) : (
                                                                                            <span className="font-medium">{String(value)}</span>
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
                                                                    <div className="mt-4 flex items-center justify-between px-3 py-2 bg-gradient-to-r from-slate-50 to-blue-50/30 rounded-lg border border-blue-200/50">
                                                                        <div className="flex items-center gap-4">
                                                                            <span className="inline-flex items-center px-3 py-1 rounded-lg text-xs font-bold bg-gradient-to-r from-blue-50 to-indigo-50 text-blue-700 border border-blue-200/50">
                                                                                <div className="w-1.5 h-1.5 rounded-full bg-blue-500 mr-2"></div>
                                                                                Total Rows: {sheet.documentCount}
                                                                            </span>
                                                                            {sheet.preview.length > 100 && (
                                                                                <span className="inline-flex items-center px-3 py-1 rounded-lg text-xs font-bold bg-gradient-to-r from-emerald-50 to-teal-50 text-emerald-700 border border-emerald-200/50">
                                                                                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-2"></div>
                                                                                    Showing First 100
                                                                                </span>
                                                                            )}
                                                                        </div>
                                                                        <p className="text-xs text-indigo-600 font-medium italic">
                                                                            💡 Click any cell to edit
                                                                        </p>
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
                                        <div className="text-center py-12 bg-gradient-to-br from-slate-50 to-blue-50/30 rounded-xl border-2 border-dashed border-blue-200">
                                            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-blue-100 to-indigo-100 flex items-center justify-center">
                                                <FileSpreadsheet className="h-8 w-8 text-indigo-600" />
                                            </div>
                                            <h4 className="text-base font-bold text-slate-900 mb-2">No data uploaded yet</h4>
                                            <p className="text-sm text-slate-600">Upload Excel files to get started</p>
                                        </div>
                                    )}
                            </CardContent>
                        </Card>
                    </>
                ) : (
                    <Card className="border-2 border-red-200/50 bg-white/80 backdrop-blur-sm shadow-xl rounded-xl overflow-hidden">
                        <CardContent className="pt-8 pb-8">
                            <div className="text-center">
                                <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-gradient-to-br from-red-100 to-rose-100 flex items-center justify-center">
                                    <Store className="h-10 w-10 text-red-600" />
                                </div>
                                <h3 className="text-xl font-bold text-slate-900 mb-2">Business not found</h3>
                                <p className="text-slate-600 mb-6">The business you're looking for doesn't exist or you don't have access to it.</p>
                                <Button
                                    onClick={() => router.push('/businesses')}
                                    className="bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 text-white shadow-lg font-semibold"
                                >
                                    Back to Businesses
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                )}

            {/* Edit Business Modal */}
            {showEditModal && business && (
                <Dialog open={showEditModal} onOpenChange={setShowEditModal}>
                    <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-white border-2 border-indigo-200/50 shadow-2xl rounded-xl">
                        <DialogHeader>
                            <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">Edit Business</DialogTitle>
                            <DialogDescription className="text-slate-600">
                                Update your business information and settings.
                            </DialogDescription>
                        </DialogHeader>

                        <form onSubmit={handleEditBusiness} className="space-y-5">
                            <div className="space-y-2">
                                <Label htmlFor="edit-name" className="text-sm font-semibold text-slate-700">Business Name *</Label>
                                <Input
                                    id="edit-name"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    required
                                    maxLength={100}
                                    className="border-2 border-slate-200 focus:border-indigo-500 focus:ring-indigo-500"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="edit-description" className="text-sm font-semibold text-slate-700">Description</Label>
                                <Textarea
                                    id="edit-description"
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    rows={3}
                                    maxLength={500}
                                    className="border-2 border-slate-200 focus:border-indigo-500 focus:ring-indigo-500"
                                />
                            </div>
                            <DialogFooter className="gap-2">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={closeModals}
                                    className="border-2 border-slate-200 bg-white text-slate-700 hover:bg-slate-50 font-semibold"
                                >
                                    Cancel
                                </Button>
                                <Button
                                    type="submit"
                                    disabled={submitting}
                                    className="bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 text-white shadow-lg font-semibold"
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
            </main>
            </div>
        </div>
    );
}

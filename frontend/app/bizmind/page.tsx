'use client';

import { useRouter } from 'next/navigation';

export default function BizMindPage() {
    const router = useRouter();

    return (
        <div className="min-h-screen bg-gray-50">
            <nav className="bg-white shadow">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between h-16">
                        <div className="flex items-center">
                            <h1 className="text-xl font-semibold text-gray-900">BizMind</h1>
                        </div>
                        <div className="flex items-center">
                            <button
                                onClick={() => router.push('/dashboard')}
                                className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md text-sm font-medium"
                            >
                                Back to Dashboard
                            </button>
                        </div>
                    </div>
                </div>
            </nav>

            <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
                <div className="px-4 py-6 sm:px-0">
                    <div className="border-4 border-dashed border-gray-200 rounded-lg h-96 p-8">
                        <div className="text-center">
                            <h2 className="text-2xl font-bold text-gray-900 mb-4">
                                BizMind Page
                            </h2>
                            <p className="text-gray-600">
                                This is a dummy page for BizMind. Future features will be implemented here.
                            </p>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}

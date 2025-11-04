const express = require('express');
const multer = require('multer');
const mongoose = require('mongoose');
const XLSX = require('xlsx');
const Business = require('../models/Business');
const supabase = require('../config/supabase');
const router = express.Router();

// Configure multer for file uploads
const storage = multer.memoryStorage();
const upload = multer({
    storage: storage,
    limits: {
        fileSize: 10 * 1024 * 1024, // 10MB limit
    },
    fileFilter: (req, file, cb) => {
        // Accept only Excel files
        const allowedMimes = [
            'application/vnd.ms-excel',
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'application/vnd.ms-excel.sheet.macroEnabled.12'
        ];

        if (allowedMimes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error('Only Excel files are allowed'), false);
        }
    }
});

// Middleware to verify authentication
const authenticateToken = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({
                error: 'No valid token provided'
            });
        }

        const token = authHeader.substring(7);

        // Get user from token
        const { data: { user }, error } = await supabase.auth.getUser(token);

        if (error || !user) {
            return res.status(401).json({
                error: 'Invalid or expired token'
            });
        }

        req.user = user;
        next();
    } catch (error) {
        console.error('Authentication error:', error);
        res.status(500).json({
            error: 'Internal server error during authentication'
        });
    }
};

// Upload and process Excel files for a business
router.post('/businesses/:businessId/upload-excel', authenticateToken, upload.array('files', 10), async (req, res) => {
    try {
        const { businessId } = req.params;

        // Check if business exists and belongs to user
        const ownershipVerified = await Business.verifyOwnership(businessId, req.user.id);
        if (!ownershipVerified) {
            return res.status(403).json({
                error: 'Access denied'
            });
        }

        if (!req.files || req.files.length === 0) {
            return res.status(400).json({
                error: 'No files uploaded'
            });
        }

        const results = [];

        // Process each uploaded file
        for (const file of req.files) {
            try {
                // Parse Excel file
                const workbook = XLSX.read(file.buffer, { type: 'buffer' });

                // Process each sheet in the workbook
                const sheetResults = [];
                for (const sheetName of workbook.SheetNames) {
                    const worksheet = workbook.Sheets[sheetName];
                    const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

                    if (jsonData.length === 0) continue;

                    // Create collection name: businessId_sheetName
                    const collectionName = `${businessId}_${sheetName.replace(/[^a-zA-Z0-9_]/g, '_')}`;

                    // Convert array of arrays to array of objects
                    const headers = jsonData[0];
                    const rows = jsonData.slice(1);

                    const documents = rows.map(row => {
                        const doc = {};
                        headers.forEach((header, index) => {
                            doc[header] = row[index] || null;
                        });
                        return doc;
                    });

                    // Store in MongoDB
                    const db = mongoose.connection.db;
                    const collection = db.collection(collectionName);

                    // Clear existing data and insert new data
                    await collection.deleteMany({});
                    if (documents.length > 0) {
                        await collection.insertMany(documents);
                    }

                    sheetResults.push({
                        sheetName,
                        collectionName,
                        rowCount: documents.length,
                        headers: headers
                    });
                }

                results.push({
                    fileName: file.originalname,
                    sheets: sheetResults
                });

            } catch (fileError) {
                console.error(`Error processing file ${file.originalname}:`, fileError);
                results.push({
                    fileName: file.originalname,
                    error: fileError.message
                });
            }
        }

        res.json({
            message: 'Excel files processed successfully',
            results: results
        });

    } catch (error) {
        console.error('Error uploading Excel files:', error);
        res.status(500).json({
            error: 'Internal server error while processing Excel files'
        });
    }
});

// Get all collections/data for a business
router.get('/businesses/:businessId/data', authenticateToken, async (req, res) => {
    try {
        const { businessId } = req.params;

        // Check if business exists and belongs to user
        const ownershipVerified = await Business.verifyOwnership(businessId, req.user.id);
        if (!ownershipVerified) {
            return res.status(403).json({
                error: 'Access denied'
            });
        }

        const db = mongoose.connection.db;

        // Get all collections that start with businessId_
        const collections = await db.listCollections({
            name: new RegExp(`^${businessId}_`)
        }).toArray();

        const results = [];

        for (const collectionInfo of collections) {
            const collection = db.collection(collectionInfo.name);
            const documents = await collection.find({}).limit(100).toArray(); // Limit to 100 rows for preview

            // Extract sheet name from collection name
            const sheetName = collectionInfo.name.replace(`${businessId}_`, '');

            results.push({
                sheetName: sheetName,
                collectionName: collectionInfo.name,
                documentCount: await collection.countDocuments(),
                preview: documents
            });
        }

        res.json({
            businessId,
            collections: results
        });

    } catch (error) {
        console.error('Error fetching business data:', error);
        res.status(500).json({
            error: 'Internal server error while fetching business data'
        });
    }
});

// Delete all data for a business
router.delete('/businesses/:businessId/data', authenticateToken, async (req, res) => {
    try {
        const { businessId } = req.params;

        // Check if business exists and belongs to user
        const ownershipVerified = await Business.verifyOwnership(businessId, req.user.id);
        if (!ownershipVerified) {
            return res.status(403).json({
                error: 'Access denied'
            });
        }

        const db = mongoose.connection.db;

        // Get all collections that start with businessId_
        const collections = await db.listCollections({
            name: new RegExp(`^${businessId}_`)
        }).toArray();

        const deletedCollections = [];

        for (const collectionInfo of collections) {
            await db.dropCollection(collectionInfo.name);
            deletedCollections.push(collectionInfo.name);
        }

        res.json({
            message: 'Business data deleted successfully',
            deletedCollections: deletedCollections
        });

    } catch (error) {
        console.error('Error deleting business data:', error);
        res.status(500).json({
            error: 'Internal server error while deleting business data'
        });
    }
});

// Get all data from a specific collection
router.get('/businesses/:businessId/collections/:collectionName', authenticateToken, async (req, res) => {
    try {
        const { businessId, collectionName } = req.params;
        const { page = 1, limit = 50 } = req.query;

        // Check if business exists and belongs to user
        const ownershipVerified = await Business.verifyOwnership(businessId, req.user.id);
        if (!ownershipVerified) {
            return res.status(403).json({
                error: 'Access denied'
            });
        }

        // Validate collection name belongs to this business
        if (!collectionName.startsWith(`${businessId}_`)) {
            return res.status(403).json({
                error: 'Access denied to this collection'
            });
        }

        const db = mongoose.connection.db;
        const collection = db.collection(collectionName);

        const skip = (parseInt(page) - 1) * parseInt(limit);
        const documents = await collection.find({}).skip(skip).limit(parseInt(limit)).toArray();
        const totalDocuments = await collection.countDocuments();

        res.json({
            collectionName,
            documents,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                totalDocuments,
                totalPages: Math.ceil(totalDocuments / parseInt(limit))
            }
        });

    } catch (error) {
        console.error('Error fetching collection data:', error);
        res.status(500).json({
            error: 'Internal server error while fetching collection data'
        });
    }
});

// Update a document in a collection
router.put('/businesses/:businessId/collections/:collectionName/documents/:documentId', authenticateToken, async (req, res) => {
    try {
        const { businessId, collectionName, documentId } = req.params;
        const updateData = req.body;

        // Check if business exists and belongs to user
        const ownershipVerified = await Business.verifyOwnership(businessId, req.user.id);
        if (!ownershipVerified) {
            return res.status(403).json({
                error: 'Access denied'
            });
        }

        // Validate collection name belongs to this business
        if (!collectionName.startsWith(`${businessId}_`)) {
            return res.status(403).json({
                error: 'Access denied to this collection'
            });
        }

        const db = mongoose.connection.db;
        const collection = db.collection(collectionName);

        // Convert documentId to ObjectId if it's a valid ObjectId, otherwise use as string
        let query;
        if (mongoose.Types.ObjectId.isValid(documentId)) {
            query = { _id: new mongoose.Types.ObjectId(documentId) };
        } else {
            query = { _id: documentId };
        }

        const result = await collection.updateOne(query, { $set: updateData });

        if (result.matchedCount === 0) {
            return res.status(404).json({
                error: 'Document not found'
            });
        }

        res.json({
            message: 'Document updated successfully',
            modifiedCount: result.modifiedCount
        });

    } catch (error) {
        console.error('Error updating document:', error);
        res.status(500).json({
            error: 'Internal server error while updating document'
        });
    }
});

// Add a new document to a collection
router.post('/businesses/:businessId/collections/:collectionName/documents', authenticateToken, async (req, res) => {
    try {
        const { businessId, collectionName } = req.params;
        const documentData = req.body;

        // Check if business exists and belongs to user
        const ownershipVerified = await Business.verifyOwnership(businessId, req.user.id);
        if (!ownershipVerified) {
            return res.status(403).json({
                error: 'Access denied'
            });
        }

        // Validate collection name belongs to this business
        if (!collectionName.startsWith(`${businessId}_`)) {
            return res.status(403).json({
                error: 'Access denied to this collection'
            });
        }

        const db = mongoose.connection.db;
        const collection = db.collection(collectionName);

        const result = await collection.insertOne(documentData);

        res.status(201).json({
            message: 'Document added successfully',
            insertedId: result.insertedId
        });

    } catch (error) {
        console.error('Error adding document:', error);
        res.status(500).json({
            error: 'Internal server error while adding document'
        });
    }
});

// Delete a document from a collection
router.delete('/businesses/:businessId/collections/:collectionName/documents/:documentId', authenticateToken, async (req, res) => {
    try {
        const { businessId, collectionName, documentId } = req.params;

        // Check if business exists and belongs to user
        const ownershipVerified = await Business.verifyOwnership(businessId, req.user.id);
        if (!ownershipVerified) {
            return res.status(403).json({
                error: 'Access denied'
            });
        }

        // Validate collection name belongs to this business
        if (!collectionName.startsWith(`${businessId}_`)) {
            return res.status(403).json({
                error: 'Access denied to this collection'
            });
        }

        const db = mongoose.connection.db;
        const collection = db.collection(collectionName);

        // Convert documentId to ObjectId if it's a valid ObjectId, otherwise use as string
        let query;
        if (mongoose.Types.ObjectId.isValid(documentId)) {
            query = { _id: new mongoose.Types.ObjectId(documentId) };
        } else {
            query = { _id: documentId };
        }

        const result = await collection.deleteOne(query);

        if (result.deletedCount === 0) {
            return res.status(404).json({
                error: 'Document not found'
            });
        }

        res.json({
            message: 'Document deleted successfully',
            deletedCount: result.deletedCount
        });

    } catch (error) {
        console.error('Error deleting document:', error);
        res.status(500).json({
            error: 'Internal server error while deleting document'
        });
    }
});

// Delete an entire collection
router.delete('/businesses/:businessId/collections/:collectionName', authenticateToken, async (req, res) => {
    try {
        const { businessId, collectionName } = req.params;

        // Check if business exists and belongs to user
        const ownershipVerified = await Business.verifyOwnership(businessId, req.user.id);
        if (!ownershipVerified) {
            return res.status(403).json({
                error: 'Access denied'
            });
        }

        // Validate collection name belongs to this business
        if (!collectionName.startsWith(`${businessId}_`)) {
            return res.status(403).json({
                error: 'Access denied to this collection'
            });
        }

        const db = mongoose.connection.db;
        await db.dropCollection(collectionName);

        res.json({
            message: 'Collection deleted successfully'
        });

    } catch (error) {
        console.error('Error deleting collection:', error);
        res.status(500).json({
            error: 'Internal server error while deleting collection'
        });
    }
});

module.exports = router;
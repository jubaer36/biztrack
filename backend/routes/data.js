const express = require('express');
const multer = require('multer');
const mongoose = require('mongoose');
const XLSX = require('xlsx');
const Business = require('../models/Business');
const { supabase, supabaseAdmin } = require('../config/supabase');
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
                    // Parse with defval to keep empty cells as empty strings
                    const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '' });

                    if (jsonData.length === 0) continue;

                    // Create collection name: businessId_sheetName
                    const collectionName = `${businessId}_${sheetName.replace(/[^a-zA-Z0-9_]/g, '_')}`;

                    // Get headers from first row - keep exactly as in Excel
                    const headers = jsonData[0].map((h, idx) => {
                        const headerStr = String(h || '').trim();
                        // If header is empty, use column letter (A, B, C, etc.)
                        return headerStr || `Column_${String.fromCharCode(65 + idx)}`;
                    });
                    
                    if (headers.length === 0) continue; // Skip if no columns
                    
                    const rows = jsonData.slice(1);

                    // Filter out ONLY completely empty rows (all columns are empty)
                    const documents = rows
                        .filter(row => {
                            // Check if ALL columns are empty - if so, skip this row
                            const allEmpty = row.every(cell => 
                                cell === null || 
                                cell === undefined || 
                                String(cell).trim() === ''
                            );
                            return !allEmpty; // Keep row if at least one column has data
                        })
                        .map((row, rowIndex) => {
                            const doc = {
                                _rowNumber: rowIndex + 2 // Store original row number from Excel (1-indexed, +1 for header)
                            };
                            headers.forEach((header, index) => {
                                const value = row[index];
                                // Store exactly as in Excel - empty cells as empty string, preserve all values
                                if (value === null || value === undefined) {
                                    doc[header] = '';
                                } else if (typeof value === 'number') {
                                    doc[header] = value; // Keep numbers as numbers
                                } else {
                                    doc[header] = String(value); // Convert to string but preserve content
                                }
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

// Get all PostgreSQL tables/data for a business
router.get('/businesses/:businessId/postgres-data', authenticateToken, async (req, res) => {
    try {
        const { businessId } = req.params;

        // Check if business exists and belongs to user
        const ownershipVerified = await Business.verifyOwnership(businessId, req.user.id);
        if (!ownershipVerified) {
            return res.status(403).json({
                error: 'Access denied'
            });
        }

        // Define the tables we want to fetch data from
        const tables = [
            'product_category',
            'product_brand', 
            'supplier',
            'customer',
            'investor',
            'investment',
            'investors_capital',
            'product',
            'purchase_order',
            'purchase_order_items',
            'sales_order',
            'sales_order_items'
        ];

        const results = [];

        for (const tableName of tables) {
            try {
                // Fetch data from Supabase PostgreSQL
                const { data, error } = await supabaseAdmin
                    .from(tableName)
                    .select('*')
                    .eq('business_id', businessId)
                    .limit(100); // Limit to 100 rows for preview

                if (error) {
                    console.error(`Error fetching from ${tableName}:`, error);
                    continue; // Skip this table if there's an error
                }

                if (data && data.length > 0) {
                    // Get column names from the first row
                    const columns = data.length > 0 ? Object.keys(data[0]) : [];
                    
                    results.push({
                        table_name: tableName,
                        record_count: data.length,
                        columns: columns,
                        sample_data: data.slice(0, 10) // Return first 10 rows as sample
                    });
                }
            } catch (tableError) {
                console.error(`Error processing table ${tableName}:`, tableError);
                // Continue with other tables
            }
        }

        res.json({
            businessId,
            tables: results
        });

    } catch (error) {
        console.error('Error fetching PostgreSQL business data:', error);
        res.status(500).json({
            error: 'Internal server error while fetching PostgreSQL business data'
        });
    }
});

// Get all data from a specific PostgreSQL table
router.get('/businesses/:businessId/postgres-tables/:tableName', authenticateToken, async (req, res) => {
    try {
        const { businessId, tableName } = req.params;
        const { page = 1, limit = 50 } = req.query;

        // Check if business exists and belongs to user
        const ownershipVerified = await Business.verifyOwnership(businessId, req.user.id);
        if (!ownershipVerified) {
            return res.status(403).json({
                error: 'Access denied'
            });
        }

        // Validate table name is allowed
        const allowedTables = [
            'product_category', 'product_brand', 'supplier', 'customer', 'investor',
            'investment', 'investors_capital', 'product', 'purchase_order', 
            'purchase_order_items', 'sales_order', 'sales_order_items'
        ];

        if (!allowedTables.includes(tableName)) {
            return res.status(400).json({
                error: 'Invalid table name'
            });
        }

        const from = (parseInt(page) - 1) * parseInt(limit);
        const to = from + parseInt(limit) - 1;

        // Fetch data from Supabase PostgreSQL with pagination
        const { data, error, count } = await supabaseAdmin
            .from(tableName)
            .select('*', { count: 'exact' })
            .eq('business_id', businessId)
            .range(from, to);

        if (error) {
            return res.status(500).json({
                error: `Error fetching from table ${tableName}: ${error.message}`
            });
        }

        res.json({
            tableName,
            documents: data || [],
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                totalDocuments: count || 0,
                totalPages: Math.ceil((count || 0) / parseInt(limit))
            }
        });

    } catch (error) {
        console.error('Error fetching PostgreSQL table data:', error);
        res.status(500).json({
            error: 'Internal server error while fetching PostgreSQL table data'
        });
    }
});

// Update a record in a PostgreSQL table
router.put('/businesses/:businessId/postgres-tables/:tableName/records/:recordId', authenticateToken, async (req, res) => {
    try {
        const { businessId, tableName, recordId } = req.params;
        const updateData = req.body;

        // Check if business exists and belongs to user
        const ownershipVerified = await Business.verifyOwnership(businessId, req.user.id);
        if (!ownershipVerified) {
            return res.status(403).json({
                error: 'Access denied'
            });
        }

        // Validate table name is allowed
        const allowedTables = [
            'product_category', 'product_brand', 'supplier', 'customer', 'investor',
            'investment', 'investors_capital', 'product', 'purchase_order', 
            'purchase_order_items', 'sales_order', 'sales_order_items'
        ];

        if (!allowedTables.includes(tableName)) {
            return res.status(400).json({
                error: 'Invalid table name'
            });
        }

        // Remove business_id from updateData if present (shouldn't be updated)
        delete updateData.business_id;

        // Determine primary key column based on table
        let primaryKeyColumn = 'id'; // Default
        if (tableName === 'product') {
            primaryKeyColumn = 'product_id';
        } else if (tableName === 'purchase_order_items' || tableName === 'sales_order_items') {
            // Composite primary key - need special handling
            return res.status(400).json({
                error: 'Composite primary key tables not supported for updates yet'
            });
        } else {
            // Most tables use auto-incrementing IDs
            primaryKeyColumn = tableName.replace('_', '') + '_id';
        }

        // Update record in Supabase PostgreSQL
        const { data, error } = await supabaseAdmin
            .from(tableName)
            .update(updateData)
            .eq(primaryKeyColumn, recordId)
            .eq('business_id', businessId) // Extra security check
            .select();

        if (error) {
            return res.status(500).json({
                error: `Error updating record in ${tableName}: ${error.message}`
            });
        }

        if (!data || data.length === 0) {
            return res.status(404).json({
                error: 'Record not found or no changes made'
            });
        }

        res.json({
            message: 'Record updated successfully',
            updatedRecord: data[0]
        });

    } catch (error) {
        console.error('Error updating PostgreSQL record:', error);
        res.status(500).json({
            error: 'Internal server error while updating PostgreSQL record'
        });
    }
});

// Delete a record from a PostgreSQL table
router.delete('/businesses/:businessId/postgres-tables/:tableName/records/:recordId', authenticateToken, async (req, res) => {
    try {
        const { businessId, tableName, recordId } = req.params;

        // Check if business exists and belongs to user
        const ownershipVerified = await Business.verifyOwnership(businessId, req.user.id);
        if (!ownershipVerified) {
            return res.status(403).json({
                error: 'Access denied'
            });
        }

        // Validate table name is allowed
        const allowedTables = [
            'product_category', 'product_brand', 'supplier', 'customer', 'investor',
            'investment', 'investors_capital', 'product', 'purchase_order', 
            'purchase_order_items', 'sales_order', 'sales_order_items'
        ];

        if (!allowedTables.includes(tableName)) {
            return res.status(400).json({
                error: 'Invalid table name'
            });
        }

        // Determine primary key column based on table
        let primaryKeyColumn = 'id'; // Default
        if (tableName === 'product') {
            primaryKeyColumn = 'product_id';
        } else if (tableName === 'purchase_order_items' || tableName === 'sales_order_items') {
            // Composite primary key - need special handling
            return res.status(400).json({
                error: 'Composite primary key tables not supported for deletion yet'
            });
        } else {
            // Most tables use auto-incrementing IDs
            primaryKeyColumn = tableName.replace('_', '') + '_id';
        }

        // Delete record from Supabase PostgreSQL
        const { data, error } = await supabaseAdmin
            .from(tableName)
            .delete()
            .eq(primaryKeyColumn, recordId)
            .eq('business_id', businessId) // Extra security check
            .select();

        if (error) {
            return res.status(500).json({
                error: `Error deleting record from ${tableName}: ${error.message}`
            });
        }

        res.json({
            message: 'Record deleted successfully',
            deletedRecord: data[0] || null
        });

    } catch (error) {
        console.error('Error deleting PostgreSQL record:', error);
        res.status(500).json({
            error: 'Internal server error while deleting PostgreSQL record'
        });
    }
});

module.exports = router;
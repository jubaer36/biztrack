const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { authenticateUser } = require('../middleware/auth');
const { processAndStoreFile } = require('./rag');

const router = express.Router();

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configure multer storage with user-specific folders
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        // Create user-specific folder based on email
        const userEmail = req.user.email;
        const userFolder = path.join(uploadsDir, userEmail.replace(/[@.]/g, '_')); // Replace @ and . with _

        // Ensure user folder exists
        if (!fs.existsSync(userFolder)) {
            fs.mkdirSync(userFolder, { recursive: true });
        }

        cb(null, userFolder);
    },
    filename: (req, file, cb) => {
        // Use original filename but handle conflicts
        let filename = file.originalname;
        const userEmail = req.user.email;
        const userFolder = path.join(uploadsDir, userEmail.replace(/[@.]/g, '_'));
        const filePath = path.join(userFolder, filename);

        // If file already exists, add a suffix
        let counter = 1;
        const name = path.parse(filename).name;
        const ext = path.parse(filename).ext;

        while (fs.existsSync(filePath)) {
            filename = `${name}(${counter})${ext}`;
            counter++;
        }

        cb(null, filename);
    }
});

// File filter to allow only certain file types
const fileFilter = (req, file, cb) => {
    const allowedTypes = [
        'image/jpeg',
        'image/png',
        'image/gif',
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'text/plain',
        'text/csv'
    ];

    if (allowedTypes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error('Invalid file type. Only images, PDFs, documents, and text files are allowed.'), false);
    }
};

// Configure multer upload
const upload = multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: {
        fileSize: 10 * 1024 * 1024 // 10MB limit
    }
});

// Upload single file
router.post('/single', authenticateUser, upload.single('file'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }

        // Process the uploaded file with RAG system
        try {
            await processAndStoreFile(
                req.file.path, 
                req.file.mimetype, 
                req.file.filename,
                req.user.id,
                req.user.email
            );
            console.log('File successfully processed and stored in ChromaDB');
        } catch (processingError) {
            console.error('RAG processing error:', processingError);
            // Don't fail the upload if processing fails, just log it
        }

        res.json({
            message: 'File uploaded and processed successfully',
            file: {
                filename: req.file.filename,
                originalname: req.file.originalname,
                mimetype: req.file.mimetype,
                size: req.file.size,
                path: req.file.path,
                userEmail: req.user.email,
                userId: req.user.id
            }
        });
    } catch (error) {
        console.error('Upload error:', error);
        res.status(500).json({ error: 'File upload failed' });
    }
});

// Upload multiple files
router.post('/multiple', authenticateUser, upload.array('files', 5), (req, res) => {
    try {
        if (!req.files || req.files.length === 0) {
            return res.status(400).json({ error: 'No files uploaded' });
        }

        const files = req.files.map(file => ({
            filename: file.filename,
            originalname: file.originalname,
            mimetype: file.mimetype,
            size: file.size,
            path: file.path,
            userEmail: req.user.email,
            userId: req.user.id
        }));

        res.json({
            message: 'Files uploaded successfully',
            files: files
        });
    } catch (error) {
        console.error('Upload error:', error);
        res.status(500).json({ error: 'File upload failed' });
    }
});

// Get list of uploaded files
router.get('/files', authenticateUser, (req, res) => {
    try {
        const userEmail = req.user.email;
        const userFolder = path.join(uploadsDir, userEmail.replace(/[@.]/g, '_'));

        // Ensure user folder exists
        if (!fs.existsSync(userFolder)) {
            return res.json({ files: [] });
        }

        const files = fs.readdirSync(userFolder).map(filename => {
            const filePath = path.join(userFolder, filename);
            const stats = fs.statSync(filePath);
            return {
                filename,
                size: stats.size,
                createdAt: stats.birthtime,
                modifiedAt: stats.mtime,
                userEmail: req.user.email,
                userId: req.user.id
            };
        });

        res.json({ files });
    } catch (error) {
        console.error('Error listing files:', error);
        res.status(500).json({ error: 'Failed to list files' });
    }
});

// Download file
router.get('/download/:filename', authenticateUser, (req, res) => {
    try {
        const filename = req.params.filename;
        const userEmail = req.user.email;
        const userFolder = path.join(uploadsDir, userEmail.replace(/[@.]/g, '_'));
        const filePath = path.join(userFolder, filename);

        if (!fs.existsSync(filePath)) {
            return res.status(404).json({ error: 'File not found' });
        }

        res.download(filePath);
    } catch (error) {
        console.error('Download error:', error);
        res.status(500).json({ error: 'Download failed' });
    }
});

// Delete file
router.delete('/files/:filename', authenticateUser, (req, res) => {
    try {
        const filename = req.params.filename;
        const userEmail = req.user.email;
        const userFolder = path.join(uploadsDir, userEmail.replace(/[@.]/g, '_'));
        const filePath = path.join(userFolder, filename);

        if (!fs.existsSync(filePath)) {
            return res.status(404).json({ error: 'File not found' });
        }

        fs.unlinkSync(filePath);
        res.json({ message: 'File deleted successfully' });
    } catch (error) {
        console.error('Delete error:', error);
        res.status(500).json({ error: 'Delete failed' });
    }
});

module.exports = router;

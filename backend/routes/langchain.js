const express = require('express');
const fs = require('fs');
const path = require('path');
const { RecursiveCharacterTextSplitter } = require('@langchain/textsplitters');
const pdfParse = require('pdf-parse');
const { authenticateUser } = require('../middleware/auth');

const router = express.Router();

// Function to load and extract text from different file types
async function loadFileContent(filePath, mimeType) {
    try {
        if (mimeType === 'application/pdf') {
            // Handle PDF files
            const dataBuffer = fs.readFileSync(filePath);
            const data = await pdfParse(dataBuffer);
            return data.text;
        } else if (mimeType.startsWith('text/') ||
                   mimeType === 'application/json' ||
                   mimeType === 'application/csv') {
            // Handle text-based files
            return fs.readFileSync(filePath, 'utf-8');
        } else {
            // For other file types, try to read as text or return empty string
            try {
                return fs.readFileSync(filePath, 'utf-8');
            } catch (error) {
                console.warn(`Could not read file as text: ${filePath}`);
                return '';
            }
        }
    } catch (error) {
        console.error(`Error loading file ${filePath}:`, error);
        throw error;
    }
}

// Function to split text into chunks and log them
async function processFileIntoChunks(filePath, mimeType, filename) {
    try {
        console.log(`\n=== Processing file: ${filename} ===`);
        console.log(`File path: ${filePath}`);
        console.log(`MIME type: ${mimeType}`);

        // Load file content
        const text = await loadFileContent(filePath, mimeType);
        console.log(`\n--- File Content Preview ---`);
        console.log(text.substring(0, 500) + (text.length > 500 ? '...' : ''));

        // Create text splitter
        const splitter = new RecursiveCharacterTextSplitter({
            chunkSize: 1000, // Characters per chunk
            chunkOverlap: 200, // Overlap between chunks
            separators: ["\n\n", "\n", " ", ""] // Split on paragraphs, lines, words, characters
        });

        // Split text into chunks
        const chunks = await splitter.splitText(text);

        console.log(`\n--- Text Splitting Results ---`);
        console.log(`Total chunks created: ${chunks.length}`);
        console.log(`Original text length: ${text.length} characters`);

        // Log each chunk
        chunks.forEach((chunk, index) => {
            console.log(`\n--- Chunk ${index + 1}/${chunks.length} ---`);
            console.log(`Length: ${chunk.length} characters`);
            console.log(`Content: ${chunk}`);
        });

        console.log(`\n=== Finished processing ${filename} ===\n`);

        return {
            filename,
            totalChunks: chunks.length,
            originalLength: text.length,
            chunks: chunks
        };

    } catch (error) {
        console.error(`Error processing file ${filename}:`, error);
        throw error;
    }
}

// Endpoint to process a specific uploaded file
router.post('/process-file/:filename', authenticateUser, async (req, res) => {
    try {
        const { filename } = req.params;
        const userEmail = req.user.email;
        const uploadsDir = path.join(__dirname, '../uploads');
        const userFolder = path.join(uploadsDir, userEmail.replace(/[@.]/g, '_'));
        const filePath = path.join(userFolder, filename);

        // Check if file exists
        if (!fs.existsSync(filePath)) {
            return res.status(404).json({ error: 'File not found' });
        }

        // Get file stats to determine mime type
        const stats = fs.statSync(filePath);
        const mimeType = getMimeType(filename);

        // Process the file
        const result = await processFileIntoChunks(filePath, mimeType, filename);

        res.json({
            message: 'File processed successfully',
            result: result
        });

    } catch (error) {
        console.error('Error processing file:', error);
        res.status(500).json({ error: 'File processing failed' });
    }
});

// Helper function to determine MIME type from filename
function getMimeType(filename) {
    const ext = path.extname(filename).toLowerCase();
    const mimeTypes = {
        '.pdf': 'application/pdf',
        '.txt': 'text/plain',
        '.csv': 'text/csv',
        '.json': 'application/json',
        '.doc': 'application/msword',
        '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        '.xls': 'application/vnd.ms-excel',
        '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        '.jpg': 'image/jpeg',
        '.jpeg': 'image/jpeg',
        '.png': 'image/png',
        '.gif': 'image/gif'
    };

    return mimeTypes[ext] || 'application/octet-stream';
}

module.exports = {
    router,
    processFileIntoChunks
};

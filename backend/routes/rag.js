const express = require('express');
const fs = require('fs');
const path = require('path');
const { ChatGroq } = require('@langchain/groq');
const { RecursiveCharacterTextSplitter } = require('@langchain/textsplitters');
const { authenticateUser } = require('../middleware/auth');
const pdfParse = require('pdf-parse');

const router = express.Router();

// Initialize Groq API
const GROQ_API_KEY = process.env.GROQ_API_KEY;

// In-memory vector store (simple JSON-based storage)
const vectorStoreDir = path.join(__dirname, '../vector_store');
if (!fs.existsSync(vectorStoreDir)) {
    fs.mkdirSync(vectorStoreDir, { recursive: true });
}

// Helper function to get user's vector store file
function getUserVectorStorePath(userEmail) {
    const sanitizedEmail = userEmail.replace(/[@.]/g, '_');
    return path.join(vectorStoreDir, `${sanitizedEmail}.json`);
}

// Load user's vector store
function loadVectorStore(userEmail) {
    const storePath = getUserVectorStorePath(userEmail);
    if (fs.existsSync(storePath)) {
        return JSON.parse(fs.readFileSync(storePath, 'utf-8'));
    }
    return { documents: [], metadata: [] };
}

// Save user's vector store
function saveVectorStore(userEmail, store) {
    const storePath = getUserVectorStorePath(userEmail);
    fs.writeFileSync(storePath, JSON.stringify(store, null, 2));
}

// Simple text similarity function (cosine similarity on character frequency)
function calculateSimilarity(text1, text2) {
    const getCharFreq = (text) => {
        const freq = {};
        const normalizedText = text.toLowerCase();
        for (const char of normalizedText) {
            freq[char] = (freq[char] || 0) + 1;
        }
        return freq;
    };

    const freq1 = getCharFreq(text1);
    const freq2 = getCharFreq(text2);
    
    const allChars = new Set([...Object.keys(freq1), ...Object.keys(freq2)]);
    
    let dotProduct = 0;
    let mag1 = 0;
    let mag2 = 0;
    
    for (const char of allChars) {
        const f1 = freq1[char] || 0;
        const f2 = freq2[char] || 0;
        dotProduct += f1 * f2;
        mag1 += f1 * f1;
        mag2 += f2 * f2;
    }
    
    if (mag1 === 0 || mag2 === 0) return 0;
    return dotProduct / (Math.sqrt(mag1) * Math.sqrt(mag2));
}

// Function to load and extract text from different file types
async function loadFileContent(filePath, mimeType) {
    try {
        if (mimeType === 'application/pdf') {
            const dataBuffer = fs.readFileSync(filePath);
            const data = await pdfParse(dataBuffer);
            return data.text;
        } else if (mimeType.startsWith('text/') ||
                   mimeType === 'application/json' ||
                   mimeType === 'text/csv') {
            return fs.readFileSync(filePath, 'utf-8');
        } else {
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

// Function to process file and store in vector store
async function processAndStoreFile(filePath, mimeType, filename, userId, userEmail) {
    try {
        console.log(`\n=== Processing file: ${filename} for user: ${userEmail} ===`);

        // Load file content
        const text = await loadFileContent(filePath, mimeType);
        console.log(`File content length: ${text.length} characters`);

        // Create text splitter
        const splitter = new RecursiveCharacterTextSplitter({
            chunkSize: 1000,
            chunkOverlap: 200,
            separators: ["\n\n", "\n", " ", ""]
        });

        // Split text into chunks
        const chunks = await splitter.splitText(text);
        console.log(`Created ${chunks.length} chunks`);

        // Load existing vector store
        const store = loadVectorStore(userEmail);

        // Add new chunks to store
        chunks.forEach((chunk, index) => {
            store.documents.push(chunk);
            store.metadata.push({
                filename: filename,
                chunkIndex: index,
                totalChunks: chunks.length,
                userId: userId,
                userEmail: userEmail,
                mimeType: mimeType,
                uploadDate: new Date().toISOString()
            });
        });

        // Save updated store
        saveVectorStore(userEmail, store);

        console.log(`Successfully stored ${chunks.length} chunks in vector store`);
        console.log(`Total documents in store: ${store.documents.length}`);

        return {
            filename,
            totalChunks: chunks.length,
            originalLength: text.length,
            totalDocuments: store.documents.length
        };

    } catch (error) {
        console.error(`Error processing file ${filename}:`, error);
        throw error;
    }
}

// Endpoint to query the RAG system
router.post('/query', authenticateUser, async (req, res) => {
    try {
        const { question, filename } = req.body;
        const userEmail = req.user.email;

        if (!question) {
            return res.status(400).json({ error: 'Question is required' });
        }

        console.log(`\n=== Processing query from user: ${userEmail} ===`);
        console.log(`Question: ${question}`);

        // Load user's vector store
        const store = loadVectorStore(userEmail);

        if (store.documents.length === 0) {
            return res.status(404).json({ 
                error: 'No documents found. Please upload documents first.' 
            });
        }

        console.log(`Found ${store.documents.length} total chunks in store`);

        // Filter by filename if specified
        let relevantDocs = store.documents.map((doc, idx) => ({ doc, metadata: store.metadata[idx], idx }));
        
        if (filename) {
            relevantDocs = relevantDocs.filter(item => item.metadata.filename === filename);
            console.log(`Filtered to ${relevantDocs.length} chunks from file: ${filename}`);
        }

        if (relevantDocs.length === 0) {
            return res.status(404).json({ 
                error: filename ? `No documents found for file: ${filename}` : 'No documents found' 
            });
        }

        // Calculate similarity scores
        const scoredDocs = relevantDocs.map(item => ({
            ...item,
            score: calculateSimilarity(question, item.doc)
        }));

        // Sort by similarity and take top 5
        scoredDocs.sort((a, b) => b.score - a.score);
        const topDocs = scoredDocs.slice(0, 5);

        console.log(`Top similarity scores: ${topDocs.map(d => d.score.toFixed(3)).join(', ')}`);

        // Combine relevant chunks as context
        const context = topDocs.map(item => item.doc).join('\n\n');
        const sources = topDocs.map(item => item.metadata);

        // Initialize Groq LLM
        const llm = new ChatGroq({
            apiKey: GROQ_API_KEY,
            model: 'llama-3.3-70b-specdec', // Using latest supported model
            temperature: 0.7,
        });

        // Create prompt with context
        const prompt = `You are a helpful AI assistant analyzing business documents. Use the following context from the uploaded documents to answer the question. If the answer cannot be found in the context, say so.

Context:
${context}

Question: ${question}

Answer:`;

        console.log('Sending request to Groq...');

        // Get response from Groq
        const response = await llm.invoke(prompt);
        const answer = response.content;

        console.log(`Generated answer length: ${answer.length} characters`);

        res.json({
            question,
            answer,
            sources,
            chunksUsed: topDocs.length
        });

    } catch (error) {
        console.error('Error processing query:', error);
        res.status(500).json({ error: 'Query processing failed: ' + error.message });
    }
});

// Endpoint to get all documents in user's collection
router.get('/documents', authenticateUser, async (req, res) => {
    try {
        const userEmail = req.user.email;

        // Load user's vector store
        const store = loadVectorStore(userEmail);

        // Extract unique filenames
        const filenames = [...new Set(store.metadata.map(m => m.filename))];

        res.json({
            totalChunks: store.documents.length,
            files: filenames,
            documents: store.metadata
        });

    } catch (error) {
        console.error('Error fetching documents:', error);
        res.status(500).json({ error: 'Failed to fetch documents' });
    }
});

// Endpoint to delete a specific document from collection
router.delete('/documents/:filename', authenticateUser, async (req, res) => {
    try {
        const { filename } = req.params;
        const userEmail = req.user.email;

        // Load user's vector store
        const store = loadVectorStore(userEmail);

        // Filter out all chunks from this file
        const initialCount = store.documents.length;
        const filteredDocs = [];
        const filteredMetadata = [];

        for (let i = 0; i < store.documents.length; i++) {
            if (store.metadata[i].filename !== filename) {
                filteredDocs.push(store.documents[i]);
                filteredMetadata.push(store.metadata[i]);
            }
        }

        store.documents = filteredDocs;
        store.metadata = filteredMetadata;

        // Save updated store
        saveVectorStore(userEmail, store);

        const chunksDeleted = initialCount - filteredDocs.length;

        res.json({
            message: 'Document deleted from RAG system',
            chunksDeleted: chunksDeleted
        });

    } catch (error) {
        console.error('Error deleting document:', error);
        res.status(500).json({ error: 'Failed to delete document' });
    }
});

module.exports = {
    router,
    processAndStoreFile
};

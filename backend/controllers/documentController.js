const mongoose = require('mongoose');
const pdfParse = require('pdf-parse');
const Document = require('../models/Document');
const DocumentChunk = require('../models/DocumentChunk');
const db = require('../db');
const embeddingService = require('../services/embedding.service');
require('dotenv').config();

const MONGODB_URI = process.env.MONGODB_URI || '';
const isMongoPlaceholder = !MONGODB_URI || MONGODB_URI.includes('cluster0.xxxxx.mongodb.net');
const useMongo = !isMongoPlaceholder;

// Helper to split text into overlapping chunks
const chunkText = (text, size = 800, overlap = 150) => {
  const chunks = [];
  let start = 0;
  
  // Clean up white space first
  const cleanedText = text.replace(/\s+/g, ' ').trim();
  
  while (start < cleanedText.length) {
    let end = start + size;
    if (end > cleanedText.length) {
      end = cleanedText.length;
    }
    
    chunks.push({
      text: cleanedText.substring(start, end),
      pageNumber: 1 // pdf-parse default
    });
    
    if (end === cleanedText.length) break;
    start += (size - overlap);
  }
  return chunks;
};

// Calculate dot product (cosine similarity since embedding service outputs normalized unit vectors)
const dotProduct = (a, b) => {
  if (!a || !b || a.length !== b.length) return 0;
  let sum = 0;
  for (let i = 0; i < a.length; i++) {
    sum += a[i] * b[i];
  }
  return sum;
};

// 1. Upload and Process PDF (POST /api/documents/upload)
exports.uploadDocument = async (req, res) => {
  const userId = req.user.id;

  if (!req.file) {
    return res.status(400).json({ success: false, message: 'Please upload a PDF document.' });
  }

  if (req.file.mimetype !== 'application/pdf') {
    return res.status(400).json({ success: false, message: 'Only PDF documents are allowed.' });
  }

  try {
    console.log(`Parsing PDF file: ${req.file.originalname} (${req.file.size} bytes)...`);
    
    // Parse PDF text
    let pdfText = '';
    try {
      const parsedPdf = await pdfParse(req.file.buffer);
      pdfText = parsedPdf.text || '';
    } catch (parseError) {
      console.warn('⚠️ PDF parsing library failed. Trying direct text stream extraction fallback:', parseError.message);
      
      // Fallback: extract ASCII text from stream objects
      const rawString = req.file.buffer.toString('binary');
      
      // Look for PDF text parenthesis blocks e.g. (text) Tj or (text)'
      const matches = rawString.match(/\(([^)]+)\)\s*(?:Tj|')/g);
      if (matches) {
        pdfText = matches.map(m => {
          const contentMatch = m.match(/\(([^)]+)\)/);
          return contentMatch ? contentMatch[1] : '';
        }).join(' ');
      } else {
        // Alternative fallback: strip out binary characters and extract printable sequences
        const cleanText = rawString.replace(/[^\x20-\x7E\s]/g, ' ');
        pdfText = cleanText.replace(/\s+/g, ' ').trim();
      }
    }
    
    if (!pdfText.trim()) {
      return res.status(400).json({ 
        success: false, 
        message: 'The uploaded PDF appears to be empty or contains no extractable text.' 
      });
    }

    // Split text into chunks
    const chunks = chunkText(pdfText);
    const chunkCount = chunks.length;
    console.log(`Split text into ${chunkCount} chunks. Generating embeddings...`);

    // Generate embeddings for all chunks
    const embeddings = [];
    for (let i = 0; i < chunks.length; i++) {
      const vector = await embeddingService.generateEmbedding(chunks[i].text);
      embeddings.push(vector);
    }

    let documentObj = null;

    if (useMongo) {
      // Save Document Metadata
      const newDoc = new Document({
        userId,
        filename: req.file.originalname,
        fileSize: req.file.size,
        chunkCount
      });
      documentObj = await newDoc.save();

      // Save Chunks
      const chunkDocs = chunks.map((c, i) => new DocumentChunk({
        documentId: documentObj._id,
        userId,
        text: c.text,
        embedding: embeddings[i],
        pageNumber: c.pageNumber
      }));
      
      await DocumentChunk.insertMany(chunkDocs);
    } else {
      // Fallback Local Storage
      documentObj = db.createDocument({
        userId,
        filename: req.file.originalname,
        fileSize: req.file.size,
        chunkCount
      });

      for (let i = 0; i < chunks.length; i++) {
        db.createChunk({
          documentId: documentObj._id,
          userId,
          text: chunks[i].text,
          embedding: embeddings[i],
          pageNumber: chunks[i].pageNumber
        });
      }
    }

    console.log(`Successfully processed and saved document: ${req.file.originalname}`);

    return res.status(201).json({
      success: true,
      message: 'Document uploaded and indexed successfully.',
      document: documentObj
    });
  } catch (error) {
    console.error('Error uploading/processing document:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Server error occurred during document parsing and vector indexing.' 
    });
  }
};

// 2. Get User Documents (GET /api/documents)
exports.getDocuments = async (req, res) => {
  const userId = req.user.id;

  try {
    if (useMongo) {
      const documents = await Document.find({ userId }).sort({ createdAt: -1 });
      return res.json({ success: true, documents });
    } else {
      const documents = db.getDocumentsByUser(userId);
      documents.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      return res.json({ success: true, documents });
    }
  } catch (error) {
    console.error('Error fetching documents:', error);
    return res.status(500).json({ success: false, message: 'Server error while fetching documents.' });
  }
};

// 3. Delete Document (DELETE /api/documents/:id)
exports.deleteDocument = async (req, res) => {
  const docId = req.params.id;
  const userId = req.user.id;

  try {
    if (useMongo) {
      if (!mongoose.Types.ObjectId.isValid(docId)) {
        return res.status(400).json({ success: false, message: 'Invalid Document ID format.' });
      }

      // Verify ownership before deleting
      const deletedDoc = await Document.findOneAndDelete({ _id: docId, userId });
      if (!deletedDoc) {
        return res.status(404).json({ success: false, message: 'Document not found or access denied.' });
      }

      // Remove chunks
      await DocumentChunk.deleteMany({ documentId: docId, userId });
      
      return res.json({ success: true, message: 'Document and vectorized index deleted.' });
    } else {
      const doc = db.getDocumentById(docId);
      if (!doc || doc.userId.toString() !== userId.toString()) {
        return res.status(404).json({ success: false, message: 'Document not found or access denied.' });
      }

      const success = db.deleteDocument(docId);
      if (!success) {
        return res.status(500).json({ success: false, message: 'Failed to delete document from fallback.' });
      }
      return res.json({ success: true, message: 'Document and vectorized index deleted.' });
    }
  } catch (error) {
    console.error('Error deleting document:', error);
    return res.status(500).json({ success: false, message: 'Server error while deleting document.' });
  }
};

// 4. Retrieve Context (Internal Helper to fetch relevant vector chunks)
exports.retrieveRelevantContext = async (userId, query, limit = 3) => {
  try {
    const queryVector = await embeddingService.generateEmbedding(query);
    
    let allChunks = [];
    if (useMongo) {
      allChunks = await DocumentChunk.find({ userId });
    } else {
      allChunks = db.getChunksByUser(userId);
    }

    if (allChunks.length === 0) {
      return '';
    }

    // Calculate score for each chunk
    const chunksWithScores = allChunks.map(chunk => {
      const score = dotProduct(queryVector, chunk.embedding);
      return {
        text: chunk.text,
        score
      };
    });

    // Sort descending by score and filter out very low matches
    const scoredAndFiltered = chunksWithScores
      .filter(c => c.score > 0.15)
      .sort((a, b) => b.score - a.score);

    const topChunks = scoredAndFiltered.slice(0, limit);

    if (topChunks.length === 0) {
      return '';
    }

    console.log(`RAG retrieved ${topChunks.length} matching chunks for query. Top score: ${topChunks[0].score.toFixed(3)}`);
    
    // Combine chunks
    return topChunks.map(c => c.text).join('\n\n');
  } catch (error) {
    console.error('Error retrieving context:', error);
    return ''; // return empty string on error so chat generation still works without context
  }
};

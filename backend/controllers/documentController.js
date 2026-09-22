/**
 * documentController.js — PDF Upload, Chunking, Embedding & RAG Retrieval
 *
 * This controller handles the full Retrieval-Augmented Generation (RAG) pipeline:
 *
 *   UPLOAD FLOW (POST /api/documents/upload):
 *     1. Receive a PDF file buffer via Multer in-memory storage
 *     2. Parse the PDF text using pdf-parse (with a raw binary fallback)
 *     3. Split the text into overlapping chunks (800 chars, 150 char overlap)
 *     4. Generate a 384-dim semantic embedding for each chunk using Xenova
 *     5. Save Document metadata and all DocumentChunk records to DB
 *
 *   RETRIEVAL FLOW (retrieveRelevantContext — called internally by chatController):
 *     1. Embed the user's query into a 384-dim vector
 *     2. Fetch all chunks belonging to the user
 *     3. Compute cosine similarity (dot product) between query and each chunk
 *     4. Return the top-3 highest-scoring chunks as a single string
 *        to inject into the LLM prompt as clinical context
 */

const mongoose = require('mongoose');
const pdfParse = require('pdf-parse');           // Primary PDF text extractor
const Document = require('../models/Document');
const DocumentChunk = require('../models/DocumentChunk');
const db = require('../db');
const embeddingService = require('../services/embedding.service');
require('dotenv').config();

// ────────────────────────────────────────────────────────────────────────
// Database Mode Detection (same pattern as server.js and chatController.js)
// ────────────────────────────────────────────────────────────────────────
const MONGODB_URI = process.env.MONGODB_URI || '';
const isMongoPlaceholder = !MONGODB_URI || MONGODB_URI.includes('cluster0.xxxxx.mongodb.net');
const useMongo = !isMongoPlaceholder;

/**
 * chunkText — Splits a long text string into overlapping fixed-size segments.
 *
 * Overlapping windows (overlap = 150 chars) ensure that sentences crossing
 * chunk boundaries are still captured by at least one chunk, improving
 * retrieval accuracy for partial matches.
 *
 * @param {string} text    — Full extracted PDF text
 * @param {number} size    — Chunk size in characters (default: 800)
 * @param {number} overlap — Number of characters to repeat at chunk boundaries (default: 150)
 * @returns {Array<{text: string, pageNumber: number}>} Array of chunk objects
 */
const chunkText = (text, size = 800, overlap = 150) => {
  const chunks = [];
  let start = 0;
  
  // Normalize whitespace first (collapse multiple spaces/newlines to single space)
  const cleanedText = text.replace(/\s+/g, ' ').trim();
  
  while (start < cleanedText.length) {
    let end = start + size;
    if (end > cleanedText.length) {
      end = cleanedText.length; // Don't overshoot at the end of text
    }
    
    chunks.push({
      text: cleanedText.substring(start, end),
      pageNumber: 1 // pdf-parse default — page info not preserved in current implementation
    });
    
    if (end === cleanedText.length) break; // Reached end of text
    start += (size - overlap); // Advance by (size - overlap) to create the overlapping window
  }
  return chunks;
};

/**
 * dotProduct — Calculates the dot product of two equal-length float arrays.
 *
 * Since Xenova/all-MiniLM-L6-v2 outputs L2-normalized vectors (unit vectors),
 * the dot product IS the cosine similarity score.
 * Score range: [-1, 1] where 1 = identical meaning, 0 = unrelated, -1 = opposite.
 *
 * @param {number[]} a — First embedding vector
 * @param {number[]} b — Second embedding vector
 * @returns {number} Similarity score
 */
const dotProduct = (a, b) => {
  if (!a || !b || a.length !== b.length) return 0;
  let sum = 0;
  for (let i = 0; i < a.length; i++) {
    sum += a[i] * b[i];
  }
  return sum;
};

// ════════════════════════════════════════════════════════════════════════
// 1. Upload and Process PDF — POST /api/documents/upload
// ════════════════════════════════════════════════════════════════════════
/**
 * uploadDocument — Full PDF ingestion pipeline.
 *
 * Steps:
 *   1. Validate file type (PDF only)
 *   2. Extract text (pdf-parse primary, raw binary fallback)
 *   3. Chunk text into overlapping segments
 *   4. Generate embeddings for all chunks (sequential, not parallel — avoids OOM)
 *   5. Save Document metadata and all DocumentChunk records
 */
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
    
    // ── Step 1: Extract PDF Text ────────────────────────────────────────
    let pdfText = '';
    try {
      // Primary method: pdf-parse library (handles most standard PDFs)
      const parsedPdf = await pdfParse(req.file.buffer);
      pdfText = parsedPdf.text || '';
    } catch (parseError) {
      console.warn('⚠️ PDF parsing library failed. Trying direct text stream extraction fallback:', parseError.message);
      
      // Fallback method 1: Extract text from PDF parenthesis stream blocks
      // PDF text streams use the format: (text) Tj  or  (text)'
      const rawString = req.file.buffer.toString('binary');
      
      // Look for PDF text parenthesis blocks e.g. (text) Tj or (text)'
      const matches = rawString.match(/\(([^)]+)\)\s*(?:Tj|')/g);
      if (matches) {
        pdfText = matches.map(m => {
          const contentMatch = m.match(/\(([^)]+)\)/);
          return contentMatch ? contentMatch[1] : '';
        }).join(' ');
      } else {
        // Fallback method 2: strip out binary characters and extract printable ASCII sequences
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

    // ── Step 2: Split Text Into Overlapping Chunks ──────────────────────
    const chunks = chunkText(pdfText);
    const chunkCount = chunks.length;
    console.log(`Split text into ${chunkCount} chunks. Generating embeddings...`);

    // ── Step 3: Generate Vector Embeddings for Each Chunk ───────────────
    // Sequential (not Promise.all) to avoid memory spikes with large PDFs
    const embeddings = [];
    for (let i = 0; i < chunks.length; i++) {
      const vector = await embeddingService.generateEmbedding(chunks[i].text);
      embeddings.push(vector);
    }

    // ── Step 4: Persist Document Metadata + Vector Chunks ───────────────
    let documentObj = null;

    if (useMongo) {
      // Save Document Metadata first (we need its _id for the chunks)
      const newDoc = new Document({
        userId,
        filename: req.file.originalname,
        fileSize: req.file.size,
        chunkCount
      });
      documentObj = await newDoc.save();

      // Save Chunks in bulk — DocumentChunk.insertMany is more efficient than individual saves
      const chunkDocs = chunks.map((c, i) => new DocumentChunk({
        documentId: documentObj._id,
        userId,
        text: c.text,
        embedding: embeddings[i],  // The 384-dim vector for this chunk
        pageNumber: c.pageNumber
      }));
      
      await DocumentChunk.insertMany(chunkDocs);
    } else {
      // Fallback Local Storage — sequential inserts for the local db
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

// ════════════════════════════════════════════════════════════════════════
// 2. Get User Documents — GET /api/documents
// ════════════════════════════════════════════════════════════════════════
/**
 * getDocuments — Returns metadata for all documents uploaded by the logged-in user.
 * Sorted by upload date (newest first).
 */
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

// ════════════════════════════════════════════════════════════════════════
// 3. Delete Document — DELETE /api/documents/:id
// ════════════════════════════════════════════════════════════════════════
/**
 * deleteDocument — Deletes a document and ALL its associated vector chunks.
 * Ownership is verified before deletion (users can only delete their own docs).
 * This is a cascade delete: both the Document and its DocumentChunks are removed.
 */
exports.deleteDocument = async (req, res) => {
  const docId = req.params.id;
  const userId = req.user.id;

  try {
    if (useMongo) {
      if (!mongoose.Types.ObjectId.isValid(docId)) {
        return res.status(400).json({ success: false, message: 'Invalid Document ID format.' });
      }

      // Verify ownership before deleting (findOneAndDelete with userId predicate)
      const deletedDoc = await Document.findOneAndDelete({ _id: docId, userId });
      if (!deletedDoc) {
        return res.status(404).json({ success: false, message: 'Document not found or access denied.' });
      }

      // Remove chunks — all vector data associated with this document
      await DocumentChunk.deleteMany({ documentId: docId, userId });
      
      return res.json({ success: true, message: 'Document and vectorized index deleted.' });
    } else {
      const doc = db.getDocumentById(docId);
      if (!doc || doc.userId.toString() !== userId.toString()) {
        return res.status(404).json({ success: false, message: 'Document not found or access denied.' });
      }

      // db.deleteDocument also removes associated chunks (see db.js)
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

// ════════════════════════════════════════════════════════════════════════
// 4. Retrieve Relevant Context — Internal Helper (called by chatController)
// ════════════════════════════════════════════════════════════════════════
/**
 * retrieveRelevantContext — Performs semantic similarity search over the user's
 * uploaded document chunks to find the most relevant clinical passages.
 *
 * This is the "R" (Retrieval) step of RAG:
 *   1. Embed the user's query into a 384-dim vector
 *   2. Load all chunks owned by the user
 *   3. Score each chunk via dot product (cosine similarity)
 *   4. Filter out low-relevance chunks (score ≤ 0.15)
 *   5. Return the top `limit` chunk texts concatenated as a single string
 *
 * The returned string is injected into the LLM system prompt as context.
 * Returns an empty string if no relevant chunks exist (chat still works without docs).
 *
 * @param {string} userId  — The authenticated user's id
 * @param {string} query   — The user's natural language question
 * @param {number} limit   — Max number of chunks to include (default: 3)
 * @returns {Promise<string>} Concatenated relevant chunk text (or '' if none)
 */
exports.retrieveRelevantContext = async (userId, query, limit = 3) => {
  try {
    // Embed the query using the same model used during document ingestion
    const queryVector = await embeddingService.generateEmbedding(query);
    
    // Fetch all vector chunks owned by the user
    let allChunks = [];
    if (useMongo) {
      allChunks = await DocumentChunk.find({ userId });
    } else {
      allChunks = db.getChunksByUser(userId);
    }

    if (allChunks.length === 0) {
      return ''; // User has no uploaded documents — no context to inject
    }

    // Calculate dot product score for each chunk (cosine similarity since vectors are normalized)
    const chunksWithScores = allChunks.map(chunk => {
      const score = dotProduct(queryVector, chunk.embedding);
      return {
        text: chunk.text,
        score
      };
    });

    // Sort descending by score and filter out very low matches (< 0.15 threshold)
    // The 0.15 threshold removes clearly unrelated chunks that would just add noise
    const scoredAndFiltered = chunksWithScores
      .filter(c => c.score > 0.15)
      .sort((a, b) => b.score - a.score);

    const topChunks = scoredAndFiltered.slice(0, limit); // Take top N

    if (topChunks.length === 0) {
      return ''; // No chunks passed the relevance threshold
    }

    console.log(`RAG retrieved ${topChunks.length} matching chunks for query. Top score: ${topChunks[0].score.toFixed(3)}`);
    
    // Join chunks with double newline for readability in the prompt
    return topChunks.map(c => c.text).join('\n\n');
  } catch (error) {
    console.error('Error retrieving context:', error);
    return ''; // return empty string on error so chat generation still works without context
  }
};

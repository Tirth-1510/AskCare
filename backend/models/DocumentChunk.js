/**
 * DocumentChunk.js — Mongoose Document Chunk / Vector Store Model
 *
 * Each document uploaded by a user is split into overlapping text chunks.
 * This model stores each chunk along with its vector embedding for semantic
 * similarity search (Retrieval-Augmented Generation / RAG pipeline).
 *
 * Fields:
 *   documentId  — Reference to the parent Document record
 *   userId      — Duplicated here for efficient per-user chunk queries
 *                 (avoids a join through the Document collection)
 *   text        — The raw text content of this chunk (800 chars, ~150 char overlap)
 *   embedding   — 384-dimensional float array produced by Xenova/all-MiniLM-L6-v2
 *                 (or the hash-based fallback vectorizer)
 *   pageNumber  — PDF page this chunk originated from (currently always 1,
 *                 since pdf-parse flattens pages into a single text stream)
 *   createdAt / updatedAt — Auto-managed by Mongoose timestamps
 *
 * How the RAG lookup works:
 *   1. The user's query is embedded into a 384-dim vector.
 *   2. All chunks owned by the user are fetched from this collection.
 *   3. Dot product (cosine similarity) is computed between the query vector
 *      and each chunk's embedding.
 *   4. The top-N chunks (score > 0.15) are injected into the LLM prompt as
 *      clinical context, grounding the AI's response in the uploaded documents.
 */

const mongoose = require('mongoose');

const documentChunkSchema = new mongoose.Schema({
  documentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Document',  // Links back to the parent Document
    required: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',      // Denormalized for fast per-user chunk retrieval
    required: true
  },
  text: {
    type: String,
    required: true    // The extracted text segment from the PDF
  },
  embedding: {
    type: [Number],   // Array of 384 floating-point values (dense vector)
    required: true
  },
  pageNumber: {
    type: Number,
    default: 1        // PDF page origin (currently always 1 due to pdf-parse flattening)
  }
}, {
  timestamps: true  // Auto-manage createdAt / updatedAt
});

module.exports = mongoose.model('DocumentChunk', documentChunkSchema);

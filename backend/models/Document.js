/**
 * Document.js — Mongoose Document Metadata Model
 *
 * Stores metadata about PDF files uploaded by users for Retrieval-Augmented
 * Generation (RAG). The actual PDF content is NOT stored here — it is split
 * into text chunks and stored in the DocumentChunk collection.
 *
 * Fields:
 *   userId      — Owner of this document (references User)
 *   filename    — Original name of the uploaded PDF file
 *   fileSize    — File size in bytes (for display in the UI)
 *   chunkCount  — Number of text chunks generated from this PDF
 *                 (each chunk is a row in DocumentChunk with an embedding)
 *   createdAt / updatedAt — Auto-managed by Mongoose timestamps
 *
 * Workflow:
 *   1. User uploads a PDF via POST /api/documents/upload
 *   2. documentController parses the PDF and splits it into chunks
 *   3. Each chunk is embedded and saved to DocumentChunk
 *   4. This Document metadata record is saved as the "parent" record
 *   5. When the user queries the AI, relevant chunks are retrieved via
 *      cosine similarity against the query embedding (RAG pipeline)
 */

const mongoose = require('mongoose');

const documentSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',    // Logical foreign key to the owning user
    required: true
  },
  filename: {
    type: String,
    required: true  // The original filename of the uploaded PDF
  },
  fileSize: {
    type: Number    // Size in bytes; used for display purposes in the UI
  },
  chunkCount: {
    type: Number,
    default: 0     // Updated after chunking; tracks how many chunks were indexed
  }
}, {
  timestamps: true // Auto-manage createdAt / updatedAt
});

module.exports = mongoose.model('Document', documentSchema);

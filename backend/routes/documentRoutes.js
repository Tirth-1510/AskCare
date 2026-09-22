/**
 * documentRoutes.js — Document Upload & RAG API Route Definitions
 *
 * Mounts all document-related routes under /api/documents (see server.js).
 * ALL routes here are protected by authMiddleware — a valid JWT is required.
 *
 * File Upload:
 *   Multer is configured with in-memory storage so the uploaded PDF buffer
 *   is passed directly to the controller without touching the filesystem.
 *   This is safe and efficient for serverless environments (e.g., Vercel).
 *   File size is capped at 10MB to prevent abuse.
 *
 * Route Map:
 *   POST   /api/documents/upload  → uploadDocument  — Upload a PDF, parse it, chunk and embed it for RAG
 *   GET    /api/documents         → getDocuments    — List all documents uploaded by the logged-in user
 *   DELETE /api/documents/:id     → deleteDocument  — Delete a document and all its associated vector chunks
 */

const express = require('express');
const router = express.Router();
const multer = require('multer');
const documentController = require('../controllers/documentController');
const authMiddleware = require('../middleware/authMiddleware');

// Configure Multer in-memory storage for handling files securely
// memoryStorage() keeps the file as req.file.buffer (no temp file on disk)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024 // Limit file size to 10MB
  }
});

// Protect all document routes with authentication middleware
router.use(authMiddleware);

// Route mappings
// upload.single('file') processes the multipart/form-data field named "file"
router.post('/upload', upload.single('file'), documentController.uploadDocument);
router.get('/', documentController.getDocuments);
router.delete('/:id', documentController.deleteDocument);

module.exports = router;

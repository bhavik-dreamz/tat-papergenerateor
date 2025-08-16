# Quick Local Qdrant Setup for Testing

## Prerequisites
- Docker installed on your system

## Setup Steps

### 1. Start Local Qdrant
```bash
docker run -d --name qdrant-local -p 6333:6333 -p 6334:6334 qdrant/qdrant:latest
```

### 2. Update .env file
```env
QDRANT_ENABLED="true"
QDRANT_URL="http://localhost:6333"
QDRANT_API_KEY=""
QDRANT_COLLECTION="tat-pdfmaterial"
```

### 3. Test Connection
Visit: http://localhost:6333/dashboard

### 4. Test Your App
- Upload a PDF material
- Check logs for embedding generation
- Verify vector storage works

## Stop Local Qdrant
```bash
docker stop qdrant-local
docker rm qdrant-local
```

## Alternative: Without Docker

### Download Qdrant Binary
1. Go to: https://github.com/qdrant/qdrant/releases
2. Download for Windows
3. Extract and run `qdrant.exe`
4. It will start on port 6333

## Current Status
Your app works perfectly without Qdrant:
- ✅ Material uploads work
- ✅ PDF text extraction works  
- ✅ Database storage works
- ✅ No errors or crashes

Vector search is the only missing feature, and it's optional for basic material management.

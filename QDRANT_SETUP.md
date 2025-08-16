# Qdrant Local Setup Instructions

## Option 1: Using Docker (Recommended)

1. Make sure Docker is installed on your system
2. Run the following command in your project directory:

```bash
docker-compose -f docker-compose.qdrant.yml up -d
```

3. Update your `.env` file to use local Qdrant:
```env
QDRANT_URL="http://localhost:6333"
QDRANT_API_KEY=""
```

4. Test the connection by visiting: http://localhost:6333/dashboard

## Option 2: Using Docker Run Command

```bash
docker run -p 6333:6333 -p 6334:6334 \
    -v $(pwd)/qdrant_storage:/qdrant/storage:z \
    qdrant/qdrant
```

## Option 3: Install Qdrant Locally

1. Download Qdrant from: https://github.com/qdrant/qdrant/releases
2. Extract and run the binary
3. It will start on port 6333 by default

## Verification

Once Qdrant is running locally, you can test it:

```bash
curl http://localhost:6333/health
```

Should return: `{"status":"ok"}`

## Troubleshooting

- Make sure port 6333 is not being used by another application
- If using WSL2, make sure Docker Desktop has WSL2 integration enabled
- Check Docker logs: `docker-compose -f docker-compose.qdrant.yml logs`

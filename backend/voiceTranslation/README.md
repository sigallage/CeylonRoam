# Voice Translation Backend

FastAPI backend for CeylonRoam voice translation feature using OpenRouter and OpenAI APIs.

## Features

- **Speech-to-Text**: Transcribe audio using OpenAI Whisper API
- **Text Translation**: Translate between Sinhala, Tamil, and English using GPT-4 via OpenRouter
- **Multi-language Support**: Supports Sinhala (si), Tamil (ta), and English (en)

## Setup Instructions

### 1. Get API Keys

#### OpenRouter API Key (for translation)
1. Go to [OpenRouter.ai](https://openrouter.ai/)
2. Sign up or log in
3. Go to [API Keys](https://openrouter.ai/keys)
4. Create a new API key
5. Copy the key

#### OpenAI API Key (for speech-to-text)
1. Go to [OpenAI Platform](https://platform.openai.com/)
2. Sign up or log in
3. Go to [API Keys](https://platform.openai.com/api-keys)
4. Create a new secret key
5. Copy the key

### 2. Configure Environment Variables

1. Open the `.env` file in this directory
2. Add your API keys:

```env
OPENROUTER_API_KEY=sk-or-v1-your-key-here
OPENAI_API_KEY=sk-your-openai-key-here
PORT=8002
```

### 3. Install Dependencies

```bash
# Make sure you're in the voiceTranslation directory
cd backend/voiceTranslation

# Install requirements
pip install -r requirements.txt
```

### 4. Run the Backend

**Option 1: Using the batch script**
```bash
start_backend.bat
```

**Option 2: Directly with Python**
```bash
python main.py
```

**Option 3: With uvicorn**
```bash
uvicorn main:app --host 0.0.0.0 --port 8002 --reload
```

The API will start on `http://localhost:8002`

## API Endpoints

### POST `/voice/translate`
Transcribe audio to text

**Request:**
- Form data with audio file
- `file`: Audio file (WAV, MP3, etc.)
- `source_language`: Language code (si/ta/en)
- `target_language`: Same as source for transcription

**Response:**
```json
{
  "text": "transcribed text",
  "detected_language": "en"
}
```

### POST `/text/translate`
Translate text between languages

**Request:**
```json
{
  "text": "Hello world",
  "source_language": "en",
  "target_language": "si"
}
```

**Response:**
```json
{
  "text": "හෙලෝ වර්ල්ඩ්"
}
```

## Language Codes

- `si` - Sinhala
- `ta` - Tamil
- `en` - English

## Cost Estimates

### OpenAI Whisper API
- **Price**: ~$0.006 per minute of audio
- **Model**: whisper-1

### OpenRouter GPT-4o-mini
- **Price**: ~$0.15 per 1M input tokens, $0.60 per 1M output tokens
- **Model**: openai/gpt-4o-mini (cost-effective for translation)

## Troubleshooting

### "OPENAI_API_KEY not configured"
- Make sure you've added your OpenAI API key to the `.env` file
- Restart the backend after updating `.env`

### "OPENROUTER_API_KEY not configured"  
- Make sure you've added your OpenRouter API key to the `.env` file
- Restart the backend after updating `.env`

### CORS errors from frontend
- The backend is configured to allow all origins
- Make sure the backend is running on port 8002
- Check that frontend is using correct API URL

### Audio transcription fails
- Ensure audio file is in a supported format (WAV, MP3, M4A, etc.)
- Check that the file size is under 25MB
- Verify your OpenAI API key has credits

## Architecture

```
Frontend (React)
    ↓
FastAPI Backend (this service)
    ↓
    ├─→ OpenAI Whisper API (transcription)
    └─→ OpenRouter GPT API (translation)
```

## Development

To run in development mode with auto-reload:

```bash
uvicorn main:app --reload --port 8002
```

## Production Deployment

For production, consider:
- Setting up proper environment variable management
- Implementing rate limiting
- Adding authentication
- Using a production ASGI server
- Implementing caching for common translations

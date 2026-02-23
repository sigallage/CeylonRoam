# Voice Translation Backend

This backend service provides **speech-to-text** and **text translation** capabilities using open-source models from Hugging Face:

- **Whisper Large v3** (OpenAI) - for speech recognition
- **NLLB-200** (Meta) - for translation

## Features

- ✅ **Completely FREE** - runs locally on your machine
- ✅ **No API keys required**
- ✅ Supports Sinhala, English, and Tamil
- ✅ High-quality transcription with Whisper Large v3
- ✅ Advanced translation with NLLB-200

## Quick Start

### 1. Install Python
Make sure you have Python 3.8+ installed.

### 2. Run the Backend
Simply double-click `start_backend.bat` or run:
```bash
start_backend.bat
```

On first run, this will:
- Create a virtual environment
- Install all dependencies (~2-3 GB download including models)
- Start the API server on http://localhost:8002

**Note:** First run may take 10-15 minutes to download models.

### 3. Verify It's Running
Open your browser and go to:
```
http://localhost:8002
```

You should see:
```json
{
  "message": "Voice Translation API is running",
  "whisper_loaded": true,
  "translation_loaded": true,
  "device": "cpu"
}
```

## API Endpoints

### 1. Transcribe Audio
**POST** `/voice/translate`

Convert speech to text.

**Parameters:**
- `file`: Audio file (WAV format)
- `task`: "transcribe" or "translate"
- `source_language`: Language code (si/en/ta)
- `target_language`: Language code (si/en/ta)

### 2. Translate Text
**POST** `/text/translate`

Translate text between languages.

**Body:**
```json
{
  "text": "Hello world",
  "source_language": "en",
  "target_language": "si"
}
```

## Supported Languages

- `si` - Sinhala (සිංහල)
- `en` - English
- `ta` - Tamil (தமிழ்)

## System Requirements

### Minimum
- RAM: 8 GB
- Storage: 5 GB free space
- CPU: Multi-core processor

### Recommended
- RAM: 16 GB+
- GPU: NVIDIA GPU with CUDA support (for faster processing)
- Storage: 5 GB free space

## GPU Acceleration (Optional)

For faster processing, install PyTorch with CUDA:

```bash
pip install torch torchvision torchaudio --index-url https://download.pytorch.org/whl/cu118
```

The service will automatically use GPU if available.

## Troubleshooting

### Models taking too long to load?
- First download is slow (2-3 GB of models)
- Subsequent starts are much faster
- Consider using a smaller model if needed

### Out of memory?
- Close other applications
- Use a lighter model variant
- Reduce batch size in main.py

### Port 8002 already in use?
Change the port in `main.py`:
```python
uvicorn.run(app, host="0.0.0.0", port=8003)  # Change port here
```

## License

This uses open-source models:
- Whisper: MIT License
- NLLB-200: CC-BY-NC 4.0

Completely free for personal and educational use!

# Voice Translation Backend

This backend service provides **speech-to-text** and **text translation** capabilities using open-source models from Hugging Face and they are:

- **Whisper Small** (OpenAI) - for speech recognition
- **NLLB-200** (Meta) - for translation


## Features

- **Completely FREE** - runs locally on your machine
- **No API keys required**
- Supports many languages including Sinhala, Tamil, English, Hindi, Arabic, Chinese, French, German, Spanish, Dutch, Italian, Japanese, Korean, Polish, Portuguese, Russian, and Turkish
- High-quality transcription with Whisper Large v3
- Advanced translation with NLLB-200

## Quick Start

### 1. Install Python
Make sure you have Python 3.8+ installed.

### 1.5. Install FFmpeg (Required)
This service uses FFmpeg to decode uploaded audio files. If FFmpeg is missing, `/voice/translate` will fail.

- **Windows (recommended):** `winget install Gyan.FFmpeg`
- **Windows (alternative):** `choco install ffmpeg`
- **macOS:** `brew install ffmpeg`
- **Linux (Debian/Ubuntu):** `sudo apt-get update && sudo apt-get install -y ffmpeg`

Verify:
```bash
ffmpeg -version
```

### 2. Run the Backend
Simply double-click `start_backend.bat` or run:
```bash
start_backend.bat
```

On first run, this will:
- Create a virtual environment
- Install all dependencies (~2-3 GB download including models)
- Start the API server on http://localhost:8003

**Note:** First run may take 10-15 minutes to download models.

### 3. Verify It's Running
Open your browser and go to:
```
http://localhost:8003
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

The backend supports a wide range of languages for both speech recognition and translation, including but not limited to:

- `si` - Sinhala
- `ta` - Tamil
- `en` - English
- `hi` - Hindi
- `ar` - Arabic
- `zh` - Chinese
- `fr` - French
- `de` - German
- `es` - Spanish
- `nl` - Dutch
- `it` - Italian
- `ja` - Japanese
- `ko` - Korean
- `pl` - Polish
- `pt` - Portuguese
- `ru` - Russian
- `tr` - Turkish

For the full list of supported language codes, see the `WHISPER_LANG_MAP` and `NLLB_LANG_MAP` in `main.py`.

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

### `ffmpeg was not found` / audio upload returns 500
- Install FFmpeg and ensure `ffmpeg` is on your PATH (see step 1.5 above).
- For Docker/ECS deployments, make sure you rebuilt and redeployed the `backend/voiceTranslation` image.

### Models taking too long to load?
- First download is slow (2-3 GB of models)
- Subsequent starts are much faster
- Consider using a smaller model if needed

### Out of memory?
- Close other applications
- Use a lighter model variant
- Reduce batch size in main.py

### Port 8003 already in use?
Change the port in `main.py`:
```python
uvicorn.run(app, host="0.0.0.0", port=8003)  # Change port here
```

## License

This uses open-source models:
- Whisper: MIT License
- NLLB-200: CC-BY-NC 4.0

Completely free for personal and educational use!

---

## Project Overview
This backend service enables real-time speech-to-text and multilingual translation using state-of-the-art open-source models. It is designed for local, free use without API keys.

## Docker Usage
A Dockerfile is provided for containerized deployment. To build and run:

```bash
docker build -t voice-translation .
docker run -p 8003:8003 voice-translation
```

## Configuration
You can configure environment variables or settings in `main.py` for custom behavior (e.g., port, model paths).


## Contact & Support
For questions or support, contact the maintainer or open an issue in the repository.

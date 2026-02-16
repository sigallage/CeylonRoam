"""
Voice Translation API using Local Whisper + OpenRouter
Provides speech-to-text transcription and text translation
"""
import os
import io
import torch
from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import httpx
from dotenv import load_dotenv
from transformers import pipeline
import soundfile as sf

# Load environment variables
load_dotenv()

app = FastAPI(title="Voice Translation API")

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# API Configuration
OPENROUTER_API_KEY = os.getenv("OPENROUTER_API_KEY")

# Use OpenRouter for GPT translation (cost-effective)
OPENROUTER_API_URL = "https://openrouter.ai/api/v1/chat/completions"

# Initialize Whisper model (local, free)
print("Loading Whisper model...")
device = "cuda" if torch.cuda.is_available() else "cpu"
whisper_transcriber = pipeline(
    "automatic-speech-recognition",
    model="openai/whisper-small",
    device=device
)
print(f"Whisper model loaded on {device}!")


class TextTranslationRequest(BaseModel):
    text: str
    source_language: str
    target_language: str


class TranscriptionResponse(BaseModel):
    text: str
    detected_language: str


class TranslationResponse(BaseModel):
    text: str


def get_language_name(code: str) -> str:
    """Convert language code to full name"""
    language_map = {
        "si": "Sinhala",
        "ta": "Tamil",
        "en": "English",
        "auto": "auto-detect"
    }
    return language_map.get(code, code)


@app.get("/")
async def root():
    return {
        "service": "Voice Translation API",
        "status": "running",
        "endpoints": {
            "transcription": "/voice/translate",
            "translation": "/text/translate"
        }
    }


@app.post("/voice/translate", response_model=TranscriptionResponse)
async def transcribe_audio(
    file: UploadFile = File(...),
    source_language: str = "",
    target_language: str = ""
):
    """
    Transcribe audio file using Local Whisper Model (FREE)
    
    Args:
        file: Audio file (wav, mp3, etc.)
        source_language: Language spoken in audio (si/ta/en)
        target_language: Same as source_language for transcription
    
    Returns:
        Transcription text and detected language
    """
    try:
        # Read audio file
        audio_data = await file.read()
        
        # Load audio using soundfile
        audio_array, sample_rate = sf.read(io.BytesIO(audio_data))
        
        # Prepare generation kwargs
        generate_kwargs = {}
        if source_language and source_language != "auto":
            generate_kwargs["language"] = source_language
        
        # Transcribe using local Whisper model
        result = whisper_transcriber(
            {"array": audio_array, "sampling_rate": sample_rate},
            generate_kwargs=generate_kwargs
        )
        
        transcription_text = result.get('text', '')
        detected_lang = source_language if source_language else 'en'
        
        return TranscriptionResponse(
            text=transcription_text,
            detected_language=detected_lang
        )
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Transcription failed: {str(e)}")


@app.post("/text/translate", response_model=TranslationResponse)
async def translate_text(request: TextTranslationRequest):
    """
    Translate text using OpenRouter GPT
    
    Args:
        request: Contains text, source_language, target_language
    
    Returns:
        Translated text
    """
    if not OPENROUTER_API_KEY:
        raise HTTPException(
            status_code=500,
            detail="OPENROUTER_API_KEY not configured in environment variables"
        )
    
    source_lang = get_language_name(request.source_language)
    target_lang = get_language_name(request.target_language)
    
    # Create translation prompt
    prompt = f"""Translate the following text from {source_lang} to {target_lang}.

Only provide the translation, without any explanations or additional text.

Text to translate:
{request.text}

Translation:"""
    
    try:
        headers = {
            'Authorization': f'Bearer {OPENROUTER_API_KEY}',
            'Content-Type': 'application/json',
            'HTTP-Referer': 'https://ceylonroam.app',  # Optional: for rankings
            'X-Title': 'CeylonRoam Voice Translation'  # Optional: shows in rankings
        }
        
        payload = {
            'model': 'openai/gpt-4o-mini',  # Cost-effective for translation
            'messages': [
                {
                    'role': 'system',
                    'content': 'You are a professional translator specializing in Sinhala, Tamil, and English. Provide accurate, natural translations.'
                },
                {
                    'role': 'user',
                    'content': prompt
                }
            ],
            'temperature': 0.3,  # Lower temperature for more consistent translations
        }
        
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.post(
                OPENROUTER_API_URL,
                headers=headers,
                json=payload
            )
        
        if response.status_code != 200:
            error_detail = response.text
            raise HTTPException(
                status_code=response.status_code,
                detail=f"Translation API error: {error_detail}"
            )
        
        result = response.json()
        translated_text = result['choices'][0]['message']['content'].strip()
        
        return TranslationResponse(text=translated_text)
    
    except httpx.TimeoutException:
        raise HTTPException(status_code=504, detail="Translation request timeout")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Translation failed: {str(e)}")


if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", 8002))
    uvicorn.run(app, host="0.0.0.0", port=port)

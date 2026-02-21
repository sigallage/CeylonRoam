from fastapi import FastAPI, File, UploadFile, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import torch
from transformers import AutoModelForSpeechSeq2Seq, AutoProcessor, pipeline
from transformers import AutoTokenizer, AutoModelForSeq2SeqLM
import tempfile
import os
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="Voice Translation API")

# Enable CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global variables for models
whisper_pipe = None
translation_model = None
translation_tokenizer = None

# Language mapping for Whisper
WHISPER_LANG_MAP = {
    'si': 'si',  # Sinhala
    'en': 'en',  # English
    'ta': 'ta',  # Tamil
}

# Language mapping for NLLB translation model
NLLB_LANG_MAP = {
    'si': 'sin_Sinh',  # Sinhala
    'en': 'eng_Latn',  # English
    'ta': 'tam_Taml',  # Tamil
}


class TextTranslationRequest(BaseModel):
    text: str
    source_language: str
    target_language: str


@app.on_event("startup")
async def load_models():
    """Load models on startup"""
    global whisper_pipe, translation_model, translation_tokenizer
    
    try:
        logger.info("Loading Whisper model...")
        device = "cuda:0" if torch.cuda.is_available() else "cpu"
        torch_dtype = torch.float16 if torch.cuda.is_available() else torch.float32
        
        # Load Whisper Large v3
        model_id = "openai/whisper-large-v3"
        
        model = AutoModelForSpeechSeq2Seq.from_pretrained(
            model_id, 
            torch_dtype=torch_dtype, 
            low_cpu_mem_usage=True, 
            use_safetensors=True
        )
        model.to(device)
        
        processor = AutoProcessor.from_pretrained(model_id)
        
        whisper_pipe = pipeline(
            "automatic-speech-recognition",
            model=model,
            tokenizer=processor.tokenizer,
            feature_extractor=processor.feature_extractor,
            max_new_tokens=128,
            chunk_length_s=30,
            batch_size=16,
            return_timestamps=False,
            torch_dtype=torch_dtype,
            device=device,
        )
        logger.info("✓ Whisper model loaded successfully")
        
        # Load translation model (NLLB-200)
        logger.info("Loading NLLB translation model...")
        translation_model_id = "facebook/nllb-200-distilled-600M"
        
        translation_tokenizer = AutoTokenizer.from_pretrained(translation_model_id)
        translation_model = AutoModelForSeq2SeqLM.from_pretrained(translation_model_id)
        translation_model.to(device)
        logger.info("✓ Translation model loaded successfully")
        
    except Exception as e:
        logger.error(f"Error loading models: {e}")
        raise


@app.get("/")
async def root():
    return {
        "message": "Voice Translation API is running",
        "whisper_loaded": whisper_pipe is not None,
        "translation_loaded": translation_model is not None,
        "device": "cuda" if torch.cuda.is_available() else "cpu"
    }


@app.post("/voice/translate")
async def transcribe_audio(
    file: UploadFile = File(...),
    task: str = Form("transcribe"),
    target_language: str = Form("en"),
    source_language: str = Form("en")
):
    """
    Transcribe audio file using Whisper
    """
    if whisper_pipe is None:
        raise HTTPException(status_code=503, detail="Whisper model not loaded")
    
    try:
        # Save uploaded file temporarily
        with tempfile.NamedTemporaryFile(delete=False, suffix=".wav") as temp_audio:
            content = await file.read()
            temp_audio.write(content)
            temp_audio_path = temp_audio.name
        
        logger.info(f"Processing audio file: {file.filename}")
        
        # Get the language code for Whisper
        whisper_lang = WHISPER_LANG_MAP.get(source_language, 'en')
        
        # Transcribe using Whisper
        result = whisper_pipe(
            temp_audio_path,
            generate_kwargs={
                "language": whisper_lang,
                "task": task
            }
        )
        
        # Clean up temp file
        os.unlink(temp_audio_path)
        
        transcribed_text = result["text"].strip()
        logger.info(f"Transcription successful: {transcribed_text[:50]}...")
        
        return {
            "text": transcribed_text,
            "detected_language": source_language,
            "task": task
        }
        
    except Exception as e:
        logger.error(f"Transcription error: {e}")
        # Clean up temp file on error
        if 'temp_audio_path' in locals():
            try:
                os.unlink(temp_audio_path)
            except:
                pass
        raise HTTPException(status_code=500, detail=f"Transcription failed: {str(e)}")


@app.post("/text/translate")
async def translate_text(request: TextTranslationRequest):
    """
    Translate text between languages using NLLB
    """
    if translation_model is None or translation_tokenizer is None:
        raise HTTPException(status_code=503, detail="Translation model not loaded")
    
    try:
        source_lang = NLLB_LANG_MAP.get(request.source_language, 'eng_Latn')
        target_lang = NLLB_LANG_MAP.get(request.target_language, 'eng_Latn')
        
        logger.info(f"Translating from {source_lang} to {target_lang}")
        
        # Set source language
        translation_tokenizer.src_lang = source_lang
        
        # Tokenize input
        inputs = translation_tokenizer(
            request.text, 
            return_tensors="pt", 
            padding=True
        )
        
        # Move to device
        device = translation_model.device
        inputs = {k: v.to(device) for k, v in inputs.items()}
        
        # Get the target language token ID
        forced_bos_token_id = translation_tokenizer.convert_tokens_to_ids(target_lang)
        
        # Generate translation
        translated_tokens = translation_model.generate(
            **inputs,
            forced_bos_token_id=forced_bos_token_id,
            max_length=512
        )
        
        # Decode translation
        translated_text = translation_tokenizer.batch_decode(
            translated_tokens, 
            skip_special_tokens=True
        )[0]
        
        logger.info(f"Translation successful: {translated_text[:50]}...")
        
        return {
            "text": translated_text,
            "source_language": request.source_language,
            "target_language": request.target_language
        }
        
    except Exception as e:
        logger.error(f"Translation error: {e}")
        raise HTTPException(status_code=500, detail=f"Translation failed: {str(e)}")


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8002)

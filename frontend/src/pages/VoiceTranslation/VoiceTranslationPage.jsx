import { useState, useRef, useMemo } from 'react';

const LANGUAGE_OPTIONS = [
  { code: 'si', label: 'Sinhala' },
  { code: 'en', label: 'English' },
  { code: 'ta', label: 'Tamil' },
];

const createAudioContext = () => {
  const AudioContextImpl = window.AudioContext || window.webkitAudioContext;
  if (!AudioContextImpl) {
    throw new Error('This browser does not support AudioContext.');
  }
  return new AudioContextImpl();
};

const audioBufferToWav = (audioBuffer) => {
  const numChannels = audioBuffer.numberOfChannels;
  const sampleRate = audioBuffer.sampleRate;
  const format = 1; // PCM
  const bitsPerSample = 16;
  const channelData = [];
  let totalLength = 0;

  for (let channel = 0; channel < numChannels; channel += 1) {
    const data = audioBuffer.getChannelData(channel);
    channelData.push(data);
    totalLength += data.length;
  }

  const buffer = new ArrayBuffer(44 + totalLength * 2);
  const view = new DataView(buffer);

  const writeString = (offset, string) => {
    for (let i = 0; i < string.length; i += 1) {
      view.setUint8(offset + i, string.charCodeAt(i));
    }
  };

  let offset = 0;

  writeString(offset, 'RIFF'); offset += 4;
  view.setUint32(offset, 36 + totalLength * 2, true); offset += 4;
  writeString(offset, 'WAVE'); offset += 4;
  writeString(offset, 'fmt '); offset += 4;
  view.setUint32(offset, 16, true); offset += 4;
  view.setUint16(offset, format, true); offset += 2;
  view.setUint16(offset, numChannels, true); offset += 2;
  view.setUint32(offset, sampleRate, true); offset += 4;
  view.setUint32(offset, sampleRate * numChannels * (bitsPerSample / 8), true); offset += 4;
  view.setUint16(offset, numChannels * (bitsPerSample / 8), true); offset += 2;
  view.setUint16(offset, bitsPerSample, true); offset += 2;
  writeString(offset, 'data'); offset += 4;
  view.setUint32(offset, totalLength * 2, true); offset += 4;

  let channelIdx = 0;
  let sampleIdx = 0;

  while (sampleIdx < channelData[0].length) {
    for (channelIdx = 0; channelIdx < numChannels; channelIdx += 1) {
      const sample = Math.max(-1, Math.min(1, channelData[channelIdx][sampleIdx]));
      view.setInt16(offset, sample < 0 ? sample * 0x8000 : sample * 0x7fff, true);
      offset += 2;
    }
    sampleIdx += 1;
  }

  return buffer;
};

const convertBlobToWavFile = async (blob, fileName) => {
  if (blob.type === 'audio/wav' || blob.type === 'audio/wave') {
    return new File([blob], fileName, { type: 'audio/wav' });
  }

  const audioContext = createAudioContext();
  const arrayBuffer = await blob.arrayBuffer();
  const decodedBuffer = await audioContext.decodeAudioData(arrayBuffer.slice(0));
  const wavBuffer = audioBufferToWav(decodedBuffer);
  const wavBlob = new Blob([wavBuffer], { type: 'audio/wav' });
  return new File([wavBlob], fileName, { type: 'audio/wav' });
};

function VoiceTranslation() {
  const [isRecording, setIsRecording] = useState(false);
  const [audioFile, setAudioFile] = useState(null);
  const [transcription, setTranscription] = useState('');
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [isPreparingAudio, setIsPreparingAudio] = useState(false);
  const [recordingLanguage, setRecordingLanguage] = useState('');
  const [detectedLanguage, setDetectedLanguage] = useState('');
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const apiBaseUrl = useMemo(
    () => import.meta.env.VITE_API_URL?.replace(/\/$/, '') || 'http://localhost:8000',
    [],
  );

  const startRecording = async () => {
    if (!recordingLanguage) {
      alert('Please choose the language you will speak before recording.');
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new MediaRecorder(stream);
      audioChunksRef.current = [];

      mediaRecorderRef.current.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data);
      };

      mediaRecorderRef.current.onstop = async () => {
        const recorderStream = mediaRecorderRef.current?.stream;
        recorderStream?.getTracks().forEach((track) => track.stop());
        try {
          setIsPreparingAudio(true);
          const audioBlob = new Blob(audioChunksRef.current, {
            type: mediaRecorderRef.current?.mimeType || 'audio/webm',
          });
          const wavFile = await convertBlobToWavFile(audioBlob, 'recording.wav');
          setAudioFile(wavFile);
          await runTranscription(wavFile, recordingLanguage);
        } catch (error) {
          console.error('Recording processing failed:', error);
          setTranscription(`Error: ${error.message || 'Could not process recording.'}`);
        } finally {
          setIsPreparingAudio(false);
          audioChunksRef.current = [];
        }
      };

      mediaRecorderRef.current.start();
      setIsRecording(true);
    } catch (error) {
      console.error('Error accessing microphone:', error);
      alert('Could not access microphone. Please check permissions.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const runTranscription = async (fileToTranscribe = audioFile, languageHint = recordingLanguage) => {
    if (!fileToTranscribe) {
      alert('Please record an audio first.');
      return;
    }
    if (!languageHint) {
      alert('Select the language you are speaking before transcribing.');
      return;
    }

    setIsTranscribing(true);
    try {
      const formData = new FormData();
      formData.append('file', fileToTranscribe, fileToTranscribe.name || 'recording.wav');
      formData.append('task', 'transcribe');
      formData.append('target_language', languageHint);
      formData.append('source_language', languageHint);

      const response = await fetch(`${apiBaseUrl}/voice/translate`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorBody = await response.text();
        throw new Error(`Request failed (${response.status}): ${errorBody}`);
      }

      const data = await response.json();
      setTranscription(data.text || 'Transcription result will appear here');
      setDetectedLanguage(data.detected_language || languageHint);
    } catch (error) {
      console.error('Transcription error:', error);
      setTranscription(`Error: ${error.message || 'Could not transcribe audio.'}`);
    } finally {
      setIsTranscribing(false);
    }
  };

  const clearAll = () => {
    setAudioFile(null);
    setTranscription('');
     setDetectedLanguage('');
    audioChunksRef.current = [];
  };

  return (
    <>
      <style>{`
        .voice-translation label {
          color: #333 !important;
          font-weight: 600 !important;
          margin-bottom: 8px !important;
          display: block !important;
        }
      `}</style>

      <div className="voice-translation min-h-screen flex items-center justify-center bg-[#f5f5f5] px-4 py-12">
        <div className="bg-white px-10 py-12 rounded-[16px] border border-[#e5e7eb] shadow-[0_20px_40px_rgba(15,23,42,0.08)] w-full max-w-[560px]">
          <div className="space-y-8">
            <h1 className="text-[30px] font-semibold text-[#333] text-center">Voice Translation</h1><br></br>

            <section className="space-y-4">
              <div className="mx-auto w-full max-w-[440px] space-y-3">
                <label className="space-y-2">
                  <span className="block text-[15px] font-semibold text-[#111]">Step 1: Select Speaking Language</span>
                  <select
                    value={recordingLanguage}
                    onChange={(event) => setRecordingLanguage(event.target.value)}
                    className="w-full rounded-[8px] border border-[#ddd] px-4 py-3 text-[15px] text-[#333]"
                  >
                    <option value="">Choose a language</option>
                    {LANGUAGE_OPTIONS.map((option) => (
                      <option key={option.code} value={option.code}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
            </section>

            <section className="space-y-4">
              <div className="mx-auto w-full max-w-[440px]">
                <div className="mb-1 text-[16px] font-semibold text-[#111]">Step 2: Record Audio</div>
                {!isRecording ? (
                  <button
                    onClick={startRecording}
                    className="w-full rounded-[8px] bg-[#1a1a1a] px-6 py-4 text-[17px] font-medium text-white transition-colors hover:bg-[#1f1f1f]"
                    style={{ color: '#ffffff', height: '52px' }}
                    disabled={!recordingLanguage || isPreparingAudio}
                  >
                    {isPreparingAudio ? 'Processing audio...' : 'Start Recording'}
                  </button>
                ) : (
                  <button
                    onClick={stopRecording}
                    className="w-full rounded-[8px] bg-[#1a1a1a] px-6 py-4 text-[17px] font-medium text-white transition-colors hover:bg-[#1f1f1f]"
                    style={{ color: '#ffffff', height: '52px' }}
                  >
                    Stop Recording
                  </button>
                )}
              </div>
            </section>

            <br></br>

            <section className="space-y-4">
              <div className="mx-auto w-full max-w-[440px]">
                <button
                  onClick={() => runTranscription()}
                  disabled={!audioFile || isTranscribing || isPreparingAudio}
                  className="w-full rounded-[8px] bg-[#1a1a1a] px-6 py-4 text-[17px] font-medium text-white transition-colors hover:bg-[#333] disabled:bg-[#3b3b3b] disabled:text-white disabled:hover:bg-[#3b3b3b] disabled:cursor-not-allowed"
                  style={{ color: '#ffffff', height: '52px' }}
                >
                  {isTranscribing ? 'Transcribing...' : 'Transcribe Audio'}
                </button>
              </div>
            </section><br></br>

            {audioFile && (
              <div className="mx-auto w-full max-w-[440px] rounded-[8px] border border-green-200 bg-green-50 px-4 py-3 text-[14px] text-green-800">
                Audio ready for transcription ({audioFile.size ? Math.round(audioFile.size / 1024) + ' KB' : 'File loaded'})
              </div>
            )}<br></br>

            {transcription && (
              <section className="space-y-3">
                <div className="mx-auto w-full max-w-[440px] space-y-3">
                  <h2 className="text-[16px] font-semibold text-[#333]">Step 3: Review What You Said</h2>
                  <textarea
                    value={transcription}
                    onChange={(event) => setTranscription(event.target.value)}
                    className="min-h-[140px] w-full rounded-[8px] border border-[#ddd] bg-[#f9f9f9] px-4 py-3 text-[15px] text-[#333]"
                  />
                  {detectedLanguage && (
                    <p className="text-sm text-[#555]">Detected language: {detectedLanguage.toUpperCase()}</p>
                  )}
                </div><br></br>
              </section>
            )}

            {(audioFile || transcription) && (
              <div className="mx-auto w-full max-w-[440px]">
                <button
                  onClick={clearAll}
                  className="w-full rounded-[8px] border border-[#ddd] bg-white px-6 py-3 text-[15px] font-medium text-[#666] transition-colors hover:bg-[#f5f5f5]"
                  style={{ height: '48px' }}
                >
                  Clear All
                </button><br></br><br></br>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

export default VoiceTranslation;
import { useState, useRef, useMemo } from 'react';
import { getVoiceTranslationBaseUrl } from '../../config/backendUrls';
import { useTheme } from '../../context/ThemeContext';

const LANGUAGE_OPTIONS = [
  { code: 'en', label: 'English' },
  { code: 'ta', label: 'Tamil' },
  { code: 'ar', label: 'Arabic' },
  { code: 'zh', label: 'Chinese' },
  { code: 'nl', label: 'Dutch' },
  { code: 'fr', label: 'French' },
  { code: 'de', label: 'German' },
  { code: 'hi', label: 'Hindi' },
  { code: 'si', label: 'Sinhala' },
  { code: 'it', label: 'Italian' },
  { code: 'ja', label: 'Japanese' },
  { code: 'ko', label: 'Korean' },
  { code: 'pl', label: 'Polish' },
  { code: 'pt', label: 'Portuguese' },
  { code: 'ru', label: 'Russian' },
  { code: 'es', label: 'Spanish' },
  { code: 'tr', label: 'Turkish' },
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
  const { isDarkMode } = useTheme();
  const [isRecording, setIsRecording] = useState(false);
  const [audioFile, setAudioFile] = useState(null);
  const [transcription, setTranscription] = useState('');
  const [translationResult, setTranslationResult] = useState('');
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [isTranslating, setIsTranslating] = useState(false);
  const [isPreparingAudio, setIsPreparingAudio] = useState(false);
  const [recordingLanguage, setRecordingLanguage] = useState('');
  const [translationLanguage, setTranslationLanguage] = useState('en');
  const [detectedLanguage, setDetectedLanguage] = useState('');
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const apiBaseUrl = useMemo(() => getVoiceTranslationBaseUrl(), []);

  const panelClass = isDarkMode
    ? 'space-y-3 rounded-2xl border border-[#444] bg-black p-4'
    : 'space-y-3 rounded-2xl border border-gray-300 bg-white p-4';

  const fieldClass = isDarkMode
    ? 'w-full rounded-xl border border-gray-700 bg-black px-4 py-3 text-base text-white shadow-inner focus:border-gray-300 focus:outline-none focus:ring-2 focus:ring-white'
    : 'w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-base text-gray-900 shadow-inner focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-300';

  const textAreaClass = isDarkMode
    ? 'min-h-[140px] w-full rounded-xl border border-gray-700 bg-black px-4 py-3 text-sm text-white focus:border-gray-300 focus:outline-none focus:ring-2 focus:ring-white'
    : 'min-h-[140px] w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm text-gray-900 focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-300';

  const uploadInputClass = isDarkMode
    ? 'w-full rounded-xl border border-gray-700 bg-black px-4 py-3 text-sm text-white file:mr-4 file:rounded-md file:border-0 file:bg-[#d8c4ad] file:px-3 file:py-2 file:text-sm file:font-medium file:text-black'
    : 'w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm text-gray-900 file:mr-4 file:rounded-md file:border-0 file:bg-amber-200 file:px-3 file:py-2 file:text-sm file:font-medium file:text-black';

  const audioReadyClass = isDarkMode
    ? 'rounded-xl border border-green-500/40 bg-green-900/20 px-4 py-3 text-sm text-green-200'
    : 'rounded-xl border border-green-300 bg-green-50 px-4 py-3 text-sm text-green-800';

  const buildNetworkErrorMessage = (error, actionLabel) => {
    const rawMessage = error?.message || '';
    const isNetworkError =
      rawMessage === 'Failed to fetch' ||
      /network|fetch/i.test(rawMessage);

    if (isNetworkError) {
      return `Could not reach the Voice Translation service (${apiBaseUrl}). Make sure the backend is running, then try again.`;
    }

    return rawMessage || `Could not ${actionLabel}.`;
  };

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
    setTranslationResult('');
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
      setTranscription(`Error: ${buildNetworkErrorMessage(error, 'transcribe audio')}`);
    } finally {
      setIsTranscribing(false);
    }
  };

  const translateText = async () => {
    if (!transcription.trim()) {
      alert('Transcription is empty. Record audio first.');
      return;
    }
    if (!translationLanguage) {
      alert('Choose the language you want to translate to.');
      return;
    }
    setIsTranslating(true);
    try {
      const response = await fetch(`${apiBaseUrl}/text/translate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: transcription,
          source_language: recordingLanguage || detectedLanguage || 'auto',
          target_language: translationLanguage,
        }),
      });

      if (!response.ok) {
        const errorBody = await response.text();
        throw new Error(`Request failed (${response.status}): ${errorBody}`);
      }
      const data = await response.json();
      setTranslationResult(data.text || 'Translation result will appear here');
    } catch (error) {
      console.error('Translation error:', error);
      setTranslationResult(`Error: ${buildNetworkErrorMessage(error, 'translate text')}`);
    } finally {
      setIsTranslating(false);
    }
  };

  const clearAll = () => {
    setAudioFile(null);
    setTranscription('');
    setTranslationResult('');
    setDetectedLanguage('');
    audioChunksRef.current = [];
  };



  return (
    <div className="voice-translation min-h-screen w-full px-4 py-10 sm:px-6">
      <div className="mx-auto w-full max-w-2xl space-y-8">
        <div className={`space-y-2 text-center ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
          <h1 className="text-3xl font-semibold uppercase tracking-wide">Voice Translation</h1>
          <p className={`text-sm italic ${isDarkMode ? 'text-white/80' : 'text-gray-700'}`}>Speak, transcribe, and translate in a few steps.</p>
        </div>

        <div
          className={`space-y-6 rounded-3xl p-5 shadow-xl sm:p-8 ${isDarkMode ? 'bg-black' : 'bg-white'}`}
          style={{
            border: '1px solid transparent',
            backgroundImage: isDarkMode
              ? 'linear-gradient(#000, #000), linear-gradient(to right, #facc15, #f97316)'
              : 'linear-gradient(#fff, #fff), linear-gradient(to right, #facc15, #f97316)',
            backgroundOrigin: 'border-box',
            backgroundClip: 'padding-box, border-box',
          }}
        >
          <section className={panelClass}>
            <label className={`block text-sm font-bold italic ${isDarkMode ? 'text-white/80' : 'text-gray-700'}`}>Step 1: Select Speaking Language</label>
            <select
              value={recordingLanguage}
              onChange={(event) => setRecordingLanguage(event.target.value)}
              className={fieldClass}
            >
              <option value="">Choose a language</option>
              {LANGUAGE_OPTIONS.map((option) => (
                <option key={option.code} value={option.code}>
                  {option.label}
                </option>
              ))}
            </select>
          </section>

          <section className={panelClass}>
            <div className={`text-sm font-bold italic ${isDarkMode ? 'text-white/80' : 'text-gray-700'}`}>Step 2: Record Audio</div>
            {!isRecording ? (
              <button
                onClick={startRecording}
                className="w-full rounded-xl border border-yellow-400/60 bg-gradient-to-r from-yellow-500 to-amber-600 px-6 py-3 text-base font-semibold text-white shadow transition-all duration-200 hover:shadow-yellow-500/40 disabled:cursor-not-allowed disabled:border-gray-700 disabled:bg-gray-700 disabled:text-white/50 disabled:shadow-none"
                style={{ color: '#ffffff' }}
                disabled={!recordingLanguage || isPreparingAudio}
              >
                {isPreparingAudio ? 'Processing audio...' : 'Start Recording'}
              </button>
            ) : (
              <button
                onClick={stopRecording}
                className={isDarkMode
                  ? 'w-full rounded-xl border border-gray-600 bg-black px-6 py-3 text-base font-medium text-white transition-colors hover:bg-[#1c1c1c]'
                  : 'w-full rounded-xl border border-gray-300 bg-white px-6 py-3 text-base font-medium text-gray-900 transition-colors hover:bg-gray-100'}
              >
                Stop Recording
              </button>
            )}
          </section>

          <section className={panelClass}>
            <label className={`block text-sm italic ${isDarkMode ? 'text-white/80' : 'text-gray-700'}`}>Or Upload an Audio File</label>
            <input
              type="file"
              accept="audio/*"
              onChange={async (e) => {
                const file = e.target.files[0];
                if (file) {
                  setIsPreparingAudio(true);
                  try {
                    const wavFile = await convertBlobToWavFile(file, file.name.replace(/\.[^/.]+$/, '') + '.wav');
                    setAudioFile(wavFile);
                    setTranscription('');
                    setTranslationResult('');
                    setDetectedLanguage('');
                  } catch (error) {
                    alert('Could not process the selected audio file.');
                  } finally {
                    setIsPreparingAudio(false);
                  }
                }
              }}
              className={uploadInputClass}
              disabled={isPreparingAudio}
            />
          </section>

          <section className={panelClass}>
            <button
              onClick={() => runTranscription()}
              disabled={!audioFile || isTranscribing || isPreparingAudio}
              className="w-full rounded-xl border border-yellow-400/60 bg-gradient-to-r from-yellow-500 to-amber-600 px-6 py-3 text-base font-semibold text-white shadow transition-all duration-200 hover:shadow-yellow-500/40 disabled:cursor-not-allowed disabled:border-gray-700 disabled:bg-gray-700 disabled:text-white/50 disabled:shadow-none"
              style={{ color: '#ffffff' }}
            >
              {isTranscribing ? 'Transcribing...' : 'Transcribe Audio'}
            </button>
          </section>

          {audioFile && (
            <div className={audioReadyClass}>
              Audio ready for transcription ({audioFile.size ? Math.round(audioFile.size / 1024) + ' KB' : 'File loaded'})
            </div>
          )}

          {transcription && (
            <section className={panelClass}>
              <label className={`block text-sm font-bold italic ${isDarkMode ? 'text-white/80' : 'text-gray-700'}`}>Step 3: Review What You Said</label>
              <textarea
                value={transcription}
                onChange={(event) => setTranscription(event.target.value)}
                className={textAreaClass}
              />
              {detectedLanguage && (
                <p className={`text-sm ${isDarkMode ? 'text-white/80' : 'text-gray-700'}`}>
                  Detected language: {(LANGUAGE_OPTIONS.find((opt) => opt.code === detectedLanguage)?.label || detectedLanguage)}
                </p>
              )}
            </section>
          )}

          {transcription && (
            <section className={panelClass}>
              <label className={`block text-sm font-bold italic ${isDarkMode ? 'text-white/80' : 'text-gray-700'}`}>Step 4: Select a language to translate</label>
              <select
                value={translationLanguage}
                onChange={(event) => setTranslationLanguage(event.target.value)}
                className={fieldClass}
              >
                {LANGUAGE_OPTIONS.map((option) => (
                  <option key={option.code} value={option.code}>
                    {option.label}
                  </option>
                ))}
              </select>
              <button
                onClick={translateText}
                disabled={isTranslating || isPreparingAudio}
                className="w-full rounded-xl border border-yellow-400/60 bg-gradient-to-r from-yellow-500 to-amber-600 px-6 py-3 text-base font-semibold text-white shadow transition-all duration-200 hover:shadow-yellow-500/40 disabled:cursor-not-allowed disabled:border-gray-700 disabled:bg-gray-700 disabled:text-white/50 disabled:shadow-none"
                style={{ color: '#ffffff' }}
              >
                {isTranslating ? 'Translating...' : 'Translate Text'}
              </button>
            </section>
          )}

          {translationResult && (
            <section className={panelClass}>
              <h2 className={`text-base font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Translated Result</h2>
              <div className={isDarkMode
                ? 'min-h-[120px] whitespace-pre-wrap rounded-xl border border-gray-700 bg-black px-4 py-3 text-sm text-white'
                : 'min-h-[120px] whitespace-pre-wrap rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm text-gray-900'}>
                {translationResult}
              </div>
            </section>
          )}

          {(audioFile || transcription) && (
            <button
              onClick={clearAll}
              className="w-full rounded-xl border-2 border-yellow-300/80 bg-gradient-to-r from-yellow-200 via-yellow-300 to-orange-300 px-6 py-3 text-sm font-semibold text-black transition-colors hover:from-yellow-300 hover:via-yellow-400 hover:to-orange-400 hover:border-yellow-200"
            >
              Clear All
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default VoiceTranslation;

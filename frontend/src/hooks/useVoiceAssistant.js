import { useState, useEffect, useCallback, useRef } from 'react';

// Multilingual voice prompts for onboarding and actions
export const VOICE_PROMPTS = {
  en: {
    name: 'English',
    welcome: 'Welcome to Kissan Drishti. Tap the screen or upload a photo to scan your sick plant.',
    analyzing: 'Scanning leaf. Please hold steady.',
    success: 'Diagnosis complete. Viewing your cure plan.',
    cameraDenied: 'Camera permission denied. Please allow access or upload a photo.',
    askDoctor: 'Speak your question. For example: How much medicine should I spray per pump?'
  },
  hi: {
    name: 'हिन्दी (Hindi)',
    welcome: 'किस्सान दृष्टि में आपका स्वागत है। अपनी बीमार फसल को स्कैन करने के लिए स्क्रीन पर कहीं भी टैप करें या फोटो अपलोड करें।',
    analyzing: 'पत्ती की जांच हो रही है। कृपया फोन स्थिर रखें।',
    success: 'जांच पूरी हो गई है। उपचार योजना देखें।',
    cameraDenied: 'कैमरा अनुमति अस्वीकार कर दी गई। कृपया अनुमति दें या फोटो अपलोड करें।',
    askDoctor: 'अपना सवाल बोलें। जैसे: एक पंप में कितनी दवा डालनी चाहिए?'
  },
  te: {
    name: 'తెలుగు (Telugu)',
    welcome: 'కిస్సాన్ దృష్టికి స్వాగతం. మీ వ్యాధిగ్రస్తులైన మొక్కను స్కాన్ చేయడానికి స్క్రీన్‌పై నొక్కండి లేదా ఫోటో అప్‌లోడ్ చేయండి.',
    analyzing: 'ఆకును స్కాన్ చేస్తోంది. దయచేసి స్థిరంగా ఉంచండి.',
    success: 'రోగ నిర్ధారణ పూర్తయింది. నివారణ ప్రణాళికను చూడండి.',
    cameraDenied: 'కెమెరా అనుమతి నిరాకరించబడింది. దయచేసి అనుమతించండి లేదా ఫోటో అప్‌లోడ్ చేయండి.',
    askDoctor: 'మీ ప్రశ్నను మాట్లాడండి. ఉదాహరణకు: పంపుకు ఎంత మందు పిచికారీ చేయాలి?'
  },
  mr: {
    name: 'मराठी (Marathi)',
    welcome: 'किस्सान दृष्टी मध्ये आपले स्वागत आहे. तुमचे आजारी पीक स्कॅन करण्यासाठी स्क्रीनवर स्पर्श करा किंवा फोटो अपलोड करा.',
    analyzing: 'पानाची तपासणी सुरू आहे. कृपया फोन स्थिर ठेवा.',
    success: 'तपासणी पूर्ण झाली. उपचार योजना पहा.',
    cameraDenied: 'कॅमेरा परवानगी नाकारली गेली. कृपया परवानगी द्या किंवा फोटो अपलोड करा.',
    askDoctor: 'तुमचा प्रश्न बोला. उदाहरणार्थ: एका पंपासाठी किती औषध वापरावे?'
  }
};

/**
 * Hook to handle Web Speech Synthesis (Text-to-Speech)
 * and Web Speech Recognition (Speech-to-Text voice questions for farmers)
 */
export function useVoiceAssistant(initialLanguage = 'en') {
  const [language, setLanguage] = useState(initialLanguage);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [speechError, setSpeechError] = useState(null);
  const [isSupported, setIsSupported] = useState(false);
  const [isRecognitionSupported, setIsRecognitionSupported] = useState(false);

  const synthRef = useRef(null);
  const recognitionRef = useRef(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      if ('speechSynthesis' in window) {
        synthRef.current = window.speechSynthesis;
        setIsSupported(true);
      }

      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (SpeechRecognition) {
        setIsRecognitionSupported(true);
      }
    }
  }, []);

  // Web Audio API synthesized shutter sound effect
  const playShutterSound = useCallback(() => {
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (!AudioContext) return;
      const ctx = new AudioContext();

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(800, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(200, ctx.currentTime + 0.08);

      gain.gain.setValueAtTime(0.4, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.08);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.09);
    } catch (e) {
      console.warn('Audio synthesis failed:', e);
    }
  }, []);

  // Speak a text message using Web Speech Synthesis
  const speak = useCallback((text, langCode = language) => {
    if (!synthRef.current || !text) return;

    try {
      synthRef.current.cancel();

      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.95; // slightly slower for better rural clarity
      utterance.pitch = 1.0;

      const langMap = {
        en: 'en-IN',
        hi: 'hi-IN',
        te: 'te-IN',
        mr: 'mr-IN'
      };
      utterance.lang = langMap[langCode] || 'en-US';

      const voices = synthRef.current.getVoices?.() || [];
      const matchVoice = voices.find((v) => v.lang.startsWith(utterance.lang) || v.lang.startsWith(langCode));
      if (matchVoice) {
        utterance.voice = matchVoice;
      }

      utterance.onstart = () => setIsSpeaking(true);
      utterance.onend = () => setIsSpeaking(false);
      utterance.onerror = () => setIsSpeaking(false);

      synthRef.current.speak(utterance);
    } catch (err) {
      console.warn('Speech synthesis error:', err);
      setIsSpeaking(false);
    }
  }, [language]);

  // Stop current speech
  const stopSpeaking = useCallback(() => {
    if (synthRef.current) {
      synthRef.current.cancel();
      setIsSpeaking(false);
    }
  }, []);

  // Listen to farmer speaking using SpeechRecognition
  const startListening = useCallback((onResultCallback) => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setSpeechError('Voice recognition not supported in this browser. Please type your question.');
      return;
    }

    try {
      stopSpeaking();

      if (recognitionRef.current) {
        try { recognitionRef.current.abort(); } catch (_) {}
      }

      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;

      const langMap = {
        en: 'en-IN',
        hi: 'hi-IN',
        te: 'te-IN',
        mr: 'mr-IN'
      };
      recognition.lang = langMap[language] || 'en-US';

      recognition.onstart = () => {
        setIsListening(true);
        setSpeechError(null);
      };

      recognition.onresult = (event) => {
        const transcriptText = event.results?.[0]?.[0]?.transcript;
        if (transcriptText) {
          if (onResultCallback) {
            onResultCallback(transcriptText);
          }
        }
      };

      recognition.onerror = (event) => {
        console.warn('Speech recognition error:', event.error);
        setIsListening(false);
        if (event.error === 'not-allowed') {
          setSpeechError('Microphone permission denied.');
        }
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (err) {
      console.warn('Could not start recognition:', err);
      setIsListening(false);
    }
  }, [language, stopSpeaking]);

  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (_) {}
      setIsListening(false);
    }
  }, []);

  return {
    language,
    setLanguage,
    isSpeaking,
    isListening,
    isSupported,
    isRecognitionSupported,
    speechError,
    speak,
    stopSpeaking,
    startListening,
    stopListening,
    playShutterSound,
    prompts: VOICE_PROMPTS[language] || VOICE_PROMPTS.en
  };
}

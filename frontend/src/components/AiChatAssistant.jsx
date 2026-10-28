import { useState, useRef, useEffect } from 'react';
import { AiVisualAvatar } from './AiVisualAvatar';
import { API_ENDPOINTS } from '../config/api';
import { 
  Bot, 
  User, 
  Mic, 
  MicOff, 
  Send, 
  Volume2, 
  VolumeX, 
  Sparkles, 
  ShieldCheck, 
  Droplets, 
  HelpCircle,
  Leaf
} from 'lucide-react';

/**
 * AI Chat Assistant for Farmers (Dr. Kissan / किसान सहायक)
 * - Supports Voice Input (Microphone Speech-to-Text)
 * - Voice Output (Text-to-Speech readout for illiterate farmers)
 * - Quick one-tap farmer questions with prominent visual cards
 * - Works seamlessly on both Desktop PC and Mobile screens
 */
export function AiChatAssistant({
  language = 'en',
  diseaseContext = null,
  onSpeak,
  isSpeaking = false,
  onStopSpeaking,
  startListening,
  stopListening,
  isListening = false,
  speechError = null
}) {
  const [messages, setMessages] = useState([
    {
      id: 'welcome',
      sender: 'bot',
      text: language === 'hi'
        ? 'नमस्ते किसान भाई! मैं आपका फसल डॉक्टर हूँ। अपनी फसल, दवा की मात्रा, या जैविक उपचार के बारे में कोई भी सवाल बोलकर या लिखकर पूछें।'
        : language === 'te'
        ? 'నమస్కారం రైతు సోదరా! నేను మీ పంట డాక్టర్‌ని. పంట తెగుళ్లు, మందుల మోతాదు లేదా సేంద్రీయ నివారణల గురించి నన్ను అడగండి.'
        : 'Hello Farmer Friend! I am your Kissan Drishti Crop Doctor. Ask me anything about plant diseases, spray dosages, or organic cures.',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);

  const [inputQuery, setInputQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const chatBottomRef = useRef(null);

  // Auto-scroll to bottom of chat
  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  // Farmer quick questions based on language
  const quickQuestions = [
    {
      icon: <Droplets size={18} className="quick-icon-blue" />,
      label: language === 'hi' ? 'दवा की सही मात्रा (प्रति पंप)' : language === 'te' ? 'స్ప్రేయర్ పంపుకు ఎంత మందు?' : 'Dosage per spray pump',
      query: language === 'hi' ? '15 लीटर स्प्रेयर पंप में कितनी दवा मिलानी चाहिए?' : language === 'te' ? '15 లీటర్ల స్ప్రేయర్ పంపులో ఎంత మందు కలపాలి?' : 'How much medicine should I mix in a 15L sprayer pump?'
    },
    {
      icon: <Leaf size={18} className="quick-icon-green" />,
      label: language === 'hi' ? 'जैविक नीम काढ़ा कैसे बनाएं?' : language === 'te' ? 'సేంద్రీయ వేప నూనె మిశ్రమం' : 'Organic neem spray recipe',
      query: language === 'hi' ? 'नीम के तेल का जैविक छिड़काव कैसे तैयार करें?' : language === 'te' ? 'సేంద్రీయ వేప నూనెను ఎలా తయారు చేయాలి?' : 'How to prepare organic neem oil spray?'
    },
    {
      icon: <ShieldCheck size={18} className="quick-icon-orange" />,
      label: language === 'hi' ? 'छिड़काव का सही समय' : language === 'te' ? 'పిచికారీకి సరైన సమయం' : 'Best time to spray',
      query: language === 'hi' ? 'दवा छिड़कने का सबसे सही समय और मौसम क्या है?' : language === 'te' ? 'మందు పిచికారీ చేయడానికి సరైన సమయం ఏది?' : 'What is the best time of day to spray fungicide?'
    }
  ];

  const handleSendMessage = async (userText) => {
    const text = userText || inputQuery;
    if (!text.trim()) return;

    const userMsg = {
      id: Date.now().toString(),
      sender: 'user',
      text: text.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputQuery('');
    setIsLoading(true);
    try {
      // Send to FastAPI backend endpoint (proxied automatically in dev or remote URL in prod)
      const response = await fetch(API_ENDPOINTS.chat, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: text,
          language: language,
          disease_context: diseaseContext?.disease_name || 'Tomato Early Blight'
        })
      });

      if (response.ok) {
        const data = await response.json();
        const botMsg = {
          id: (Date.now() + 1).toString(),
          sender: 'bot',
          text: data.reply,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };
        setMessages((prev) => [...prev, botMsg]);
        // Speak response aloud for accessibility
        onSpeak?.(data.reply);
      } else {
        throw new Error('Backend chat response error');
      }
    } catch (err) {
      // Intelligent offline / fallback responses tailored for farmers
      let fallbackReply = '';
      const lower = text.toLowerCase();
      if (lower.includes('dosage') || lower.includes('pump') || lower.includes('मात्रा') || lower.includes('పంపు')) {
        fallbackReply = language === 'hi'
          ? 'कॉपर फफूंदनाशक: 3 ग्राम प्रति लीटर पानी (15 लीटर के एक पंप में 45 ग्राम)। सुबह 7 से 10 बजे के बीच छिड़कें।'
          : language === 'te'
          ? 'కాపర్ శిలీంద్ర సంహారిణి: లీటరు నీటికి 3 గ్రాములు (15 లీటర్ల పంపులో 45 గ్రాములు). ఉదయం పూట పిచికారీ చేయండి.'
          : 'Standard dosage: Mix 3 grams per 1 Litre of clean water (45g per 15L knapsack pump). Spray during early morning hours.';
      } else if (lower.includes('neem') || lower.includes('organic') || lower.includes('नीम') || lower.includes('వేప')) {
        fallbackReply = language === 'hi'
          ? 'जैविक उपचार: 1 लीटर पानी में 5 मिली नीम का तेल और 1 मिली शैम्पू मिलाकर हर 7 दिन में छिड़कें।'
          : language === 'te'
          ? 'సేంద్రీయ చికిత్స: 1 లీటరు నీటిలో 5 మి.లీ వేప నూనె మరియు 1 మి.లీ సబ్బు కలిపి ప్రతి 7 రోజులకు పిచికారీ చేయండి.'
          : 'Organic Cure: Mix 5ml cold-pressed neem oil + 1ml liquid soap per 1 litre of water. Spray once every 7 days.';
      } else {
        fallbackReply = language === 'hi'
          ? 'रोग को फैलने से रोकने के लिए संक्रमित पत्तियों को तुरंत तोड़कर खेत से दूर फेंकें, और ऊपर से पत्तियों पर पानी छिड़कने से बचें।'
          : language === 'te'
          ? 'వ్యాధి వ్యాప్తి చెందకుండా ఉండటానికి సోకిన ఆకులను తీసివేసి పొలం బయట పారవేయండి. పైనుంచి నీరు చల్లవద్దు.'
          : 'To prevent spread, immediately prune heavily infected leaves and burn/dispose them away from your field. Avoid overhead watering.';
      }

      const botMsg = {
        id: (Date.now() + 1).toString(),
        sender: 'bot',
        text: fallbackReply,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages((prev) => [...prev, botMsg]);
      onSpeak?.(fallbackReply);
    } finally {
      setIsLoading(false);
    }
  };

  // Trigger microphone speech-to-text
  const handleMicClick = () => {
    if (isListening) {
      stopListening?.();
    } else {
      startListening?.((spokenText) => {
        if (spokenText) {
          handleSendMessage(spokenText);
        }
      });
    }
  };

  return (
    <div className="ai-chat-assistant-container">
      {/* Assistant Header */}
      <div className="chat-header">
        <div className="chat-header-info">
          <div className="doctor-avatar">
            <Bot size={22} />
            <span className="online-dot" />
          </div>
          <div>
            <h3 className="doctor-name">
              {language === 'hi' ? 'डॉ. किस्सान सहायक' : language === 'te' ? 'డాక్టర్ కిస్సాన్' : 'Dr. Kissan - AI Crop Assistant'}
            </h3>
            <p className="doctor-status">
              <Sparkles size={12} className="sparkle-active" />
              {language === 'hi' ? 'ऑनलाइन • बोलकर पूछें' : language === 'te' ? 'ఆన్‌లైన్ • మాట్లాడండి' : 'Active • Voice Enabled'}
            </p>
          </div>
        </div>

        {isSpeaking && (
          <button
            type="button"
            className="btn-stop-audio"
            onClick={onStopSpeaking}
            title="Stop audio readout"
          >
            <VolumeX size={16} />
            <span>Stop Audio</span>
          </button>
        )}
      </div>

      {/* Animated Visual Avatar (Robot Robo-Kissan / Human Crop Doctor) */}
      <AiVisualAvatar
        isSpeaking={isSpeaking}
        isListening={isListening}
        isLoading={isLoading}
        language={language}
      />

      {/* Disease Context Pill if already diagnosed */}
      {diseaseContext && (
        <div className="chat-context-banner">
          <span className="context-label">Analyzing Context:</span>
          <span className="context-disease">{diseaseContext.disease_name || 'Tomato Early Blight'}</span>
        </div>
      )}

      {/* Messages Feed */}
      <div className="chat-messages-scroll">
        {messages.map((msg) => (
          <div key={msg.id} className={`chat-message-row ${msg.sender === 'user' ? 'row-user' : 'row-bot'}`}>
            <div className={`message-avatar ${msg.sender === 'user' ? 'avatar-user' : 'avatar-bot'}`}>
              {msg.sender === 'user' ? <User size={16} /> : <Bot size={16} />}
            </div>

            <div className={`message-bubble ${msg.sender === 'user' ? 'bubble-user' : 'bubble-bot'}`}>
              <p className="bubble-text">{msg.text}</p>
              
              <div className="bubble-footer">
                <span className="bubble-time">{msg.timestamp}</span>

                {/* Prominent Listen Aloud Button for Farmers */}
                {msg.sender === 'bot' && (
                  <button
                    type="button"
                    className="btn-listen-bubble"
                    onClick={() => onSpeak?.(msg.text)}
                    aria-label="Listen to message aloud"
                  >
                    <Volume2 size={14} />
                    <span>{language === 'hi' ? 'सुनें' : language === 'te' ? 'వినండి' : 'Listen'}</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="chat-message-row row-bot">
            <div className="message-avatar avatar-bot">
              <Bot size={16} />
            </div>
            <div className="message-bubble bubble-bot loading-bubble">
              <div className="typing-dot" />
              <div className="typing-dot" />
              <div className="typing-dot" />
            </div>
          </div>
        )}

        <div ref={chatBottomRef} />
      </div>

      {/* Quick Farmer Prompts Bar */}
      <div className="quick-prompts-bar">
        <span className="quick-prompts-title">
          <HelpCircle size={14} />
          {language === 'hi' ? 'जल्दी पूछें:' : language === 'te' ? 'త్వరిత ప్రశ్నలు:' : 'Quick Questions:'}
        </span>
        <div className="quick-buttons-row">
          {quickQuestions.map((q, idx) => (
            <button
              key={idx}
              type="button"
              className="btn-quick-chip"
              onClick={() => handleSendMessage(q.query)}
            >
              {q.icon}
              <span>{q.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Microphone Listening Active Banner */}
      {isListening && (
        <div className="mic-listening-active-banner">
          <div className="pulsing-mic-wave">
            <Mic size={20} className="wave-icon" />
          </div>
          <p className="listening-text">
            {language === 'hi' ? 'सुन रहे हैं... अपना सवाल बोलें' : language === 'te' ? 'వింటున్నాము... మాట్లాడండి' : 'Listening... Speak your crop question'}
          </p>
          <button type="button" className="btn-cancel-listen" onClick={stopListening}>
            Cancel
          </button>
        </div>
      )}

      {speechError && (
        <div className="speech-error-hint">
          <span>{speechError}</span>
        </div>
      )}

      {/* Chat Input Bar */}
      <div className="chat-input-bar">
        {/* Large Prominent Microphone Button */}
        <button
          type="button"
          className={`btn-mic-main ${isListening ? 'listening' : ''}`}
          onClick={handleMicClick}
          aria-label={isListening ? 'Stop listening' : 'Speak your question'}
          title="Tap to speak in your language"
        >
          {isListening ? <MicOff size={22} /> : <Mic size={22} />}
        </button>

        {/* Text Input for Typing */}
        <input
          type="text"
          className="chat-text-input"
          placeholder={
            language === 'hi'
              ? 'दवा या रोग के बारे में पूछें...'
              : language === 'te'
              ? 'ప్రశ్నను ఇక్కడ రాయండి లేదా మాట్లాడండి...'
              : 'Ask a question or tap mic to speak...'
          }
          value={inputQuery}
          onChange={(e) => setInputQuery(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
        />

        {/* Send Button */}
        <button
          type="button"
          className="btn-send-message"
          onClick={() => handleSendMessage()}
          disabled={!inputQuery.trim() || isLoading}
          aria-label="Send message"
        >
          <Send size={18} />
        </button>
      </div>
    </div>
  );
}

export default AiChatAssistant;

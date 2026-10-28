import { useState } from 'react';
import { Bot, User, Sparkles, Volume2, Mic, Activity } from 'lucide-react';

/**
 * AiVisualAvatar Component
 * Animated Visual Avatar for the AI Chat Assistant with switchable
 * "Futuristic Agricultural Robot (Robo-Kissan)" and "Human Crop Doctor" modes.
 * Features:
 * - Dynamic talking mouth equalizer when speaking (isSpeaking)
 * - Pulsing neural glow when listening (isListening)
 * - Holographic scan ring when analyzing (isLoading)
 * - Mode toggle (Robot / Human Doctor)
 */
export function AiVisualAvatar({
  isSpeaking = false,
  isListening = false,
  isLoading = false,
  language = 'en',
  onAvatarClick
}) {
  const [avatarMode, setAvatarMode] = useState('robot'); // 'robot' or 'human'

  return (
    <div className="ai-avatar-widget" onClick={onAvatarClick}>
      {/* Mode Switcher Pill */}
      <div className="avatar-mode-switch" onClick={(e) => e.stopPropagation()}>
        <button
          type="button"
          className={`mode-btn ${avatarMode === 'robot' ? 'active' : ''}`}
          onClick={() => setAvatarMode('robot')}
          title="Switch to Robo-Kissan Avatar"
        >
          <Bot size={13} />
          <span>Robot</span>
        </button>
        <button
          type="button"
          className={`mode-btn ${avatarMode === 'human' ? 'active' : ''}`}
          onClick={() => setAvatarMode('human')}
          title="Switch to Human Doctor Avatar"
        >
          <User size={13} />
          <span>Doctor</span>
        </button>
      </div>

      {/* Hologram Stage / Platform */}
      <div className={`avatar-stage ${isSpeaking ? 'stage-speaking' : ''} ${isListening ? 'stage-listening' : ''} ${isLoading ? 'stage-thinking' : ''}`}>
        {/* Holographic Glowing Rings */}
        <div className="holo-ring-outer" />
        <div className="holo-ring-inner" />
        <div className="holo-scan-beam" />

        {avatarMode === 'robot' ? (
          /* ===================================================
             FUTURISTIC AGRICULTURAL ROBOT (ROBO-KISSAN)
             =================================================== */
          <div className="robot-chassis">
            {/* Robot Antenna with Signal Node */}
            <div className="robot-antenna">
              <span className="antenna-stem" />
              <span className={`antenna-orb ${isListening ? 'orb-listening' : ''} ${isSpeaking ? 'orb-speaking' : ''}`} />
              {isListening && <span className="antenna-sonar-wave" />}
            </div>

            {/* Robot Head */}
            <div className={`robot-head ${isSpeaking ? 'head-speaking' : ''}`}>
              {/* Ear Sensors / Bolts */}
              <div className="robot-ear left" />
              <div className="robot-ear right" />

              {/* Visor & Glowing Digital Eyes */}
              <div className="robot-visor">
                <div className={`visor-scanline ${isLoading ? 'fast-scan' : ''}`} />
                <div className="robot-eyes-row">
                  <span className={`robot-eye left ${isSpeaking ? 'eye-pulsing' : ''}`} />
                  <span className={`robot-eye right ${isSpeaking ? 'eye-pulsing' : ''}`} />
                </div>
              </div>

              {/* Digital Audio Equalizer Mouth (Reacts to Voice) */}
              <div className={`robot-mouth ${isSpeaking ? 'mouth-talking' : ''}`}>
                <span className="eq-bar bar-1" />
                <span className="eq-bar bar-2" />
                <span className="eq-bar bar-3" />
                <span className="eq-bar bar-4" />
                <span className="eq-bar bar-5" />
              </div>
            </div>

            {/* Robot Chest & Energy Core */}
            <div className="robot-torso">
              <div className="torso-badge">
                <span className="leaf-brand">🌱</span>
              </div>
              <div className={`energy-core ${isSpeaking ? 'core-active' : ''}`} />
            </div>
          </div>
        ) : (
          /* ===================================================
             HUMAN CROP DOCTOR (DR. KISSAN)
             =================================================== */
          <div className="human-doctor-frame">
            {/* Doctor Head */}
            <div className={`doctor-head-box ${isSpeaking ? 'head-talking' : ''}`}>
              {/* Doctor Headset / Stethoscope ear piece */}
              <div className="doctor-headset">
                <span className="headset-band" />
                <span className={`headset-mic ${isListening ? 'mic-glow' : ''}`} />
              </div>

              {/* Doctor Face */}
              <div className="doctor-face">
                {/* Hair / Cap */}
                <div className="doctor-hair" />
                {/* Eyes with natural blinking */}
                <div className="doctor-eyes-row">
                  <span className="human-eye left"><span className="pupil" /></span>
                  <span className="human-eye right"><span className="pupil" /></span>
                </div>
                {/* Cheeks */}
                <div className="doctor-cheeks">
                  <span className="cheek left" />
                  <span className="cheek right" />
                </div>
                {/* Animated Speech Mouth */}
                <div className={`doctor-mouth ${isSpeaking ? 'speaking-lips' : ''}`} />
              </div>
            </div>

            {/* Doctor Lab Coat & Stethoscope */}
            <div className="doctor-torso">
              <div className="doctor-coat">
                <div className="stethoscope-tube" />
                <div className="doctor-id-badge">
                  <span>DR</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Dynamic Status Tagline */}
      <div className="avatar-status-pill">
        {isListening ? (
          <span className="status-text listening">
            <Mic size={12} className="icon-pulse" />
            {language === 'hi' ? 'आपकी बात सुन रहा हूँ...' : language === 'te' ? 'వింటున్నాను...' : 'Listening to your voice...'}
          </span>
        ) : isSpeaking ? (
          <span className="status-text speaking">
            <Volume2 size={12} className="icon-pulse" />
            {language === 'hi' ? 'उपचार बता रहा हूँ...' : language === 'te' ? 'సమాధానం చెబుతున్నాను...' : 'Speaking advice...'}
          </span>
        ) : isLoading ? (
          <span className="status-text analyzing">
            <Activity size={12} className="icon-spin" />
            {language === 'hi' ? 'फसल की जांच हो रही है...' : language === 'te' ? 'పరిశీలిస్తున్నాను...' : 'Analyzing plant symptoms...'}
          </span>
        ) : (
          <span className="status-text ready">
            <Sparkles size={12} className="icon-sparkle" />
            {avatarMode === 'robot'
              ? (language === 'hi' ? 'रोबो-किस्सान तैयार है' : 'Robo-Kissan Ready')
              : (language === 'hi' ? 'डॉ. किस्सान ऑनलाइन हैं' : 'Dr. Kissan Online')}
          </span>
        )}
      </div>
    </div>
  );
}

export default AiVisualAvatar;

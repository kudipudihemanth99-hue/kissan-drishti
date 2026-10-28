# Kissan Drishti (किस्सान दृष्टि) 🌾
### Mobile-First Plant Disease Diagnostic PWA for Farmers

An AI-powered progressive web application built to empower farmers to diagnose crop diseases directly via their smartphone cameras, bypass literacy barriers through voice assistance, and access direct e-commerce links to purchase chemical and organic cures.

---

## 🏗 Project Architecture

```
k.d/
├── frontend/                   # React PWA (Vite + Vanilla CSS + Lucide Icons)
│   ├── public/                 # PWA Manifest & Icons
│   ├── src/
│   │   ├── components/         # CameraViewfinder, DiagnosticCard, CurePlan
│   │   ├── hooks/              # useCamera (WebRTC), useVoiceAssistant (Web Speech)
│   │   ├── App.jsx             # Main Application shell
│   │   └── index.css           # Tactile, mobile-first farm design system
│   └── package.json
│
├── backend/                    # Python AI Inference Server
│   ├── app/
│   │   └── main.py             # FastAPI REST endpoints (/api/diagnose)
│   └── requirements.txt        # FastAPI, Uvicorn, Pillow, PyTorch
└── README.md
```

---

## 🚀 Getting Started

### 1. Frontend (React PWA)

```bash
cd frontend
npm install --legacy-peer-deps
npm run dev
```

The app will run locally at `http://localhost:5173`.
To test on your smartphone:
1. Ensure your phone and computer are on the same Wi-Fi network.
2. Run `npm run dev -- --host 0.0.0.0`.
3. Open `http://<YOUR_COMPUTER_IP>:5173` on your smartphone browser (Chrome/Safari).
   *(Note: Browsers require HTTPS for camera access unless accessing `localhost` or local IPs configured in `chrome://flags`)*.

### 2. Backend (FastAPI AI Layer)

```bash
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

---

## 📱 Features Implemented in Phase 1

1. **Live WebRTC Camera Interface**:
   - Primary rear-facing camera access (`facingMode: { ideal: 'environment' }`).
   - Graceful fallback for non-mobile or laptop testing environments.
   - Screen tap-to-capture & tactile shutter button.
   - Hardware torch/flashlight toggle.
   - Frame capture directly via HTML5 `<canvas>` converted to Base64 JPEG.
2. **Voice Onboarding & Feedback**:
   - Web Speech API speech synthesis upon launch: *"Tap the screen to scan your sick plant"*.
   - Multilingual support (English, Hindi, Telugu, Marathi).
   - Web Audio API synthesized shutter sound effect.
3. **Graceful Error Handling**:
   - Denied permission handling with retry and photo upload fallback.

---

## ☁️ Deployment Guide

### 1. Backend Deployment (Render or Google Cloud Run)

#### Option A: Render (Easiest)
1. Push your repository to GitHub.
2. Sign in to [Render Dashboard](https://dashboard.render.com/) and click **New > Web Service**.
3. Connect your GitHub repository.
4. Set the following settings:
   - **Root Directory**: `backend`
   - **Environment**: `Docker` (or select `render.yaml` Blueprint)
   - **Health Check Path**: `/api/health`
5. Add Environment Variables:
   - `ALLOWED_ORIGINS`: `*` (or your production frontend URL once deployed, e.g. `https://kissan-drishti.vercel.app`)
6. Click **Deploy Web Service**. Render will output your live URL (e.g., `https://kissan-drishti-backend.onrender.com`).

#### Option B: Google Cloud Run (Containerized)
```bash
# Authenticate and configure Google Cloud
gcloud auth login
gcloud config set project YOUR_GCP_PROJECT_ID

# Deploy directly from the backend directory using Cloud Build
gcloud run deploy kissan-drishti-backend \
  --source ./backend \
  --region us-central1 \
  --platform managed \
  --allow-unauthenticated \
  --set-env-vars ALLOWED_ORIGINS="*"
```

---

### 2. Frontend Deployment (Vercel or Netlify)

#### Option A: Vercel (Recommended)
1. Sign in to [Vercel](https://vercel.com/) and click **Add New > Project**.
2. Import your GitHub repository.
3. Configure Project Settings:
   - **Root Directory**: `frontend` (or leave default if using root `vercel.json`)
   - **Framework Preset**: `Vite`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
4. Add Environment Variable:
   - `VITE_API_URL`: Your deployed backend URL without trailing slash (e.g. `https://kissan-drishti-backend.onrender.com`).
5. Click **Deploy**.

#### Option B: Netlify
1. Sign in to [Netlify](https://app.netlify.com/) and click **Add new site > Import an existing project**.
2. Select your repository. Netlify will automatically detect `netlify.toml`:
   - **Base directory**: `frontend`
   - **Build command**: `npm run build`
   - **Publish directory**: `dist`
3. In **Site configuration > Environment variables**, add:
   - `VITE_API_URL`: `https://your-backend-url.onrender.com`
4. Click **Deploy**.


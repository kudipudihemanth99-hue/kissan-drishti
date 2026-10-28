#!/usr/bin/env bash
# ==============================================================================
# Kissan Drishti - Instant Private Sharing Script (via Cloudflare Tunnel)
# ==============================================================================
# Starts Backend (FastAPI) + Frontend (Vite) + Instant Cloudflare Tunnel
# No account or signup required. Automatically shuts down when you press Ctrl+C.
# ==============================================================================

set -e
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
export PATH="/home/hemanth209/.local/bin:/home/hemanth209/.nvm/versions/node/v20.20.2/bin:$PATH"

echo "🌾 Starting Kissan Drishti Full-Stack Application..."

# Free ports 8000 & 5173 if left open by a previous run
fuser -k 8000/tcp 5173/tcp 2>/dev/null || true
rm -f /tmp/cloudflared.log /tmp/kd_vite.log
cd "$PROJECT_ROOT/backend"
if [ ! -d "venv" ]; then
    echo "Creating virtual environment..."
    python3 -m venv venv
    venv/bin/pip install -r requirements.txt
fi

echo "🚀 Starting Backend on http://127.0.0.1:8000..."
venv/bin/uvicorn app.main:app --host 127.0.0.1 --port 8000 &
BACKEND_PID=$!

# 2. Start Vite Frontend
cd "$PROJECT_ROOT/frontend"
echo "⚡ Starting Vite Frontend on http://127.0.0.1:5173..."
npm run dev -- --host 127.0.0.1 --port 5173 > /tmp/kd_vite.log 2>&1 &
FRONTEND_PID=$!

# Cleanup handler on exit or Ctrl+C
cleanup() {
    echo ""
    echo "🛑 Shutting down Kissan Drishti..."
    kill $TUNNEL_PID 2>/dev/null || true
    kill $FRONTEND_PID 2>/dev/null || true
    kill $BACKEND_PID 2>/dev/null || true
    echo "✅ All services stopped."
    exit 0
}
trap cleanup SIGINT SIGTERM EXIT

# Give servers 2 seconds to initialize
sleep 2

# 3. Start Cloudflare Tunnel
echo "🌐 Creating secure HTTPS tunnel for your selected users..."
cloudflared tunnel --url http://127.0.0.1:5173 2> /tmp/cloudflared.log &
TUNNEL_PID=$!

# Wait for tunnel URL to appear in log
TUNNEL_URL=""
for i in {1..20}; do
    TUNNEL_URL=$(grep -o 'https://[a-zA-Z0-9.-]*\.trycloudflare\.com' /tmp/cloudflared.log | head -n 1 || true)
    if [ -n "$TUNNEL_URL" ]; then
        break
    fi
    sleep 1
done

echo ""
echo "=========================================================================="
echo "  🌾 KISSAN DRISHTI IS LIVE FOR YOUR SELECTED USERS!"
echo "=========================================================================="
echo ""
if [ -n "$TUNNEL_URL" ]; then
    echo "  👉 Send this private link to your users:"
    echo "     $TUNNEL_URL"
else
    echo "  ⚠️ Tunnel is initializing. Check /tmp/cloudflared.log for details."
fi
echo ""
echo "  • Works on any smartphone browser (Chrome / Safari / Edge)"
echo "  • Valid HTTPS: Live camera scanner & voice assistant fully enabled"
echo "  • Zero signup or cloud account required"
echo "  • Completely private: Only people with this URL can access it"
echo ""
echo "  👉 Press Ctrl+C anytime to STOP sharing and turn off access."
echo "=========================================================================="
echo ""

# Keep running until Ctrl+C
wait $TUNNEL_PID

#!/usr/bin/env bash
# ═══════════════════════════════════════════════════════════════
#  POCKET GURU AI — Server Setup Wizard
#  Run once on a fresh server after:
#    git clone <repo> pocketguru-staging && cd pocketguru-staging
# ═══════════════════════════════════════════════════════════════
set -euo pipefail

# ── Colours ─────────────────────────────────────────────────────
RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'
BLUE='\033[0;34m'; CYAN='\033[0;36m'; BOLD='\033[1m'; NC='\033[0m'

banner() { echo -e "\n${CYAN}${BOLD}$1${NC}"; }
info()   { echo -e "${BLUE}  ▸ $1${NC}"; }
ok()     { echo -e "${GREEN}  ✓ $1${NC}"; }
warn()   { echo -e "${YELLOW}  ⚠ $1${NC}"; }
die()    { echo -e "${RED}  ✗ $1${NC}" >&2; exit 1; }

prompt() {
  local var_name="$1" prompt_text="$2" default="${3:-}"
  local value
  if [[ -n "$default" ]]; then
    read -rp "  $(echo -e "${BOLD}${prompt_text}${NC}") [${default}]: " value
    echo "${value:-$default}"
  else
    read -rp "  $(echo -e "${BOLD}${prompt_text}${NC}"): " value
    echo "$value"
  fi
}

prompt_secret() {
  local prompt_text="$1"
  local value
  read -rsp "  $(echo -e "${BOLD}${prompt_text}${NC}"): " value
  echo
  echo "$value"
}

generate_random() {
  tr -dc 'A-Za-z0-9!@#$%^&*' </dev/urandom | head -c "${1:-32}"
}

# ── Header ──────────────────────────────────────────────────────
clear
echo -e "${CYAN}${BOLD}"
echo "  ╔═══════════════════════════════════════╗"
echo "  ║       POCKET GURU AI — Setup          ║"
echo "  ╚═══════════════════════════════════════╝"
echo -e "${NC}"
echo -e "  This wizard will configure your server and start the app."
echo -e "  You can re-run it at any time to update configuration.\n"

# ── Check we're in the right directory ──────────────────────────
[[ -f "docker-compose.yml" ]] || die "Run this script from the pocketguru-staging directory."

# ════════════════════════════════════════════════════════════════
#  SECTION 1 — Collect configuration
# ════════════════════════════════════════════════════════════════
banner "Step 1 of 5 — Domain & SSL"

echo -e "  Enter your domain name, or press Enter to use the server IP"
echo -e "  (for testing without a domain yet).\n"
DOMAIN=$(prompt DOMAIN "Domain name" "")

USE_SSL=false
ADMIN_EMAIL=""
if [[ -n "$DOMAIN" ]]; then
  echo
  read -rp "  $(echo -e "${BOLD}Set up SSL with Let's Encrypt? (y/n)${NC}") [y]: " ssl_choice
  ssl_choice="${ssl_choice:-y}"
  if [[ "$ssl_choice" =~ ^[Yy]$ ]]; then
    USE_SSL=true
    ADMIN_EMAIL=$(prompt ADMIN_EMAIL "Admin email (for SSL certificate)")
    [[ -z "$ADMIN_EMAIL" ]] && die "Admin email is required for SSL."
  fi
fi

# ── App settings ─────────────────────────────────────────────────
banner "Step 2 of 5 — App Settings"

APP_ENV=$(prompt APP_ENV "Environment" "production")
APP_DEBUG="false"
[[ "$APP_ENV" == "local" ]] && APP_DEBUG="true"

echo -e "\n  Generating secure APP_KEY..."
APP_KEY="base64:$(openssl rand -base64 32)"
ok "APP_KEY generated"

# ── Database ─────────────────────────────────────────────────────
banner "Step 3 of 5 — Database"

DB_DATABASE=$(prompt DB_DATABASE "Database name" "pocketguru")
DB_USERNAME=$(prompt DB_USERNAME "Database username" "pocketguru")
echo -e "  Press Enter to auto-generate a secure password, or type your own."
DB_PASSWORD=$(prompt_secret "Database password (Enter = auto-generate)")
if [[ -z "$DB_PASSWORD" ]]; then
  DB_PASSWORD=$(generate_random 24)
  ok "Database password auto-generated"
fi

# ── AI / External services ───────────────────────────────────────
banner "Step 4 of 5 — AI & Services"

echo -e "  ${YELLOW}Required for AI meditation, chat, and affirmations.${NC}"
OPENAI_API_KEY=$(prompt_secret "OpenAI API Key (sk-...)")
[[ -z "$OPENAI_API_KEY" ]] && warn "OpenAI key not set — AI features will be unavailable."

echo
echo -e "  ${YELLOW}Required for voice narration (Text-to-Speech).${NC}"
echo -e "  Format: projects/YOUR_PROJECT_ID/locations/global"
TTS_PARENT_URL=$(prompt TTS_PARENT_URL "Google Cloud TTS project URL (Enter to skip)" "")
[[ -z "$TTS_PARENT_URL" ]] && warn "TTS not configured — voice will use browser speech instead."

echo
echo -e "  ${YELLOW}If you have a Google Cloud TTS credentials JSON file,${NC}"
echo -e "  paste its full path below (or press Enter to skip)."
TTS_KEY_PATH=$(prompt TTS_KEY_PATH "Path to pg-tts-390208.json" "")
if [[ -n "$TTS_KEY_PATH" && -f "$TTS_KEY_PATH" ]]; then
  cp "$TTS_KEY_PATH" src/storage/pg-tts-390208.json
  ok "TTS credentials copied to src/storage/"
elif [[ -n "$TTS_KEY_PATH" ]]; then
  warn "File not found at $TTS_KEY_PATH — skipping."
fi

# ── Summary ──────────────────────────────────────────────────────
banner "Step 5 of 5 — Review & Start"

echo
echo -e "  ${BOLD}Configuration Summary:${NC}"
echo -e "  Domain     : ${CYAN}${DOMAIN:-<server IP>}${NC}"
echo -e "  SSL        : ${CYAN}${USE_SSL}${NC}"
echo -e "  Environment: ${CYAN}${APP_ENV}${NC}"
echo -e "  Database   : ${CYAN}${DB_DATABASE}${NC}"
echo -e "  OpenAI     : ${CYAN}$([ -n "$OPENAI_API_KEY" ] && echo 'configured' || echo 'NOT SET')${NC}"
echo -e "  TTS        : ${CYAN}$([ -n "$TTS_PARENT_URL" ] && echo 'configured' || echo 'NOT SET')${NC}"
echo

read -rp "  $(echo -e "${BOLD}Looks good? Start the server now? (y/n)${NC}") [y]: " confirm
confirm="${confirm:-y}"
[[ "$confirm" =~ ^[Yy]$ ]] || { echo "  Aborted."; exit 0; }

# ════════════════════════════════════════════════════════════════
#  SECTION 2 — Install Docker (if missing)
# ════════════════════════════════════════════════════════════════
banner "Installing dependencies..."

if ! command -v docker &>/dev/null; then
  info "Docker not found — installing..."
  curl -fsSL https://get.docker.com | sh
  ok "Docker installed"
else
  ok "Docker $(docker --version | awk '{print $3}' | tr -d ',')"
fi

if ! docker compose version &>/dev/null && ! command -v docker-compose &>/dev/null; then
  info "Installing Docker Compose plugin..."
  apt-get install -y docker-compose-plugin 2>/dev/null || \
    curl -SL "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" \
      -o /usr/local/bin/docker-compose && chmod +x /usr/local/bin/docker-compose
  ok "Docker Compose installed"
else
  ok "Docker Compose available"
fi

# ════════════════════════════════════════════════════════════════
#  SECTION 3 — Write config files
# ════════════════════════════════════════════════════════════════
banner "Writing configuration..."

# ── .env ────────────────────────────────────────────────────────
cat > src/.env <<EOF
APP_NAME="Pocket Guru AI"
APP_ENV=${APP_ENV}
APP_KEY=${APP_KEY}
APP_DEBUG=${APP_DEBUG}
APP_URL=$([ -n "$DOMAIN" ] && echo "https://${DOMAIN}" || echo "http://localhost")
APP_VERSION=1.0

LOG_CHANNEL=stack
LOG_LEVEL=$([ "$APP_ENV" == "production" ] && echo "error" || echo "debug")

BROADCAST_DRIVER=log
CACHE_DRIVER=file
FILESYSTEM_DRIVER=local
QUEUE_CONNECTION=sync
SESSION_DRIVER=file
SESSION_LIFETIME=120

DB_CONNECTION=mysql
DB_HOST=mysql
DB_PORT=3306
DB_DATABASE=${DB_DATABASE}
DB_USERNAME=${DB_USERNAME}
DB_PASSWORD=${DB_PASSWORD}

MAIL_MAILER=log
MAIL_FROM_ADDRESS=noreply@$([ -n "$DOMAIN" ] && echo "$DOMAIN" || echo "pocketguru.local")
MAIL_FROM_NAME="Pocket Guru AI"

OPENAI_API_KEY=${OPENAI_API_KEY}
TTS_PARENT_URL=${TTS_PARENT_URL}
EOF
ok "src/.env created"

# ── docker-compose.yml database credentials ──────────────────────
# Update docker-compose to match chosen DB credentials
sed -i \
  -e "s/MYSQL_DATABASE: homestead/MYSQL_DATABASE: ${DB_DATABASE}/" \
  -e "s/MYSQL_USER: homestead/MYSQL_USER: ${DB_USERNAME}/" \
  -e "s/MYSQL_PASSWORD: secret/MYSQL_PASSWORD: ${DB_PASSWORD}/" \
  -e "s/MYSQL_ROOT_PASSWORD: secret/MYSQL_ROOT_PASSWORD: ${DB_PASSWORD}/" \
  docker-compose.yml 2>/dev/null || true

# ── nginx config ─────────────────────────────────────────────────
DEPLOY_DOMAIN="${DOMAIN:-_}"  # '_' = catch-all when using IP

if [[ "$USE_SSL" == "true" ]]; then
  sed \
    -e "s/__DOMAIN__/${DEPLOY_DOMAIN}/g" \
    -e "s/__EMAIL__/${ADMIN_EMAIL}/g" \
    nginx/default.conf.template > nginx/default.conf
  ok "nginx/default.conf written (SSL mode)"
else
  # HTTP-only mode for IP/test domain
  sed \
    -e "s/__DOMAIN__/${DEPLOY_DOMAIN}/g" \
    nginx/default.http.conf.template > nginx/default.conf
  ok "nginx/default.conf written (HTTP-only mode)"
fi

# ════════════════════════════════════════════════════════════════
#  SECTION 4 — Start containers
# ════════════════════════════════════════════════════════════════
banner "Starting Docker containers..."

# Use 'docker compose' (v2) or 'docker-compose' (v1)
COMPOSE="docker compose"
command -v docker &>/dev/null && docker compose version &>/dev/null || COMPOSE="docker-compose"

$COMPOSE down --remove-orphans 2>/dev/null || true
$COMPOSE build --no-cache php
$COMPOSE up -d nginx php mysql
ok "Containers started"

# Wait for MySQL to be ready
info "Waiting for MySQL to be ready..."
for i in {1..30}; do
  $COMPOSE exec -T mysql mysqladmin ping -u root -p"${DB_PASSWORD}" --silent 2>/dev/null && break
  sleep 2
done
ok "MySQL ready"

# ════════════════════════════════════════════════════════════════
#  SECTION 5 — Laravel setup
# ════════════════════════════════════════════════════════════════
banner "Setting up Laravel..."

$COMPOSE exec -T php composer install --no-dev --optimize-autoloader
ok "Composer packages installed"

$COMPOSE exec -T php php artisan migrate --force
ok "Database migrations run"

$COMPOSE exec -T php php artisan config:cache
$COMPOSE exec -T php php artisan route:cache
$COMPOSE exec -T php php artisan view:cache
ok "Caches warmed"

$COMPOSE exec -T php php artisan storage:link --force 2>/dev/null || true

# ════════════════════════════════════════════════════════════════
#  SECTION 6 — SSL (optional)
# ════════════════════════════════════════════════════════════════
if [[ "$USE_SSL" == "true" ]]; then
  banner "Setting up SSL certificate..."
  $COMPOSE run --rm certbot certonly \
    --webroot \
    --webroot-path /var/www/certbot \
    --agree-tos \
    --email "${ADMIN_EMAIL}" \
    --non-interactive \
    -d "${DOMAIN}" \
    -d "www.${DOMAIN}" && \
  $COMPOSE restart nginx && \
  ok "SSL certificate obtained for ${DOMAIN}" || \
  warn "SSL setup failed — check that DNS for ${DOMAIN} points to this server's IP."
fi

# ════════════════════════════════════════════════════════════════
#  DONE
# ════════════════════════════════════════════════════════════════
banner "🎉 Pocket Guru AI is live!"
echo
if [[ -n "$DOMAIN" && "$USE_SSL" == "true" ]]; then
  echo -e "  ${GREEN}${BOLD}PWA:${NC}  https://${DOMAIN}/app/"
  echo -e "  ${GREEN}${BOLD}API:${NC}  https://${DOMAIN}/api/"
  echo -e "  ${GREEN}${BOLD}Admin:${NC} https://${DOMAIN}/admin/"
elif [[ -n "$DOMAIN" ]]; then
  echo -e "  ${GREEN}${BOLD}PWA:${NC}  http://${DOMAIN}/app/"
  echo -e "  ${GREEN}${BOLD}API:${NC}  http://${DOMAIN}/api/"
else
  SERVER_IP=$(curl -s ifconfig.me 2>/dev/null || hostname -I | awk '{print $1}')
  echo -e "  ${GREEN}${BOLD}PWA:${NC}  http://${SERVER_IP}/app/"
  echo -e "  ${GREEN}${BOLD}API:${NC}  http://${SERVER_IP}/api/"
fi
echo
echo -e "  ${YELLOW}To add SSL later, run:${NC}  bash setup.sh"
echo -e "  ${YELLOW}To view logs:${NC}           ${COMPOSE} logs -f"
echo -e "  ${YELLOW}To restart:${NC}             ${COMPOSE} restart"
echo

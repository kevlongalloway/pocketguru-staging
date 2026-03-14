# Pocket Guru AI — Deployment Guide

## Prerequisites

- A Linux server (Rumble Cloud, DigitalOcean, AWS EC2, etc.) — Ubuntu 22.04+ recommended
- A domain name pointed at your server's IP (optional — you can test with IP only)
- Your **OpenAI API key**
- *(Optional)* Google Cloud TTS credentials JSON for high-quality voice

---

## First-Time Server Setup

SSH into your fresh server and run:

```bash
git clone https://github.com/kevlongalloway/pocketguru-staging.git pocketguru-staging
cd pocketguru-staging
bash setup.sh
```

The wizard will ask you for:

| Prompt | Example | Notes |
|--------|---------|-------|
| Domain name | `app.mysite.com` | Press Enter to use IP only (for testing) |
| SSL via Let's Encrypt | `y` | Requires domain with DNS already pointing to server |
| Admin email | `you@email.com` | Used for SSL certificate |
| Environment | `production` | |
| Database name | `pocketguru` | |
| Database username | `pocketguru` | |
| Database password | *(Enter to auto-generate)* | |
| OpenAI API key | `sk-...` | Get from platform.openai.com |
| Google TTS credentials | `/path/to/pg-tts-390208.json` | Optional — falls back to browser TTS |

When it finishes, your app is live:

| | With domain + SSL | With IP only |
|---|---|---|
| **PWA** | `https://yourdomain.com/app/` | `http://YOUR_IP/app/` |
| **API** | `https://yourdomain.com/api/` | `http://YOUR_IP/api/` |
| **Admin** | `https://yourdomain.com/admin/` | `http://YOUR_IP/admin/` |

---

## Set Up Auto-Deploy via GitHub Actions

Every push to `master` automatically deploys to your server. You just need to add 3 secrets to GitHub.

### Step 1 — Generate an SSH key pair (on your local machine)

```bash
ssh-keygen -t ed25519 -C "pocketguru-deploy" -f ~/.ssh/pocketguru_deploy
```

This creates two files:
- `~/.ssh/pocketguru_deploy` → **private key** (goes into GitHub)
- `~/.ssh/pocketguru_deploy.pub` → **public key** (goes onto the server)

### Step 2 — Add the public key to your server

```bash
ssh-copy-id -i ~/.ssh/pocketguru_deploy.pub root@YOUR_SERVER_IP
```

Or manually append it:
```bash
cat ~/.ssh/pocketguru_deploy.pub | ssh root@YOUR_SERVER_IP "cat >> ~/.ssh/authorized_keys"
```

### Step 3 — Add secrets to GitHub

Go to your repo → **Settings → Secrets and variables → Actions → New repository secret**

| Secret name | Value |
|-------------|-------|
| `SSH_PRIVATE_KEY` | Contents of `~/.ssh/pocketguru_deploy` (the private key file) |
| `SSH_HOST` | Your server's IP address |
| `SSH_USER` | `root` (or whatever user you SSH as) |

### Step 4 — Deploy

```bash
git checkout master
git merge claude/meditation-pwa-ui-voice-Ra5nF
git push origin master
```

GitHub Actions will SSH in, pull the code, run migrations, and restart nginx automatically.

---

## Moving to a New Server (e.g. Rumble Cloud)

1. Spin up a new VM on Rumble Cloud
2. SSH in and run the setup wizard:
   ```bash
   git clone https://github.com/kevlongalloway/pocketguru-staging.git pocketguru-staging
   cd pocketguru-staging
   bash setup.sh
   ```
3. Update GitHub Secrets (`SSH_HOST` → new server IP)
4. Push to master → auto-deploy kicks in

No code changes needed — the new server gets the exact same stack.

---

## Useful Commands

```bash
# View running containers
docker compose ps

# Follow logs
docker compose logs -f
docker compose logs -f php       # Laravel logs only
docker compose logs -f nginx     # Nginx logs only

# Restart everything
docker compose restart

# Run artisan commands
docker compose exec php php artisan migrate
docker compose exec php php artisan tinker

# Rebuild after Dockerfile changes (e.g. new PHP version)
docker compose build --no-cache php && docker compose up -d

# Renew SSL certificate (runs automatically, but manual refresh if needed)
docker compose run --rm certbot renew
docker compose restart nginx
```

---

## Environment Variables Reference

These live in `src/.env` (created by `setup.sh`):

```env
APP_NAME="Pocket Guru AI"
APP_ENV=production
APP_KEY=base64:...          # Auto-generated — never share
APP_DEBUG=false
APP_URL=https://yourdomain.com

DB_CONNECTION=mysql
DB_HOST=mysql
DB_PORT=3306
DB_DATABASE=pocketguru
DB_USERNAME=pocketguru
DB_PASSWORD=...

OPENAI_API_KEY=sk-...       # Required for AI features
TTS_PARENT_URL=projects/YOUR_PROJECT/locations/global  # Optional
```

---

## Troubleshooting

**App shows 502 Bad Gateway**
```bash
docker compose ps                   # check php container is running
docker compose logs php             # look for PHP/composer errors
docker compose restart php nginx
```

**Migrations fail**
```bash
docker compose exec php php artisan migrate:status
docker compose exec php php artisan migrate --force -v
```

**SSL certificate not found**
```bash
# Re-run certbot (DNS must point to the server first)
docker compose run --rm certbot certonly --webroot \
  --webroot-path /var/www/certbot \
  --agree-tos --email you@email.com -d yourdomain.com
docker compose restart nginx
```

**OpenAI / TTS not working**
```bash
# Check keys are set
docker compose exec php php artisan tinker --execute="echo env('OPENAI_API_KEY');"
```

# Railway Deployment Guide za BZR Portal

## 📋 Pregled

Ovaj dokument sadrži kompletno uputstvo za deployment BZR Portal aplikacije na Railway platformu.

## 🚀 Brzi Start

### Korak 1: Priprema Repository-ja

1. **Push kod na GitHub** (ako već nije):
   ```bash
   git add .
   git commit -m "Prepare for Railway deployment"
   git push origin main
   ```

2. **Proveri da li build radi lokalno**:
   ```bash
   npm install
   npm run build
   npm start
   ```

### Korak 2: Railway Setup

1. **Idi na [railway.app](https://railway.app)**
2. **Registruj se/uloguj se** (možeš koristiti GitHub account)
3. **Klikni "New Project"**
4. **Izaberi "Deploy from GitHub repo"**
5. **Izaberi svoj BZR Portal repository**
6. **Railway će automatski detektovati Node.js projekat**

### Korak 3: Environment Variables

U Railway dashboard, dodaj sledeće environment varijable:

#### 🔐 Osnovne varijable
```
NODE_ENV=production
PORT=5000
```

#### 🗄️ Database (Supabase)
```
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_KEY=your_supabase_anon_key
SUPABASE_ANON_KEY=your_supabase_anon_key
JWT_SECRET=your_jwt_secret_from_supabase
SECRET_KEY=your_generated_secret_key
SECRETS_ENCRYPTION_KEY=your_encryption_key
```

#### 🤖 AI Services
```
OPENAI_API_KEY=your_openai_api_key
ANTHROPIC_API_KEY=your_anthropic_api_key
DEEPSEEK_API_KEY=your_deepseek_api_key
GEMINI_API_KEY=your_gemini_api_key
```

#### 📧 Email Service
```
SENDGRID_API_KEY=your_sendgrid_api_key
RESEND_API_KEY=your_resend_api_key
```

#### 💾 Storage (Wasabi S3)
```
WASABI_ACCESS_KEY=your_wasabi_access_key
WASABI_SECRET_KEY=your_wasabi_secret_key
WASABI_BUCKET=your_bucket_name
WASABI_REGION=your_wasabi_region
WASABI_ENDPOINT=https://s3.your-region.wasabisys.com
```

#### 💳 Payment (Stripe)
```
STRIPE_SECRET_KEY=your_stripe_secret_key
STRIPE_PUBLISHABLE_KEY=your_stripe_publishable_key
STRIPE_WEBHOOK_SECRET=your_stripe_webhook_secret
```

### Korak 4: Deploy

1. **Railway će automatski pokrenuti build proces**
2. **Čekaj da se završi deployment** (obično 2-5 minuta)
3. **Dobićeš URL** tipa: `https://your-project-name.up.railway.app`

### Korak 5: Verifikacija

1. **Otvori deployment URL**
2. **Testiraj health check**: `https://your-url.up.railway.app/api/health`
3. **Testiraj osnovne funkcionalnosti**

## 🔧 Krerani Fajlovi

### `railway.json`
- Konfiguracija za Railway deployment
- Definiše build proces i health check

### `Dockerfile`
- Containerization setup
- Optimizovan za production

### `.railwayignore`
- Fajlovi koji se neće uploadovati na Railway
- Smanjuje veličinu deployment-a

## 🚨 Česte Greške i Rešenja

### Build Greške

**Problem**: `Module not found` greške
**Rešenje**: 
```bash
# Proveri dependencies
npm install
npm audit fix
```

**Problem**: TypeScript greške
**Rešenje**: 
```bash
# Proveri TypeScript konfiguraciju
npm run check
```

### Runtime Greške

**Problem**: `Cannot connect to database`
**Rešenje**: Proveri Supabase environment varijable

**Problem**: `AI service unavailable`
**Rešenje**: Proveri API ključeve za AI servise

**Problem**: `Port already in use`
**Rešenje**: Railway automatski dodeljuje port - ne treba menjati

### Performance Issues

**Problem**: Spor startup
**Rešenje**: 
- Optimizuj dependencies u `package.json`
- Koristi `npm ci` umesto `npm install`

**Problem**: Memory issues
**Rešenje**: 
- Povećaj Railway plan ako je potrebno
- Optimizuj AI service pozive

## 📊 Monitoring

### Health Check
- URL: `/api/health`
- Railway automatski proverava svake 30 sekundi

### Logs
- Pristup preko Railway dashboard
- Real-time log streaming

### Metrics
- CPU, Memory, Network usage
- Dostupno u Railway dashboard

## 🔄 Continuous Deployment

Railway automatski redeploy-uje kada push-uješ na main branch:

```bash
git add .
git commit -m "Update feature"
git push origin main
# Railway će automatski pokrenuti novi deployment
```

## 💰 Troškovi

### Free Tier
- $5 kredit mesečno
- Dovoljno za development i testiranje

### Pro Plan
- $20/mesec
- Više resursa i funkcionalnosti

## 🆘 Support

### Railway Documentation
- [railway.app/docs](https://docs.railway.app)

### Community
- [Railway Discord](https://discord.gg/railway)

### Troubleshooting
1. Proveri Railway logs
2. Testiraj lokalno sa `npm run build && npm start`
3. Proveri environment varijable
4. Kontaktiraj Railway support

## 📝 Checklist Pre-Deployment

- [ ] Kod je push-ovan na GitHub
- [ ] Build radi lokalno
- [ ] Sve environment varijable su konfigurisane
- [ ] Supabase je setup
- [ ] AI API ključevi su validni
- [ ] Stripe je konfigurisan (ako koristiš payments)
- [ ] Email service je setup

## 🎉 Sledeći Koraci

Nakon uspešnog deployment-a:

1. **Setup Custom Domain** (opciono)
2. **Configure SSL** (automatski na Railway)
3. **Setup Monitoring** (Railway metrics)
4. **Backup Strategy** (Supabase backup)
5. **Performance Optimization**

---

**Napomena**: Ovaj guide pokriva osnovni deployment. Za napredne konfiguracije, konsultuj Railway dokumentaciju.

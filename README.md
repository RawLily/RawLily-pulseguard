# PulseGuard - Enterprise Bug & Security Monitoring SaaS

🛡️ **Real-time threat detection and bug monitoring for modern applications**

Monitor, track, and respond to application bugs and security threats instantly. Built for enterprise teams that demand reliability, security, and scale.

---

## ✨ Features

- ✅ **Real-time Bug Monitoring** - Instant alerts when errors occur in your applications
- ✅ **Security Threat Detection** - Intelligent threat analysis with severity levels
- ✅ **User Authentication** - Enterprise-grade auth via Auth0
- ✅ **Subscription Billing** - Stripe payment processing (monthly/yearly plans)
- ✅ **Email Notifications** - Reliable email delivery via Resend
- ✅ **Error Tracking** - Comprehensive error logging with Sentry
- ✅ **RESTful API** - Easy integration for any application
- ✅ **Enterprise Security** - A+ security ratings, bank-level encryption
- ✅ **Professional Dashboard** - Beautiful, intuitive user interface
- ✅ **Scalable** - Built on Vercel for enterprise scale

---

## 🏗️ Tech Stack

| Component | Technology | Version |
|-----------|-----------|---------|
| Framework | Next.js 14 (App Router) | 14.2.3+ |
| Language | TypeScript | 5.4.5+ |
| Database | PostgreSQL (Neon) | Latest |
| Authentication | Auth0 | v3.5.0+ |
| Payments | Stripe | v16.11.0+ |
| Email | Resend | v3.2.0+ |
| Error Tracking | Sentry | v7.119.0+ |
| Styling | Tailwind CSS | v3.4.3+ |
| Hosting | Vercel | Latest |

---

## 📋 Prerequisites

Before getting started, ensure you have:

- **Node.js** 18.17 or higher
- **npm** 10.0 or higher
- **PostgreSQL** database (via Neon)
- **Auth0** account and tenant
- **Stripe** account (production or test mode)
- **Resend** account for email
- **Sentry** account for error tracking
- **GitHub** repository access

---

## 🚀 Quick Start

### 1. Clone Repository

```bash
git clone https://github.com/RawLily/RawLily-pulseguard.git
cd RawLily-pulseguard
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Setup Environment Variables

Copy the example file:
```bash
cp .env.example .env.local
```

Edit `.env.local` and add your credentials (see Configuration section below).

### 4. Configure Database

Create these tables in your Neon PostgreSQL database:

```sql
-- Users table
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  auth0_id VARCHAR(255) UNIQUE NOT NULL,
  subscription_tier VARCHAR(50) DEFAULT 'free',
  api_key VARCHAR(255) UNIQUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Events table
CREATE TABLE events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  type VARCHAR(50) NOT NULL,
  severity VARCHAR(50) NOT NULL,
  message TEXT,
  metadata JSONB,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for performance
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_auth0_id ON users(auth0_id);
CREATE INDEX idx_events_user_id ON events(user_id);
CREATE INDEX idx_events_created_at ON events(created_at);
CREATE INDEX idx_events_severity ON events(severity);
```

### 5. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## ⚙️ Configuration

### Auth0 Setup

1. Go to [Auth0 Dashboard](https://manage.auth0.com)
2. Create a new application (Single Page Application)
3. Copy your credentials:
   - **Domain** → `AUTH0_ISSUER_BASE_URL`
   - **Client ID** → `AUTH0_CLIENT_ID`
   - **Client Secret** → `AUTH0_CLIENT_SECRET`

4. Add **Allowed Callback URLs**:
   ```
   http://localhost:3000/api/auth/callback
   https://pulseguardhq.xyz/api/auth/callback
   ```

5. Add **Allowed Logout URLs**:
   ```
   http://localhost:3000
   https://pulseguardhq.xyz
   ```

### Stripe Setup

1. Go to [Stripe Dashboard](https://dashboard.stripe.com)
2. Get your **API Keys**:
   - **Publishable Key** → `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
   - **Secret Key** → `STRIPE_SECRET_KEY`

3. Create **Products**:
   - Starter: $29/month
   - Pro: $99/month

4. Copy **Price IDs**:
   - `STRIPE_PRICE_ID_MONTHLY`
   - `STRIPE_PRICE_ID_YEARLY`

5. Add **Webhook Endpoint**:
   - URL: `https://pulseguardhq.xyz/api/webhooks/stripe`
   - Events: 
     - `customer.subscription.created`
     - `customer.subscription.updated`
     - `customer.subscription.deleted`
     - `invoice.payment_succeeded`
     - `invoice.payment_failed`
   - Copy **Webhook Secret** → `STRIPE_WEBHOOK_SECRET`

### Resend Setup

1. Go to [Resend Dashboard](https://resend.com)
2. Get your **API Key** → `RESEND_API_KEY`
3. Verify your domain for sending emails

### Sentry Setup

1. Go to [Sentry Dashboard](https://sentry.io)
2. Create a new project (Next.js)
3. Copy:
   - **DSN** → `NEXT_PUBLIC_SENTRY_DSN`
   - **Organization** → `SENTRY_ORG`
   - **Project** → `SENTRY_PROJECT`
   - **Auth Token** → `SENTRY_AUTH_TOKEN`

---

## 📝 Environment Variables

Create `.env.local` with these variables:

```env
# Auth0
AUTH0_SECRET=your-secret-key-here-minimum-32-characters
AUTH0_BASE_URL=https://pulseguardhq.xyz
AUTH0_ISSUER_BASE_URL=https://your-tenant.auth0.com
AUTH0_CLIENT_ID=your-auth0-client-id
AUTH0_CLIENT_SECRET=your-auth0-client-secret

# Database
DATABASE_URL=postgresql://user:password@host/database

# Stripe (Use pk_live and sk_live for production)
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_your_key
STRIPE_SECRET_KEY=sk_live_your_key
STRIPE_WEBHOOK_SECRET=whsec_your_secret
STRIPE_PRICE_ID_MONTHLY=price_xxxxx
STRIPE_PRICE_ID_YEARLY=price_xxxxx

# Email
RESEND_API_KEY=re_your_key

# Error Tracking
NEXT_PUBLIC_SENTRY_DSN=https://xxxxx@sentry.io/xxxxx
SENTRY_ORG=your-org
SENTRY_PROJECT=pulseguard
SENTRY_AUTH_TOKEN=your-token

# Application
NEXT_PUBLIC_APP_URL=https://pulseguardhq.xyz
NODE_ENV=production
```

---

## 📡 API Endpoints

### Authentication

Authentication is handled by Auth0 SDK automatically. Available endpoints:

```
POST   /api/auth/login          → Redirect to Auth0 login
POST   /api/auth/signup         → Redirect to Auth0 signup
GET    /api/auth/callback       → Auth0 callback handler
GET    /api/auth/logout         → Logout and clear session
```

### Monitoring

```
POST   /api/ingest              → Submit bug/security events
GET    /api/stats               → Get user statistics
```

**Ingest endpoint example:**
```bash
curl -X POST https://pulseguardhq.xyz/api/ingest \
  -H "x-api-key: YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "type": "error",
    "severity": "high",
    "message": "Database connection failed",
    "timestamp": "2026-01-01T00:00:00Z"
  }'
```

### Payments

```
POST   /api/checkout            → Initiate Stripe checkout session
POST   /api/webhooks/stripe     → Stripe webhook handler
```

---

## 🔐 Security

PulseGuard includes enterprise-grade security measures:

- ✅ **HTTPS-only** - All connections encrypted with TLS
- ✅ **Content Security Policy (CSP)** - Prevents XSS attacks
- ✅ **HSTS** - Forces HTTPS (2-year max-age)
- ✅ **X-Frame-Options** - Prevents clickjacking
- ✅ **X-XSS-Protection** - XSS filter enabled
- ✅ **CORS Protection** - Restricted cross-origin requests
- ✅ **Input Validation** - Sanitizes all user input
- ✅ **Secure Sessions** - Auth0 handles session security
- ✅ **Environment Isolation** - Sensitive data never logged
- ✅ **Webhook Verification** - Stripe signatures validated
- ✅ **SQL Injection Prevention** - Parameterized queries

**Expected Security Ratings:**
- Website Security: **A+**
- SSL/TLS: **A+**
- Email Security: **A+**

---

## 🚀 Deployment

### Deploy to Vercel

1. **Push to GitHub:**
   ```bash
   git add .
   git commit -m "PulseGuard production build"
   git push origin main
   ```

2. **Connect to Vercel:**
   - Go to [Vercel Dashboard](https://vercel.com)
   - Click "Add New Project"
   - Import your GitHub repository
   - Add all environment variables (from `.env.local`)
   - Click "Deploy"

3. **Configure Custom Domain:**
   - Add your domain in Vercel project settings
   - Update DNS records as instructed

4. **Post-Deployment Setup:**
   - Update Auth0 redirect URLs to production domain
   - Update Stripe webhook endpoint URL to production
   - Verify Resend domain configuration
   - Clear Vercel cache and redeploy if needed
   - Test all workflows end-to-end

---

## 📊 Project Structure

```
pulseguard/
├── app/
│   ├── api/
│   │   ├── auth/
│   │   │   └── [auth0]/
│   │   │       └── route.ts
│   │   ├── stats/
│   │   │   └── route.ts
│   │   ├── ingest/
│   │   │   └── route.ts
│   │   ├── checkout/
│   │   │   └── route.ts
│   │   └── webhooks/
│   │       └── stripe/
│   │           └── route.ts
│   ├── dashboard/
│   │   ├── layout.tsx
│   │   ├── page.tsx
│   │   └── globals.css
│   ├── layout.tsx
│   ├── page.tsx
│   ├── providers.tsx
│   └── globals.css
├── components/
│   └── error-boundary.tsx
├── lib/
│   ├── db.ts
│   └── email.ts
├── public/
│   ├── .well-known/
│   │   ├── mta-sts.json
│   │   └── mta-sts.txt
│   ├── manifest.json
│   └── robots.txt
├── types/
├── next.config.js
├── tailwind.config.js
├── tsconfig.json
├── postcss.config.js
├── package.json
├── vercel.json
├── .env.example
├── .gitignore
└── README.md
```

---

## 🧪 Testing

### Local Testing

```bash
# Development server
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Run linter
npm run lint
```

### Test Event Submission

```bash
curl -X POST http://localhost:3000/api/ingest \
  -H "x-api-key: test-key" \
  -H "Content-Type: application/json" \
  -d '{
    "type": "error",
    "severity": "high",
    "message": "Test error",
    "timestamp": "2026-01-01T00:00:00Z"
  }'
```

---

## 🆘 Troubleshooting

### Build Fails with npm errors
- Verify all dependencies are correctly named in `package.json`
- Clear npm cache: `npm cache clean --force`
- Delete `node_modules` and reinstall: `npm install`

### Auth0 Redirects Not Working
- Verify callback URLs are added to Auth0 dashboard settings
- Check `AUTH0_BASE_URL` matches your domain exactly
- Clear browser cookies and try login again
- Verify `AUTH0_CLIENT_ID` and `AUTH0_CLIENT_SECRET` are correct

### Stripe Checkout Not Working
- Ensure using LIVE keys (`pk_live_`, `sk_live_`) in production
- Verify webhook endpoint is configured in Stripe dashboard
- Check `STRIPE_WEBHOOK_SECRET` matches exactly in Vercel
- Test with Stripe test mode first if unsure

### Email Not Sending
- Verify `RESEND_API_KEY` is correct
- Check domain is verified in Resend dashboard
- Try sending a test email from Resend interface first
- Check spam/junk folders

### Database Connection Issues
- Verify `DATABASE_URL` connection string is complete
- Check database is accessible from Vercel IP range
- Ensure tables are created with correct schema
- Test connection locally before deploying

### Vercel Deployment Issues
- Clear build cache in Vercel project settings
- Redeploy with cache cleared
- Check all environment variables are set correctly
- Review build logs in Vercel dashboard for specific errors

---

## 📚 Documentation

- [Next.js Documentation](https://nextjs.org/docs)
- [Auth0 Documentation](https://auth0.com/docs)
- [Stripe Documentation](https://stripe.com/docs)
- [Resend Documentation](https://resend.com/docs)
- [Sentry Documentation](https://docs.sentry.io)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)

---

## 💬 Support

For issues, questions, or feedback:

- **Email:** support@pulseguardhq.xyz
- **GitHub Issues:** [Report a Bug](https://github.com/RawLily/RawLily-pulseguard/issues)
- **Documentation:** Visit the README above or check individual service docs

---

## 📄 License

© 2026 PulseGuard. All rights reserved.

Built with ❤️ by [JLR AI Software Company](https://jlr-ai.xyz)

---

## 🎯 Roadmap

- [ ] Mobile SDKs (iOS/Android)
- [ ] Advanced analytics dashboard
- [ ] Custom alert rules and thresholds
- [ ] Slack/Teams integration
- [ ] Performance monitoring
- [ ] Dependency tracking
- [ ] Custom branding for Enterprise tier

---

## 🤝 Contributing

We welcome contributions! Please:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/your-feature`)
3. Commit your changes (`git commit -m 'Add your feature'`)
4. Push to the branch (`git push origin feature/your-feature`)
5. Open a Pull Request

---

**Happy monitoring! 🛡️**

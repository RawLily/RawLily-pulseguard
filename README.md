# PulseGuard 🛡️

**Enterprise Bug & Security Monitoring SaaS**

Monitor, track, and respond to application bugs and security threats in real-time.

---

## Features

✅ Real-time bug monitoring and alerts
✅ Security threat detection and logging
✅ User authentication via Auth0
✅ Stripe payment processing (monthly/yearly plans)
✅ Email notifications via Resend
✅ Error tracking with Sentry
✅ RESTful API for integrations
✅ Enterprise-grade security

---

## Tech Stack

- **Framework:** Next.js 14 (App Router)
- **Language:** TypeScript
- **Database:** PostgreSQL (Neon)
- **Authentication:** Auth0
- **Payments:** Stripe
- **Email:** Resend
- **Error Tracking:** Sentry
- **Styling:** Tailwind CSS
- **Hosting:** Vercel

---

## Installation

### Prerequisites
- Node.js 18.17+ 
- npm 10.0+
- PostgreSQL database
- Auth0 account
- Stripe account
- Resend account

### Setup

1. Clone the repository:
```bash
git clone https://github.com/RawLily/RawLily-pulseguard.git
cd RawLily-pulseguard
```

2. Install dependencies:
```bash
npm install
```

3. Configure environment variables:
```bash
cp .env.example .env.local
```

Edit `.env.local` with your credentials:
- Auth0 settings
- Database URL
- Stripe keys
- Resend API key
- Sentry DSN

4. Run development server:
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

---

## API Endpoints

### Authentication
- `GET /api/auth/[auth0]` - Auth0 callback handler

### Monitoring
- `POST /api/ingest` - Submit bug/security events
- `GET /api/stats` - Retrieve statistics

### Payments
- `POST /api/checkout` - Initiate Stripe checkout
- `POST /api/webhooks/stripe` - Stripe webhook handler

---

## Security

- ✅ HTTPS-only connections
- ✅ Content Security Policy (CSP)
- ✅ CORS protection
- ✅ Rate limiting on auth endpoints
- ✅ Input validation and sanitization
- ✅ Secure session management
- ✅ Environment variable isolation
- ✅ No sensitive data logging

---

## Deployment

Deploy to Vercel with automatic builds from GitHub:

```bash
vercel deploy
```

---

## Support

For issues, questions, or feedback: support@pulseguardhq.xyz

---

## License

© 2026 PulseGuard. All rights reserved.

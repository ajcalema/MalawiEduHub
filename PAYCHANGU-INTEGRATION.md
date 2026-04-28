# Paychangu Payment Integration Guide

## Overview

MalawiEduHub uses **Paychangu** as the payment gateway for processing mobile money payments (Airtel Money & TNM Mpamba) in Malawi.

---

## API Keys

### Test Keys (Currently Active)
```
PAYCHANGU_SECRET_KEY=sec-test-WBkzHqND0w4kRJ4MBHQPqSLcJPmOMxtP
PAYCHANGU_PUBLIC_KEY=pub-test-sHrctUFpd92KlxxqekxcZotoBgDpJuvc
```

### Live Keys (Update when ready)
```
PAYCHANGU_SECRET_KEY=sec-live-YOUR_LIVE_SECRET_KEY
PAYCHANGU_PUBLIC_KEY=pub-live-YOUR_LIVE_PUBLIC_KEY
```

**IMPORTANT:** Never commit live keys to Git!

---

## Switching from Test to Live

### Step 1: Get Live Keys from Paychangu

1. Log in to your Paychangu dashboard: https://paychangu.com/dashboard
2. Go to **Settings** > **API Keys**
3. Switch from **Test Mode** to **Live Mode**
4. Copy your live secret key and public key

### Step 2: Update Local Environment

Edit `backend/.env`:

```bash
# Change from:
PAYCHANGU_SECRET_KEY=sec-test-WBkzHqND0w4kRJ4MBHQPqSLcJPmOMxtP
PAYCHANGU_PUBLIC_KEY=pub-test-sHrctUFpd92KlxxqekxcZotoBgDpJuvc

# To:
PAYCHANGU_SECRET_KEY=sec-live-YOUR_ACTUAL_LIVE_KEY
PAYCHANGU_PUBLIC_KEY=pub-live-YOUR_ACTUAL_LIVE_KEY
```

### Step 3: Update Render Deployment

1. Go to Render Dashboard: https://dashboard.render.com
2. Select your backend service
3. Go to **Environment** tab
4. Update these variables:
   - `PAYCHANGU_SECRET_KEY` to your live secret key
   - `PAYCHANGU_PUBLIC_KEY` to your live public key
5. Click **Save Changes** (service will redeploy automatically)

### Step 4: Test with Real Money

**WARNING:** Live mode uses REAL money!

1. Deploy the changes
2. Create a test user account
3. Try subscribing to the cheapest plan (Daily - MWK 300)
4. Use your own mobile number
5. Approve the payment prompt on your phone
6. Verify the payment completes successfully

### Step 5: Verify Webhook URL

Paychangu needs to call your webhook endpoint. Make sure:

```
Webhook URL: https://your-backend-url.onrender.com/api/payments/webhook
```

The webhook URL is automatically set in the payment request as:
```javascript
callback_url: process.env.BACKEND_URL + '/api/payments/webhook'
```

Make sure `BACKEND_URL` environment variable is set correctly on Render.

---

## Payment Flow

### Subscription Payment

1. User selects plan (Daily/Weekly/Monthly)
2. User enters mobile number and selects network (Airtel/TNM)
3. Backend creates pending payment record
4. Backend calls Paychangu API to initiate payment
5. User receives USSD prompt on phone
6. User enters PIN to approve
7. Paychangu sends webhook to backend
8. Backend marks payment as completed
9. Backend creates/updates subscription
10. User gets access to premium features

### Pay-Per-Download Payment

1. User clicks download on paid document
2. User enters mobile number and selects network
3. Backend creates pending payment record
4. Backend calls Paychangu API
5. User receives USSD prompt
6. User approves payment
7. Paychangu sends webhook
8. Backend marks payment completed
9. User can download the document

---

## Testing Payments

### Option 1: Simulated Test Endpoint (Development Only)

When NODE_ENV=development, you can use the test endpoint:

```bash
POST /api/payments/test/simulate/:paymentId
Authorization: Bearer YOUR_TOKEN
```

This simulates a successful payment without calling Paychangu.

### Option 2: Paychangu Test Mode

With test keys:
- Use test mobile numbers provided by Paychangu
- No real money is deducted
- Payments simulate successfully

### Option 3: Live Testing (Small Amount)

With live keys:
- Use the Daily plan (MWK 300) for testing
- Use your own phone
- Real money will be deducted
- Verify full payment flow works

---

## Payment Plans

| Plan | Price (MWK) | Duration |
|------|-------------|----------|
| Daily | 300 | 24 hours |
| Weekly | 1,000 | 7 days |
| Monthly | 2,500 | 30 days |

Prices are defined in `backend/src/controllers/paymentController.js`

---

## API Endpoints

### Initiate Subscription
```
POST /api/payments/subscribe
Authorization: Bearer <token>
Content-Type: application/json

{
  "plan": "daily",
  "mobile_number": "0991234567",
  "payment_method": "airtel_money"
}
```

### Initiate Download Payment
```
POST /api/payments/per-download
Authorization: Bearer <token>

{
  "document_id": "uuid-here",
  "mobile_number": "0991234567",
  "payment_method": "tnm_mpamba"
}
```

### Check Payment Status
```
GET /api/payments/status/:paymentId
Authorization: Bearer <token>
```

### Payment Webhook (Called by Paychangu)
```
POST /api/payments/webhook
```

---

## Supported Payment Methods

### Airtel Money
- payment_method: "airtel_money"
- Network: "AIRTEL"
- Format: 099XXXXXXX or 077XXXXXXX

### TNM Mpamba
- payment_method: "tnm_mpamba"
- Network: "TNM"
- Format: 088XXXXXXX or 031XXXXXXX

---

## Security

### Important

- Keep PAYCHANGU_SECRET_KEY secret - never expose to frontend
- Only use HTTPS in production
- Validate all payment webhook requests
- Check payment amounts match expected values
- Prevent duplicate webhook processing

### Environment Variables

Required:
- PAYCHANGU_SECRET_KEY - Your secret key (backend only)
- PAYCHANGU_PUBLIC_KEY - Your public key (can be in frontend)
- PAYCHANGU_BASE_URL - https://api.paychangu.com
- BACKEND_URL - Your backend URL for webhooks

---

## Troubleshooting

### Payment Not Completing

1. Check webhook URL is accessible
2. Verify BACKEND_URL is set correctly
3. Check Render logs for webhook errors
4. Verify Paychangu dashboard for payment status

### Webhook Not Receiving Requests

1. Ensure BACKEND_URL is publicly accessible
2. Check firewall/CORS settings
3. Verify webhook URL in Paychangu dashboard
4. Check Render service is running

### Test Mode Not Working

1. Verify test keys are correct
2. Check NODE_ENV is set to "development"
3. Use the simulate endpoint for local testing

---

## Current Status

- Test keys: Configured and working
- Live keys: Ready to be added
- Webhook: Implemented
- Payment flow: Complete
- Test endpoint: Available in development mode

---

## Next Steps

1. Get your live keys from Paychangu dashboard
2. Update backend/.env with live keys
3. Update Render environment variables
4. Test with small amount (MWK 300)
5. Monitor first few live payments
6. Set up payment monitoring/alerts

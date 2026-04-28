# Paychangu Payment Integration Guide

## Overview

MalawiEduHub uses **Paychangu** as the payment gateway for processing mobile money payments (Airtel Money & TNM Mpamba) in Malawi.

---

## API Keys

### Live Keys (Currently Active) ✅
```
PAYCHANGU_SECRET_KEY=sec-live-90bvc6gPtq7yKl62UxzAfjGW8mopuuer
PAYCHANGU_PUBLIC_KEY=pub-live-FcbcdfUaYaEOsCLtDgUCjv96bG00QNMb
```

### Test Keys (Previous)
```
PAYCHANGU_SECRET_KEY=sec-test-WBkzHqND0w4kRJ4MBHQPqSLcJPmOMxtP
PAYCHANGU_PUBLIC_KEY=pub-test-sHrctUFpd92KlxxqekxcZotoBgDpJuvc
```

**IMPORTANT:** Never commit live keys to Git! (Keys are in .env which is gitignored)

---

## Switching from Test to Live

### Status: LIVE MODE ACTIVATED ✅

Your system is now configured with live Paychangu keys!

### What's Been Done:

1. ✅ Live keys added to `backend/.env`
2. ✅ Live keys added to `render.yaml`
3. ✅ Payment system ready for real transactions

### Next Steps:

1. **Deploy to Render** (if you haven't already):
   - Push changes to GitHub (done automatically)
   - Render will redeploy with live keys
   
2. **Test with Real Money**:
   - Create a test user account
   - Subscribe to Daily plan (MWK 300)
   - Use your own mobile number
   - Approve the USSD prompt on your phone
   - Verify subscription activates

3. **Monitor First Payments**:
   - Check Render logs for webhook calls
   - Verify payments in Paychangu dashboard
   - Confirm subscriptions are created

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

- Live keys: ✅ Configured and active
- Test keys: Saved for future testing
- Webhook: ✅ Implemented and ready
- Payment flow: ✅ Complete
- Test endpoint: Available in development mode only
- Ready for production: ✅ YES

---

## Next Steps

1. ✅ ~~Get your live keys from Paychangu dashboard~~ DONE
2. ✅ ~~Update backend/.env with live keys~~ DONE
3. ✅ ~~Update render.yaml with live keys~~ DONE
4. ✅ ~~Push to GitHub~~ DONE
5. **Deploy to Render** - Service will auto-redeploy
6. **Test with small amount** (MWK 300 Daily plan)
7. **Monitor first few live payments**
8. **Set up payment monitoring/alerts** (optional)

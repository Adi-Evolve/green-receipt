import express from 'express';
import { handleStripeWebhook } from '../utils/stripe.js';
import Invoice from '../models/Invoice.js';

// Helper to update invoice status
async function updateInvoiceStatus(invoiceId, status) {
  await Invoice.findByIdAndUpdate(invoiceId, { status });
}

// Stripe webhook endpoint
const router = express.Router();
router.post('/webhook', express.raw({ type: 'application/json' }), (req, res) => {
  handleStripeWebhook(req, res, updateInvoiceStatus);
});

export default router;

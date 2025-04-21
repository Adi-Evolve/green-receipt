import express from 'express';
import Invoice from '../models/Invoice.js';
import { createInvoicePaymentLink } from '../utils/stripe.js';
const router = express.Router();

// List invoices
router.get('/:businessId', async (req, res) => {
  const invoices = await Invoice.find({ businessId: req.params.businessId });
  res.json(invoices);
});

// Create invoice with payment link
router.post('/:businessId', async (req, res) => {
  try {
    const invoiceData = req.body;
    // Save invoice first
    const invoice = new Invoice({ ...invoiceData, businessId: req.params.businessId });
    await invoice.save();
    // Generate payment link (Stripe)
    const paymentLink = await createInvoicePaymentLink({
      amount: invoice.amount,
      currency: invoice.currency || 'inr',
      invoiceId: invoice._id.toString(),
      customerEmail: invoice.customerEmail || ''
    });
    invoice.paymentLink = paymentLink;
    await invoice.save();
    res.json(invoice);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update invoice
router.patch('/:id', async (req, res) => {
  const i = await Invoice.findByIdAndUpdate(req.params.id, req.body, { new: true });
  res.json(i);
});

// Delete invoice
router.delete('/:id', async (req, res) => {
  await Invoice.findByIdAndDelete(req.params.id);
  res.json({ success: true });
});
export default router;

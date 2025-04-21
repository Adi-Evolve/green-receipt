// Stripe Payment Integration Utility
import Stripe from 'stripe';
const stripe = Stripe(process.env.STRIPE_SECRET_KEY || 'sk_test_yourkey');

// Create a payment link for an invoice
export async function createInvoicePaymentLink({ amount, currency = 'inr', invoiceId, customerEmail }) {
  const session = await stripe.checkout.sessions.create({
    payment_method_types: ['card'],
    line_items: [
      {
        price_data: {
          currency,
          product_data: {
            name: `Invoice #${invoiceId}`,
          },
          unit_amount: amount * 100, // Stripe uses paise/cents
        },
        quantity: 1,
      },
    ],
    customer_email: customerEmail,
    mode: 'payment',
    success_url: `${process.env.BASE_URL || 'http://localhost:3000'}/invoices/success?invoiceId=${invoiceId}`,
    cancel_url: `${process.env.BASE_URL || 'http://localhost:3000'}/invoices/cancel?invoiceId=${invoiceId}`,
    metadata: { invoiceId },
  });
  return session.url;
}

// Webhook handler (to be used in route)
export async function handleStripeWebhook(req, res, updateInvoiceStatus) {
  const sig = req.headers['stripe-signature'];
  let event;
  try {
    event = stripe.webhooks.constructEvent(req.rawBody, sig, process.env.STRIPE_WEBHOOK_SECRET || 'whsec_test');
  } catch (err) {
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }
  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    const invoiceId = session.metadata.invoiceId;
    await updateInvoiceStatus(invoiceId, 'paid');
  }
  res.json({ received: true });
}

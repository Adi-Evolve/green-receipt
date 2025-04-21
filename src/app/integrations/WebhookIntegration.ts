// Placeholder for webhook integration
export async function sendWebhook(url: string, payload: any) {
  try {
    await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
  } catch (err) {
    // Handle error
    console.error('Webhook failed', err);
  }
}

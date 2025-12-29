import { createPlatformClient } from './_shared/platformClient.ts';

/**
 * BTCPay Server webhook handler
 * Receives invoice status updates and credits points when settled
 * 
 * Webhook validation: BTCPay sends signature in header that must be verified
 * Idempotent: handles duplicate webhook deliveries safely
 */

Deno.serve(async (req) => {
  try {
    const base44 = createPlatformClient(req);

    // Read webhook body
    const body = await req.text();
    const webhookData = JSON.parse(body);

    // Verify webhook signature
    const signature = req.headers.get('btcpay-sig');
    const webhookSecret = Deno.env.get('BTCPAY_WEBHOOK_SECRET');

    if (webhookSecret && signature) {
      // Create HMAC signature to verify
      const encoder = new TextEncoder();
      const keyData = encoder.encode(webhookSecret);
      const key = await crypto.subtle.importKey(
        'raw',
        keyData,
        { name: 'HMAC', hash: 'SHA-256' },
        false,
        ['sign']
      );
      
      const signatureBuffer = await crypto.subtle.sign('HMAC', key, encoder.encode(body));
      const expectedSignature = 'sha256=' + Array.from(new Uint8Array(signatureBuffer))
        .map(b => b.toString(16).padStart(2, '0'))
        .join('');

      if (signature !== expectedSignature) {
        console.error('Invalid webhook signature');
        return Response.json({ error: 'Invalid signature' }, { status: 401 });
      }
    }

    console.log('BTCPay webhook received:', webhookData);

    // Extract invoice data
    const { invoiceId, type } = webhookData;

    if (!invoiceId) {
      return Response.json({ error: 'No invoiceId in webhook' }, { status: 400 });
    }

    // Find our internal invoice
    const invoices = await base44.asServiceRole.entities.CryptoInvoice.filter({ 
      btcpay_invoice_id: invoiceId 
    });

    if (invoices.length === 0) {
      console.log(`Invoice ${invoiceId} not found in database`);
      return Response.json({ error: 'Invoice not found' }, { status: 404 });
    }

    const invoice = invoices[0];

    // Log webhook event
    const webhookEvents = invoice.webhook_events || [];
    webhookEvents.push({
      type,
      received_at: new Date().toISOString(),
      data: webhookData
    });

    // Determine new status based on BTCPay event type
    let newStatus = invoice.status;
    let shouldCreditPoints = false;
    const now = new Date().toISOString();

    switch (type) {
      case 'InvoiceCreated':
        newStatus = 'created';
        break;
      
      case 'InvoiceReceivedPayment':
      case 'InvoiceProcessing':
        newStatus = 'processing';
        await base44.asServiceRole.entities.CryptoInvoice.update(invoice.id, {
          status: newStatus,
          paid_at: invoice.paid_at || now,
          webhook_events: webhookEvents
        });
        break;
      
      case 'InvoiceSettled':
      case 'InvoicePaymentSettled':
        newStatus = 'settled';
        shouldCreditPoints = !invoice.points_credited; // Only credit if not already done
        break;
      
      case 'InvoiceExpired':
      case 'InvoiceInvalid':
        newStatus = type === 'InvoiceExpired' ? 'expired' : 'invalid';
        await base44.asServiceRole.entities.CryptoInvoice.update(invoice.id, {
          status: newStatus,
          expired_at: now,
          webhook_events: webhookEvents
        });
        break;
    }

    // Handle settled invoices - credit points (idempotent)
    if (shouldCreditPoints && newStatus === 'settled') {
      // Get pack and player
      const packs = await base44.asServiceRole.entities.PointsPack.filter({ id: invoice.pack_id });
      const players = await base44.asServiceRole.entities.Player.filter({ id: invoice.player_id });

      if (packs.length > 0 && players.length > 0) {
        const pack = packs[0];
        const player = players[0];

        const newBalance = player.points_balance + pack.points_amount;

        // Update player balance
        await base44.asServiceRole.entities.Player.update(player.id, {
          points_balance: newBalance
        });

        // Create ledger entry
        await base44.asServiceRole.entities.Ledger.create({
          player_id: player.id,
          change: pack.points_amount,
          reason: 'pack_purchase',
          balance_after: newBalance,
          note: `BTC purchase: ${pack.name} (Invoice: ${invoiceId})`
        });

        // Mark invoice as credited
        await base44.asServiceRole.entities.CryptoInvoice.update(invoice.id, {
          status: 'settled',
          settled_at: now,
          points_credited: true,
          webhook_events: webhookEvents
        });

        console.log(`Points credited: ${pack.points_amount} to player ${player.id}`);
      }
    }

    return Response.json({ 
      success: true,
      invoice_id: invoice.id,
      status: newStatus,
      points_credited: shouldCreditPoints
    });

  } catch (error) {
    console.error('BTCPay webhook error:', error);
    return Response.json({ 
      error: error.message,
      success: false 
    }, { status: 500 });
  }
});
import { createPlatformClient } from './_shared/platformClient.ts';

Deno.serve(async (req) => {
  try {
    const base44 = createPlatformClient(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { pack_id } = await req.json();

    if (!pack_id) {
      return Response.json({ error: 'pack_id required' }, { status: 400 });
    }

    // Get player
    const players = await base44.asServiceRole.entities.Player.filter({ created_by: user.email });
    if (players.length === 0) {
      return Response.json({ error: 'Player not found' }, { status: 404 });
    }
    const player = players[0];

    // Get pack
    const packs = await base44.asServiceRole.entities.PointsPack.filter({ id: pack_id });
    if (packs.length === 0 || !packs[0].enabled) {
      return Response.json({ error: 'Pack not found or disabled' }, { status: 404 });
    }
    const pack = packs[0];

    if (pack.purchase_type !== 'btc') {
      return Response.json({ error: 'Pack is not available for BTC purchase' }, { status: 400 });
    }

    if (!pack.price_usd) {
      return Response.json({ error: 'Pack does not have a USD price set' }, { status: 400 });
    }

    // Get BTCPay credentials from env
    const btcpayUrl = Deno.env.get('BTCPAY_SERVER_URL');
    const btcpayApiKey = Deno.env.get('BTCPAY_API_KEY');
    const btcpayStoreId = Deno.env.get('BTCPAY_STORE_ID');
    const webhookSecret = Deno.env.get('BTCPAY_WEBHOOK_SECRET');

    if (!btcpayUrl || !btcpayApiKey || !btcpayStoreId) {
      return Response.json({ error: 'BTCPay Server not configured' }, { status: 500 });
    }

    // Create internal invoice record first
    const internalInvoice = await base44.asServiceRole.entities.CryptoInvoice.create({
      player_id: player.id,
      pack_id: pack.id,
      btcpay_invoice_id: 'pending',
      status: 'created',
      amount_usd: pack.price_usd,
      points_credited: false,
      webhook_events: []
    });

    // Call BTCPay Greenfield API to create invoice
    const btcpayResponse = await fetch(`${btcpayUrl}/api/v1/stores/${btcpayStoreId}/invoices`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `token ${btcpayApiKey}`
      },
      body: JSON.stringify({
        amount: pack.price_usd.toString(),
        currency: 'USD',
        metadata: {
          orderId: internalInvoice.id,
          itemDesc: `${pack.name} - ${pack.points_amount.toLocaleString()} Points (Entertainment Only - No Cash Value)`,
          buyerEmail: user.email,
          playerName: player.display_name
        },
        checkout: {
          redirectURL: `${Deno.env.get('BASE44_APP_URL') || 'http://localhost:5173'}/casino`,
          speedPolicy: 'MediumSpeed'
        }
      })
    });

    if (!btcpayResponse.ok) {
      const errorText = await btcpayResponse.text();
      console.error('BTCPay error:', errorText);
      return Response.json({ 
        error: 'Failed to create BTCPay invoice',
        details: errorText 
      }, { status: 500 });
    }

    const btcpayInvoice = await btcpayResponse.json();

    // Update our invoice with BTCPay details
    await base44.asServiceRole.entities.CryptoInvoice.update(internalInvoice.id, {
      btcpay_invoice_id: btcpayInvoice.id,
      checkout_url: btcpayInvoice.checkoutLink,
      amount_btc: btcpayInvoice.amount ? parseFloat(btcpayInvoice.amount) : null,
      amount_sats: btcpayInvoice.amount ? Math.round(parseFloat(btcpayInvoice.amount) * 100000000) : null
    });

    return Response.json({
      success: true,
      invoice_id: internalInvoice.id,
      btcpay_invoice_id: btcpayInvoice.id,
      checkout_url: btcpayInvoice.checkoutLink,
      amount_usd: pack.price_usd,
      points_amount: pack.points_amount
    });

  } catch (error) {
    console.error('Create BTCPay invoice error:', error);
    return Response.json({ 
      error: error.message,
      success: false 
    }, { status: 500 });
  }
});
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { ledger_id } = await req.json();

    if (!ledger_id) {
      return Response.json({ error: 'Ledger ID required' }, { status: 400 });
    }

    // Get ledger entry
    const ledgers = await base44.asServiceRole.entities.Ledger.filter({ id: ledger_id });
    if (ledgers.length === 0) {
      return Response.json({ error: 'Ledger entry not found' }, { status: 404 });
    }
    const ledger = ledgers[0];

    // Verify user owns this ledger entry
    const players = await base44.asServiceRole.entities.Player.filter({ created_by: user.email });
    if (players.length === 0 || players[0].id !== ledger.player_id) {
      return Response.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Generate share slug if not exists
    let shareSlug = ledger.share_slug;
    if (!shareSlug) {
      shareSlug = Math.random().toString(36).substring(2, 10).toUpperCase();
      await base44.asServiceRole.entities.Ledger.update(ledger_id, {
        share_slug: shareSlug,
        is_shareable: true
      });
    }

    return Response.json({
      success: true,
      share_slug: shareSlug,
      share_url: `/receipt/${shareSlug}`
    });

  } catch (error) {
    console.error('Receipt slug generation error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});
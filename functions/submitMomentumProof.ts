import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { race_id, entry_id } = await req.json();

    if (!race_id || !entry_id) {
      return Response.json({ error: 'race_id and entry_id required' }, { status: 400 });
    }

    // Get player
    const players = await base44.entities.Player.filter({ created_by: user.email });
    const player = players[0];
    if (!player) {
      return Response.json({ error: 'Player not found' }, { status: 404 });
    }

    // Get race
    const races = await base44.asServiceRole.entities.RaceEvent.filter({ id: race_id });
    const race = races[0];
    if (!race) {
      return Response.json({ error: 'Race not found' }, { status: 404 });
    }

    if (race.status !== 'running') {
      return Response.json({ error: 'Race not running' }, { status: 400 });
    }

    // Get entry
    const entries = await base44.asServiceRole.entities.RaceEntry.filter({ id: entry_id });
    const entry = entries[0];
    if (!entry) {
      return Response.json({ error: 'Entry not found' }, { status: 404 });
    }

    // Verify ownership
    if (entry.owner_id !== player.id) {
      return Response.json({ error: 'Not your entry' }, { status: 403 });
    }

    // Get all entries for normalization
    const allEntries = await base44.asServiceRole.entities.RaceEntry.filter({ race_id });

    // Increment proof count
    const newProofCount = (entry.momentum_proofs || 0) + 1;

    // Calculate normalized score
    const totalProofs = allEntries.reduce((sum, e) => sum + (e.momentum_proofs || 0), 0) + 1;
    const normalizedScore = totalProofs > 0 ? (newProofCount / totalProofs) * 10 : 0; // Scale 0-10

    // Get config for cap
    const configs = await base44.asServiceRole.entities.RaceConfig.list();
    const config = configs[0];
    const cap = config?.momentum_impact_cap || 8;

    // Apply cap
    const cappedScore = Math.min(normalizedScore, cap);

    // Update entry
    await base44.asServiceRole.entities.RaceEntry.update(entry_id, {
      momentum_proofs: newProofCount,
      momentum_score: cappedScore,
    });

    // Recalculate all entries' scores for fairness
    for (const e of allEntries) {
      if (e.id === entry_id) continue;
      const entryProofs = e.momentum_proofs || 0;
      const score = totalProofs > 0 ? (entryProofs / totalProofs) * 10 : 0;
      const capped = Math.min(score, cap);
      await base44.asServiceRole.entities.RaceEntry.update(e.id, {
        momentum_score: capped,
      });
    }

    return Response.json({
      success: true,
      new_proof_count: newProofCount,
      momentum_score: cappedScore,
      max_impact: cap,
    });
  } catch (error) {
    console.error('Momentum proof error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { player_id } = await req.json();

    // Get house config
    const configs = await base44.asServiceRole.entities.HouseConfig.list();
    const config = configs[0];

    if (!config?.referral_enabled) {
      return Response.json({ awarded: false, reason: 'Referral system disabled' });
    }

    // Get player
    const player = await base44.asServiceRole.entities.Player.filter({ id: player_id });
    if (!player || player.length === 0) {
      return Response.json({ error: 'Player not found' }, { status: 404 });
    }

    const currentPlayer = player[0];

    // Check if player was referred
    if (!currentPlayer.referred_by) {
      return Response.json({ awarded: false, reason: 'Not a referred player' });
    }

    // Get referral record
    const referrals = await base44.asServiceRole.entities.Referral.filter({
      referee_id: player_id,
      referrer_bonus_claimed: false
    });

    if (!referrals || referrals.length === 0) {
      return Response.json({ awarded: false, reason: 'Referral already claimed or not found' });
    }

    const referral = referrals[0];

    // Check if referee has played enough games
    if (currentPlayer.games_played < config.referral_min_spins) {
      return Response.json({ 
        awarded: false, 
        reason: `Need ${config.referral_min_spins} games played (current: ${currentPlayer.games_played})` 
      });
    }

    // Award referrer bonus
    const referrer = await base44.asServiceRole.entities.Player.filter({ id: referral.referrer_id });
    if (!referrer || referrer.length === 0) {
      return Response.json({ error: 'Referrer not found' }, { status: 404 });
    }

    const referrerPlayer = referrer[0];
    const bonusAmount = config.referral_inviter_bonus;
    const newBalance = referrerPlayer.points_balance + bonusAmount;

    // Update referrer balance
    await base44.asServiceRole.entities.Player.update(referrerPlayer.id, {
      points_balance: newBalance
    });

    // Create ledger entry for referrer
    await base44.asServiceRole.entities.Ledger.create({
      player_id: referrerPlayer.id,
      change: bonusAmount,
      reason: 'referral_bonus',
      balance_after: newBalance,
      note: `Referral bonus from ${currentPlayer.display_name}`
    });

    // Update referral record
    await base44.asServiceRole.entities.Referral.update(referral.id, {
      referrer_bonus: bonusAmount,
      referrer_bonus_claimed: true,
      referee_games_played: currentPlayer.games_played,
      status: 'completed'
    });

    // Mark player as bonus claimed
    await base44.asServiceRole.entities.Player.update(currentPlayer.id, {
      referral_bonus_claimed: true
    });

    // Check for milestone bonuses
    const completedReferrals = await base44.asServiceRole.entities.Referral.filter({
      referrer_id: referrerPlayer.id,
      status: 'completed'
    });

    const completedCount = completedReferrals.length;
    let milestoneBonus = 0;
    let milestoneName = '';

    if (completedCount === 5 && config.referral_milestone_5) {
      milestoneBonus = config.referral_milestone_5;
      milestoneName = '5th referral';
    } else if (completedCount === 10 && config.referral_milestone_10) {
      milestoneBonus = config.referral_milestone_10;
      milestoneName = '10th referral';
    } else if (completedCount === 20 && config.referral_milestone_20) {
      milestoneBonus = config.referral_milestone_20;
      milestoneName = '20th referral';
    }

    if (milestoneBonus > 0) {
      const milestoneBalance = newBalance + milestoneBonus;
      await base44.asServiceRole.entities.Player.update(referrerPlayer.id, {
        points_balance: milestoneBalance
      });

      await base44.asServiceRole.entities.Ledger.create({
        player_id: referrerPlayer.id,
        change: milestoneBonus,
        reason: 'referral_bonus',
        balance_after: milestoneBalance,
        note: `🎉 Milestone bonus: ${milestoneName}!`
      });
    }

    return Response.json({ 
      awarded: true, 
      amount: bonusAmount,
      referrer: referrerPlayer.display_name,
      milestone: milestoneBonus > 0 ? { amount: milestoneBonus, name: milestoneName } : null
    });

  } catch (error) {
    console.error('Check referral bonus error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});
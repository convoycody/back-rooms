import { createPlatformClient } from './_shared/platformClient.ts';

Deno.serve(async (req) => {
  try {
    const base44 = createPlatformClient(req);
    const { race_id } = await req.json();

    if (!race_id) {
      return Response.json({ error: 'race_id required' }, { status: 400 });
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

    // Get entries
    const entries = await base44.asServiceRole.entities.RaceEntry.filter({ race_id });
    if (entries.length === 0) {
      return Response.json({ error: 'No entries' }, { status: 400 });
    }

    // Get config
    const configs = await base44.asServiceRole.entities.RaceConfig.list();
    const config = configs[0];

    // Check minimum pool size
    const totalBettingPool = race.total_win_pool + race.total_place_pool + race.total_show_pool;
    const minPoolSize = config?.min_pool_size || 0;
    
    if (minPoolSize > 0 && totalBettingPool < minPoolSize) {
      // Refund all bets
      const allBets = await base44.asServiceRole.entities.RaceBet.filter({ race_id });
      for (const bet of allBets) {
        const bettors = await base44.asServiceRole.entities.Player.filter({ id: bet.player_id });
        const bettor = bettors[0];
        await base44.asServiceRole.entities.Player.update(bet.player_id, {
          points_balance: bettor.points_balance + bet.amount,
        });
        await base44.asServiceRole.entities.RaceBet.update(bet.id, { status: 'refunded' });
        await base44.asServiceRole.entities.Ledger.create({
          player_id: bet.player_id,
          change: bet.amount,
          reason: 'refund',
          balance_after: bettor.points_balance + bet.amount,
          note: `Bet refunded - pool below minimum - Race ${race.id.slice(0, 6)}`,
        });
      }
      
      await base44.asServiceRole.entities.RaceEvent.update(race_id, {
        status: 'cancelled',
        completed_at: new Date().toISOString(),
      });
      
      return Response.json({ 
        success: false, 
        message: 'Race cancelled - betting pool below minimum',
        pool_size: totalBettingPool,
        min_required: minPoolSize
      });
    }

    // Get horses for skill ratings
    const horsesData = await Promise.all(
      entries.map(entry => 
        base44.asServiceRole.entities.RaceHorse.filter({ id: entry.horse_id }).then(h => h[0])
      )
    );

    // Determine winner using RNG + skill + momentum
    const results = entries.map((entry, idx) => {
      const horse = horsesData[idx];
      const baseRng = Math.random();
      const skillBonus = (horse?.skill_rating || 1000) / 10000;
      const momentumBonus = (entry.momentum_score || 0) / 100; // Convert to decimal
      const finalScore = baseRng + skillBonus + momentumBonus;
      
      return {
        ...entry,
        horse,
        finalScore,
      };
    });

    // Sort by score
    results.sort((a, b) => b.finalScore - a.finalScore);

    // Assign positions
    const winner = results[0];
    const second = results[1] || null;
    const third = results[2] || null;

    // Calculate purse payouts
    const totalPurse = race.total_owner_purse;
    const winPayout = Math.floor(totalPurse * (config.owner_purse_win_percentage / 100));
    const placePayout = second ? Math.floor(totalPurse * (config.owner_purse_place_percentage / 100)) : 0;
    const showPayout = third ? Math.floor(totalPurse * (config.owner_purse_show_percentage / 100)) : 0;

    // Update winner entry
    await base44.asServiceRole.entities.RaceEntry.update(winner.id, {
      final_position: 1,
      payout: winPayout,
    });

    // Pay winner
    const winnerOwners = await base44.asServiceRole.entities.Player.filter({ id: winner.owner_id });
    const winnerOwner = winnerOwners[0];
    await base44.asServiceRole.entities.Player.update(winner.owner_id, {
      points_balance: winnerOwner.points_balance + winPayout,
    });

    await base44.asServiceRole.entities.Ledger.create({
      player_id: winner.owner_id,
      change: winPayout,
      reason: 'game_win',
      balance_after: winnerOwner.points_balance + winPayout,
      note: `1st place purse - Race ${race.id.slice(0, 6)}`,
    });

    // Update winner horse
    const winnerHorses = await base44.asServiceRole.entities.RaceHorse.filter({ id: winner.horse_id });
    const winnerHorse = winnerHorses[0];
    await base44.asServiceRole.entities.RaceHorse.update(winner.horse_id, {
      races_entered: winnerHorse.races_entered + 1,
      wins: winnerHorse.wins + 1,
      total_earnings: winnerHorse.total_earnings + winPayout,
      skill_rating: winnerHorse.skill_rating + 25,
    });

    // Update license
    const winnerLicenses = await base44.asServiceRole.entities.OwnerLicense.filter({ player_id: winner.owner_id });
    const winnerLicense = winnerLicenses[0];
    await base44.asServiceRole.entities.OwnerLicense.update(winnerLicense.id, {
      total_races_entered: winnerLicense.total_races_entered + 1,
      total_wins: winnerLicense.total_wins + 1,
      total_earnings: winnerLicense.total_earnings + winPayout,
    });

    // Handle 2nd place
    if (second) {
      await base44.asServiceRole.entities.RaceEntry.update(second.id, {
        final_position: 2,
        payout: placePayout,
      });

      const secondOwners = await base44.asServiceRole.entities.Player.filter({ id: second.owner_id });
      const secondOwner = secondOwners[0];
      await base44.asServiceRole.entities.Player.update(second.owner_id, {
        points_balance: secondOwner.points_balance + placePayout,
      });

      await base44.asServiceRole.entities.Ledger.create({
        player_id: second.owner_id,
        change: placePayout,
        reason: 'game_win',
        balance_after: secondOwner.points_balance + placePayout,
        note: `2nd place purse - Race ${race.id.slice(0, 6)}`,
      });

      const secondHorses = await base44.asServiceRole.entities.RaceHorse.filter({ id: second.horse_id });
      const secondHorse = secondHorses[0];
      await base44.asServiceRole.entities.RaceHorse.update(second.horse_id, {
        races_entered: secondHorse.races_entered + 1,
        places: secondHorse.places + 1,
        total_earnings: secondHorse.total_earnings + placePayout,
        skill_rating: secondHorse.skill_rating + 15,
      });
    }

    // Handle 3rd place
    if (third) {
      await base44.asServiceRole.entities.RaceEntry.update(third.id, {
        final_position: 3,
        payout: showPayout,
      });

      const thirdOwners = await base44.asServiceRole.entities.Player.filter({ id: third.owner_id });
      const thirdOwner = thirdOwners[0];
      await base44.asServiceRole.entities.Player.update(third.owner_id, {
        points_balance: thirdOwner.points_balance + showPayout,
      });

      await base44.asServiceRole.entities.Ledger.create({
        player_id: third.owner_id,
        change: showPayout,
        reason: 'game_win',
        balance_after: thirdOwner.points_balance + showPayout,
        note: `3rd place purse - Race ${race.id.slice(0, 6)}`,
      });

      const thirdHorses = await base44.asServiceRole.entities.RaceHorse.filter({ id: third.horse_id });
      const thirdHorse = thirdHorses[0];
      await base44.asServiceRole.entities.RaceHorse.update(third.horse_id, {
        races_entered: thirdHorse.races_entered + 1,
        shows: thirdHorse.shows + 1,
        total_earnings: thirdHorse.total_earnings + showPayout,
        skill_rating: thirdHorse.skill_rating + 10,
      });
    }

    // Calculate and distribute betting payouts
    const houseTake = config.house_take_percentage / 100;

    // Win pool
    if (race.total_win_pool > 0) {
      const winBets = await base44.asServiceRole.entities.RaceBet.filter({
        race_id,
        bet_type: 'win',
        horse_id: winner.horse_id,
      });

      const afterHouse = race.total_win_pool * (1 - houseTake);
      const totalWinBetAmount = winBets.reduce((sum, b) => sum + b.amount, 0);

      for (const bet of winBets) {
        const payout = Math.floor((bet.amount / totalWinBetAmount) * afterHouse);
        await base44.asServiceRole.entities.RaceBet.update(bet.id, {
          status: 'won',
          payout,
        });

        const bettors = await base44.asServiceRole.entities.Player.filter({ id: bet.player_id });
        const bettor = bettors[0];
        await base44.asServiceRole.entities.Player.update(bet.player_id, {
          points_balance: bettor.points_balance + payout,
        });

        await base44.asServiceRole.entities.Ledger.create({
          player_id: bet.player_id,
          change: payout,
          reason: 'game_win',
          balance_after: bettor.points_balance + payout,
          note: `WIN bet payout - Race ${race.id.slice(0, 6)}`,
        });
      }
    }

    // Place pool (1st or 2nd)
    if (race.total_place_pool > 0 && second) {
      const placeBets = await base44.asServiceRole.entities.RaceBet.filter({
        race_id,
        bet_type: 'place',
      });

      const winningPlaceBets = placeBets.filter(
        b => b.horse_id === winner.horse_id || b.horse_id === second.horse_id
      );

      const afterHouse = race.total_place_pool * (1 - houseTake);
      const totalPlaceBetAmount = winningPlaceBets.reduce((sum, b) => sum + b.amount, 0);

      for (const bet of winningPlaceBets) {
        const payout = Math.floor((bet.amount / totalPlaceBetAmount) * afterHouse);
        await base44.asServiceRole.entities.RaceBet.update(bet.id, {
          status: 'won',
          payout,
        });

        const bettors = await base44.asServiceRole.entities.Player.filter({ id: bet.player_id });
        const bettor = bettors[0];
        await base44.asServiceRole.entities.Player.update(bet.player_id, {
          points_balance: bettor.points_balance + payout,
        });

        await base44.asServiceRole.entities.Ledger.create({
          player_id: bet.player_id,
          change: payout,
          reason: 'game_win',
          balance_after: bettor.points_balance + payout,
          note: `PLACE bet payout - Race ${race.id.slice(0, 6)}`,
        });
      }
    }

    // Show pool (1st, 2nd or 3rd)
    if (race.total_show_pool > 0 && third) {
      const showBets = await base44.asServiceRole.entities.RaceBet.filter({
        race_id,
        bet_type: 'show',
      });

      const winningShowBets = showBets.filter(
        b => b.horse_id === winner.horse_id || b.horse_id === second.horse_id || b.horse_id === third.horse_id
      );

      const afterHouse = race.total_show_pool * (1 - houseTake);
      const totalShowBetAmount = winningShowBets.reduce((sum, b) => sum + b.amount, 0);

      for (const bet of winningShowBets) {
        const payout = Math.floor((bet.amount / totalShowBetAmount) * afterHouse);
        await base44.asServiceRole.entities.RaceBet.update(bet.id, {
          status: 'won',
          payout,
        });

        const bettors = await base44.asServiceRole.entities.Player.filter({ id: bet.player_id });
        const bettor = bettors[0];
        await base44.asServiceRole.entities.Player.update(bet.player_id, {
          points_balance: bettor.points_balance + payout,
        });

        await base44.asServiceRole.entities.Ledger.create({
          player_id: bet.player_id,
          change: payout,
          reason: 'game_win',
          balance_after: bettor.points_balance + payout,
          note: `SHOW bet payout - Race ${race.id.slice(0, 6)}`,
        });
      }
    }

    // Mark losing bets
    const allBets = await base44.asServiceRole.entities.RaceBet.filter({ race_id });
    for (const bet of allBets) {
      if (bet.status === 'active') {
        await base44.asServiceRole.entities.RaceBet.update(bet.id, { status: 'lost' });
      }
    }

    // Update race
    await base44.asServiceRole.entities.RaceEvent.update(race_id, {
      status: 'completed',
      completed_at: new Date().toISOString(),
      winning_horse_id: winner.horse_id,
      second_horse_id: second?.horse_id || null,
      third_horse_id: third?.horse_id || null,
    });

    // Create announcement for Main Event wins (6-horse races)
    if (race.max_horses === 6 && winPayout >= 50000) {
      const winnerHorses = await base44.asServiceRole.entities.RaceHorse.filter({ id: winner.horse_id });
      const winningHorse = winnerHorses[0];
      const owners = await base44.asServiceRole.entities.Player.filter({ id: winner.owner_id });
      const owner = owners[0];

      if (owner && winningHorse) {
        await base44.asServiceRole.entities.Announcement.create({
          player_id: winner.owner_id,
          type: 'big_win',
          game_id: 'derby',
          game_name: 'Derby Main Event',
          amount: winPayout,
          multiplier: race.entry_fee > 0 ? winPayout / race.entry_fee : 0,
          player_name: owner.display_name || owner.created_by,
          metadata: {
            race_id: race.id,
            race_number: race.race_number,
            horse_name: winningHorse.horse_name,
            horse_emoji: winningHorse.avatar_emoji,
          },
        });
      }
    }

    return Response.json({
      success: true,
      winner: winner.horse_id,
      second: second?.horse_id,
      third: third?.horse_id,
      payouts: {
        win: winPayout,
        place: placePayout,
        show: showPayout,
      },
    });
  } catch (error) {
    console.error('Race completion error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});
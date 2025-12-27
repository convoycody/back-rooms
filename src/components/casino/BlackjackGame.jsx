import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from "@/components/ui/button";
import { Loader2 } from 'lucide-react';

const SUITS = ['♠', '♥', '♦', '♣'];
const RANKS = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];

const createDeck = () => {
  const deck = [];
  for (const suit of SUITS) {
    for (const rank of RANKS) {
      deck.push({ suit, rank });
    }
  }
  return deck.sort(() => Math.random() - 0.5);
};

const getCardValue = (rank) => {
  if (rank === 'A') return 11;
  if (['K', 'Q', 'J'].includes(rank)) return 10;
  return parseInt(rank);
};

const calculateHand = (hand) => {
  let value = 0;
  let aces = 0;
  
  for (const card of hand) {
    value += getCardValue(card.rank);
    if (card.rank === 'A') aces++;
  }
  
  while (value > 21 && aces > 0) {
    value -= 10;
    aces--;
  }
  
  return value;
};

const Card = ({ card, hidden = false, delay = 0 }) => {
  const isRed = card.suit === '♥' || card.suit === '♦';
  
  return (
    <motion.div
      initial={{ opacity: 0, y: -50, rotateY: 180 }}
      animate={{ opacity: 1, y: 0, rotateY: hidden ? 180 : 0 }}
      transition={{ duration: 0.3, delay }}
      className="relative w-16 h-24 sm:w-20 sm:h-28"
      style={{ perspective: '1000px' }}
    >
      <div className={`absolute inset-0 rounded-xl shadow-xl ${
        hidden 
          ? 'bg-gradient-to-br from-blue-600 to-blue-800 border-2 border-blue-400/30'
          : 'bg-gradient-to-br from-white to-slate-100 border-2 border-slate-200'
      }`}>
        {hidden ? (
          <div className="absolute inset-2 rounded-lg border-2 border-blue-400/20 flex items-center justify-center">
            <span className="text-3xl opacity-30">🎴</span>
          </div>
        ) : (
          <div className="p-2 h-full flex flex-col">
            <div className={`text-sm font-bold ${isRed ? 'text-red-500' : 'text-slate-900'}`}>
              {card.rank}
            </div>
            <div className={`flex-1 flex items-center justify-center text-3xl ${isRed ? 'text-red-500' : 'text-slate-900'}`}>
              {card.suit}
            </div>
            <div className={`text-sm font-bold text-right transform rotate-180 ${isRed ? 'text-red-500' : 'text-slate-900'}`}>
              {card.rank}
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
};

const HandDisplay = ({ cards, label, value, hidden = false, isDealer = false }) => (
  <div className="text-center">
    <div className="flex items-center justify-center gap-1 mb-2">
      <span className="text-slate-400 text-sm">{label}</span>
      {!hidden && (
        <span className={`ml-2 px-2 py-0.5 rounded text-sm font-bold ${
          value === 21 ? 'bg-green-500/20 text-green-400' :
          value > 21 ? 'bg-red-500/20 text-red-400' :
          'bg-slate-700 text-slate-300'
        }`}>
          {value}
        </span>
      )}
    </div>
    <div className="flex justify-center gap-2 flex-wrap">
      {cards.map((card, idx) => (
        <Card 
          key={idx} 
          card={card} 
          hidden={isDealer && idx === 1 && hidden}
          delay={idx * 0.1}
        />
      ))}
    </div>
  </div>
);

export default function BlackjackGame({ balance, onGameEnd, disabled }) {
  const [deck, setDeck] = useState([]);
  const [playerHand, setPlayerHand] = useState([]);
  const [dealerHand, setDealerHand] = useState([]);
  const [gameState, setGameState] = useState('betting'); // betting, playing, dealerTurn, ended
  const [betAmount, setBetAmount] = useState(25);
  const [result, setResult] = useState(null);
  const [isDealing, setIsDealing] = useState(false);

  const betOptions = [25, 50, 100, 250, 500];

  const playerValue = calculateHand(playerHand);
  const dealerValue = calculateHand(dealerHand);
  const dealerVisibleValue = dealerHand.length > 0 ? getCardValue(dealerHand[0].rank) : 0;

  const startGame = () => {
    const newDeck = createDeck();
    const pHand = [newDeck.pop(), newDeck.pop()];
    const dHand = [newDeck.pop(), newDeck.pop()];
    
    setDeck(newDeck);
    setPlayerHand(pHand);
    setDealerHand(dHand);
    setGameState('playing');
    setResult(null);
    setIsDealing(true);
    
    setTimeout(() => setIsDealing(false), 500);

    // Check for natural blackjack
    const pValue = calculateHand(pHand);
    const dValue = calculateHand(dHand);
    
    if (pValue === 21) {
      setTimeout(() => {
        if (dValue === 21) {
          endGame('push', pHand, dHand);
        } else {
          endGame('blackjack', pHand, dHand);
        }
      }, 800);
    }
  };

  const hit = () => {
    const newCard = deck.pop();
    const newHand = [...playerHand, newCard];
    setPlayerHand(newHand);
    setDeck([...deck]);
    
    const value = calculateHand(newHand);
    if (value > 21) {
      setTimeout(() => endGame('bust', newHand, dealerHand), 500);
    } else if (value === 21) {
      setTimeout(() => stand(newHand), 500);
    }
  };

  const stand = (currentHand = playerHand) => {
    setGameState('dealerTurn');
    dealerPlay(currentHand);
  };

  const dealerPlay = async (pHand) => {
    let currentDeck = [...deck];
    let dHand = [...dealerHand];
    
    const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));
    
    while (calculateHand(dHand) < 17) {
      await delay(600);
      const newCard = currentDeck.pop();
      dHand = [...dHand, newCard];
      setDealerHand(dHand);
      setDeck([...currentDeck]);
    }
    
    await delay(500);
    
    const pValue = calculateHand(pHand);
    const dValue = calculateHand(dHand);
    
    if (dValue > 21) {
      endGame('dealerBust', pHand, dHand);
    } else if (dValue > pValue) {
      endGame('lose', pHand, dHand);
    } else if (pValue > dValue) {
      endGame('win', pHand, dHand);
    } else {
      endGame('push', pHand, dHand);
    }
  };

  const endGame = (outcome, pHand, dHand) => {
    setGameState('ended');
    
    let payout = 0;
    let resultText = '';
    
    switch (outcome) {
      case 'blackjack':
        payout = Math.floor(betAmount * 2.5);
        resultText = 'BLACKJACK!';
        break;
      case 'win':
      case 'dealerBust':
        payout = betAmount * 2;
        resultText = outcome === 'dealerBust' ? 'Dealer Busts!' : 'You Win!';
        break;
      case 'push':
        payout = betAmount;
        resultText = 'Push - Bet Returned';
        break;
      case 'bust':
        payout = 0;
        resultText = 'Bust!';
        break;
      case 'lose':
        payout = 0;
        resultText = 'Dealer Wins';
        break;
    }
    
    setResult({ outcome, text: resultText, payout });
    
    onGameEnd({
      bet: betAmount,
      outcome,
      payout,
      playerHand: pHand,
      dealerHand: dHand,
      playerValue: calculateHand(pHand),
      dealerValue: calculateHand(dHand)
    });
  };

  const resetGame = () => {
    setPlayerHand([]);
    setDealerHand([]);
    setGameState('betting');
    setResult(null);
  };

  return (
    <div className="bg-gradient-to-b from-slate-900/90 to-slate-950/90 backdrop-blur-xl rounded-3xl p-6 sm:p-8 border border-emerald-500/20 shadow-2xl shadow-emerald-500/5">
      {/* Header */}
      <div className="text-center mb-6">
        <h2 className="text-3xl font-black bg-gradient-to-r from-emerald-400 via-green-300 to-emerald-400 bg-clip-text text-transparent tracking-tight">
          BLACKJACK
        </h2>
        <p className="text-slate-400 text-sm mt-1">Get 21 or beat the dealer!</p>
      </div>

      {/* Table */}
      <div className="relative bg-gradient-to-b from-emerald-900/50 to-emerald-950/50 rounded-2xl p-6 mb-6 border border-emerald-700/30 min-h-[320px]">
        <div className="absolute inset-0 rounded-2xl bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-emerald-500/5 to-transparent pointer-events-none" />
        
        {gameState === 'betting' ? (
          <div className="flex flex-col items-center justify-center h-64">
            <div className="text-6xl mb-4">🃏</div>
            <p className="text-slate-400 mb-4">Select your bet and deal</p>
            <div className="flex flex-wrap justify-center gap-2 mb-6">
              {betOptions.map((amount) => (
                <button
                  key={amount}
                  onClick={() => setBetAmount(amount)}
                  disabled={amount > balance}
                  className={`px-4 py-2 rounded-lg font-semibold transition-all ${
                    betAmount === amount
                      ? 'bg-emerald-500 text-black shadow-lg shadow-emerald-500/30'
                      : amount > balance
                      ? 'bg-slate-800 text-slate-600 cursor-not-allowed'
                      : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                  }`}
                >
                  {amount}
                </button>
              ))}
            </div>
            <Button
              onClick={startGame}
              disabled={disabled || balance < betAmount}
              className="px-8 py-3 text-lg font-bold bg-gradient-to-r from-emerald-500 to-green-500 hover:from-emerald-400 hover:to-green-400 text-black rounded-xl shadow-lg shadow-emerald-500/30"
            >
              Deal - {betAmount} pts
            </Button>
          </div>
        ) : (
          <div className="space-y-8">
            {/* Dealer Hand */}
            <HandDisplay
              cards={dealerHand}
              label="Dealer"
              value={gameState === 'playing' ? dealerVisibleValue : dealerValue}
              hidden={gameState === 'playing'}
              isDealer={true}
            />
            
            {/* Divider */}
            <div className="flex items-center gap-4">
              <div className="flex-1 h-px bg-gradient-to-r from-transparent via-emerald-500/30 to-transparent" />
              <span className="text-emerald-500/50 text-sm">vs</span>
              <div className="flex-1 h-px bg-gradient-to-r from-transparent via-emerald-500/30 to-transparent" />
            </div>
            
            {/* Player Hand */}
            <HandDisplay
              cards={playerHand}
              label="Your Hand"
              value={playerValue}
            />
          </div>
        )}
      </div>

      {/* Result Display */}
      <AnimatePresence>
        {result && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="text-center mb-6"
          >
            <div className={`inline-block px-6 py-3 rounded-xl ${
              result.payout > betAmount 
                ? 'bg-gradient-to-r from-emerald-500/20 via-green-500/20 to-emerald-500/20 border border-emerald-400/30' 
                : result.payout === betAmount
                ? 'bg-amber-500/20 border border-amber-500/30'
                : 'bg-red-500/20 border border-red-500/30'
            }`}>
              <p className={`font-bold text-lg ${
                result.payout > betAmount ? 'text-emerald-400' : 
                result.payout === betAmount ? 'text-amber-400' : 'text-red-400'
              }`}>
                {result.text}
              </p>
              <p className={`text-2xl font-black ${
                result.payout > betAmount ? 'text-emerald-300' : 
                result.payout === betAmount ? 'text-amber-300' : 'text-red-300'
              }`}>
                {result.payout > 0 ? `+${result.payout - betAmount}` : `-${betAmount}`} points
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Action Buttons */}
      {gameState === 'playing' && !isDealing && (
        <div className="flex gap-4 justify-center">
          <Button
            onClick={hit}
            disabled={playerValue >= 21}
            className="px-8 py-3 text-lg font-bold bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 text-white rounded-xl"
          >
            Hit
          </Button>
          <Button
            onClick={() => stand()}
            className="px-8 py-3 text-lg font-bold bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-black rounded-xl"
          >
            Stand
          </Button>
        </div>
      )}

      {gameState === 'dealerTurn' && (
        <div className="flex justify-center">
          <div className="flex items-center gap-2 text-slate-400">
            <Loader2 className="w-5 h-5 animate-spin" />
            <span>Dealer's turn...</span>
          </div>
        </div>
      )}

      {gameState === 'ended' && (
        <div className="flex justify-center">
          <Button
            onClick={resetGame}
            className="px-8 py-3 text-lg font-bold bg-gradient-to-r from-emerald-500 to-green-500 hover:from-emerald-400 hover:to-green-400 text-black rounded-xl shadow-lg shadow-emerald-500/30"
          >
            Play Again
          </Button>
        </div>
      )}
    </div>
  );
}
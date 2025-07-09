
import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MessageCircle, Settings, Volume2 } from 'lucide-react';
import { PlayerCard } from './PlayerCard';
import { GameChat } from './GameChat';
import { CardHand } from './CardHand';
import { ScoreBoard } from './ScoreBoard';

interface Player {
  id: string;
  name: string;
  avatar: string;
  isBot: boolean;
  team: 'A' | 'B';
  position: 'bottom' | 'left' | 'top' | 'right';
}

interface GameState {
  phase: 'mus' | 'grande' | 'chica' | 'pares' | 'juego';
  currentPlayer: string;
  pot: number;
  teamAScore: number;
  teamBScore: number;
  round: number;
}

const GameTable = () => {
  const [showChat, setShowChat] = useState(false);
  const [gameState, setGameState] = useState<GameState>({
    phase: 'mus',
    currentPlayer: 'player1',
    pot: 0,
    teamAScore: 0,
    teamBScore: 15,
    round: 1
  });

  const players: Player[] = [
    { id: 'player1', name: 'Tú', avatar: '🧑‍💻', isBot: false, team: 'A', position: 'bottom' },
    { id: 'player2', name: 'Chigga', avatar: '🐵', isBot: true, team: 'B', position: 'left' },
    { id: 'player3', name: 'Xosé Roberto', avatar: '🧓🏻', isBot: true, team: 'A', position: 'top' },
    { id: 'player4', name: 'La Zaray', avatar: '💅', isBot: true, team: 'B', position: 'right' }
  ];

  const currentPlayer = players.find(p => p.id === gameState.currentPlayer);
  const userPlayer = players.find(p => !p.isBot);

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-800 via-green-700 to-green-900 relative overflow-hidden">
      {/* Game Table Background */}
      <div className="absolute inset-0 bg-gradient-radial from-green-600/20 to-transparent"></div>
      
      {/* Header */}
      <div className="relative z-10 flex justify-between items-center p-4 bg-black/20 backdrop-blur-sm">
        <div className="flex items-center gap-4">
          <h1 className="text-2xl font-bold text-white">🃏 El Mus</h1>
          <Badge variant="secondary" className="bg-white/20 text-white">
            Ronda {gameState.round} - {gameState.phase.toUpperCase()}
          </Badge>
        </div>
        
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            className="text-white hover:bg-white/20"
            onClick={() => setShowChat(!showChat)}
          >
            <MessageCircle className="w-5 h-5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="text-white hover:bg-white/20"
          >
            <Volume2 className="w-5 h-5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="text-white hover:bg-white/20"
          >
            <Settings className="w-5 h-5" />
          </Button>
        </div>
      </div>

      {/* Main Game Area */}
      <div className="relative z-10 flex h-[calc(100vh-80px)]">
        {/* Game Table */}
        <div className="flex-1 p-4">
          <div className="relative w-full h-full max-w-5xl mx-auto">
            {/* Score Board */}
            <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-20">
              <ScoreBoard 
                teamAScore={gameState.teamAScore}
                teamBScore={gameState.teamBScore}
                pot={gameState.pot}
              />
            </div>

            {/* Players positioned around the table */}
            {players.map((player) => (
              <PlayerCard
                key={player.id}
                player={player}
                isCurrentPlayer={player.id === gameState.currentPlayer}
                isUserPlayer={!player.isBot}
              />
            ))}

            {/* Center Table Area */}
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
              <div className="w-48 h-32 bg-green-600/30 rounded-xl border-4 border-yellow-400/50 flex items-center justify-center">
                <div className="text-center text-white">
                  <div className="text-lg font-semibold">Bote: {gameState.pot}</div>
                  <div className="text-sm opacity-75">piedras</div>
                </div>
              </div>
            </div>

            {/* User's Hand */}
            {userPlayer && (
              <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2">
                <CardHand />
              </div>
            )}

            {/* Game Actions */}
            <div className="absolute bottom-20 left-1/2 transform -translate-x-1/2">
              <div className="flex gap-3">
                <Button className="bg-blue-600 hover:bg-blue-700">
                  Mus
                </Button>
                <Button className="bg-red-600 hover:bg-red-700">
                  No Mus
                </Button>
                <Button className="bg-yellow-600 hover:bg-yellow-700">
                  Pasar
                </Button>
                <Button className="bg-green-600 hover:bg-green-700">
                  Envidar
                </Button>
                <Button className="bg-purple-600 hover:bg-purple-700">
                  Órdago
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Chat Panel */}
        {showChat && (
          <div className="w-80 bg-black/30 backdrop-blur-sm border-l border-white/20">
            <GameChat />
          </div>
        )}
      </div>
    </div>
  );
};

export default GameTable;

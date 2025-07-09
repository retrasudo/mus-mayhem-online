
import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MessageCircle, Settings, Volume2 } from 'lucide-react';
import { PlayerCard } from './PlayerCard';
import { GameChat } from './GameChat';
import { CardHand } from './CardHand';
import { ScoreBoard } from './ScoreBoard';
import { CharacterSelection } from './CharacterSelection';
import { MusGameEngine } from '@/utils/gameLogic';
import { GameState, Player } from '@/types/game';

const GameTable = () => {
  const [showChat, setShowChat] = useState(false);
  const [showCharacterSelection, setShowCharacterSelection] = useState(true);
  const [gameEngine, setGameEngine] = useState<MusGameEngine | null>(null);
  const [gameState, setGameState] = useState<GameState | null>(null);

  const userPlayer = { name: 'Tú', avatar: '🧑‍💻' };

  useEffect(() => {
    if (gameEngine) {
      const interval = setInterval(() => {
        gameEngine.processBotActions();
        setGameState(gameEngine.getState());
      }, 2000);

      return () => clearInterval(interval);
    }
  }, [gameEngine]);

  const handleCharactersSelected = (players: Player[]) => {
    const engine = new MusGameEngine(players);
    engine.dealNewRound();
    setGameEngine(engine);
    setGameState(engine.getState());
    setShowCharacterSelection(false);
  };

  const handleMusDecision = (decision: 'mus' | 'no mus') => {
    if (!gameEngine) return;
    
    // Procesar decisión del usuario
    if (decision === 'no mus') {
      gameEngine.processMusPhase();
      setGameState(gameEngine.getState());
    }
  };

  const handleBet = (bet: 'paso' | 'envido' | 'ordago' | 'quiero' | 'no quiero') => {
    if (!gameEngine || !gameState) return;
    
    // Procesar apuesta del usuario
    const state = gameEngine.getState();
    state.bets[userPlayer.name] = bet;
    
    if (bet === 'ordago') {
      state.currentBet = 30;
    } else if (bet === 'envido') {
      state.currentBet += 2;
    }
    
    setGameState(state);
  };

  const handleCardSelection = (selectedIndices: number[]) => {
    if (!gameEngine || !gameState) return;
    
    gameEngine.discardCards('user', selectedIndices);
    setGameState(gameEngine.getState());
  };

  if (showCharacterSelection) {
    return (
      <CharacterSelection
        onCharactersSelected={handleCharactersSelected}
        userPlayer={userPlayer}
      />
    );
  }

  if (!gameState) return null;

  const currentPlayer = gameState.players.find(p => p.id === gameState.currentPlayer);
  const userGamePlayer = gameState.players.find(p => !p.isBot);

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-800 via-green-700 to-green-900 relative overflow-hidden">
      {/* Game Table Background */}
      <div className="absolute inset-0 bg-gradient-radial from-green-600/20 to-transparent"></div>
      
      {/* Header */}
      <div className="relative z-10 flex justify-between items-center p-4 bg-black/20 backdrop-blur-sm">
        <div className="flex items-center gap-4">
          <h1 className="text-2xl font-bold text-white">🃏 El Mus</h1>
          <Badge variant="secondary" className="bg-white/20 text-white">
            Ronda {gameState.currentRound} - {gameState.phase.toUpperCase()}
          </Badge>
          {gameState.subPhase && (
            <Badge variant="outline" className="bg-white/10 text-white border-white/30">
              {gameState.subPhase === 'mus-decision' ? 'Decisión Mus' :
               gameState.subPhase === 'discarding' ? 'Descartes' :
               gameState.subPhase === 'betting' ? 'Apuestas' :
               gameState.subPhase === 'revealing' ? 'Revelando' : 'Puntuando'}
            </Badge>
          )}
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
                pot={gameState.currentBet}
              />
            </div>

            {/* Players positioned around the table */}
            {gameState.players.map((player) => (
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
                  <div className="text-lg font-semibold">
                    {gameState.phase === 'mus' ? 'Fase de Mus' : 
                     `${gameState.phase.charAt(0).toUpperCase() + gameState.phase.slice(1)}`}
                  </div>
                  <div className="text-sm opacity-75">
                    Apuesta: {gameState.currentBet} piedras
                  </div>
                  {gameState.musCount > 0 && (
                    <div className="text-xs opacity-60">
                      Mus #{gameState.musCount}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* User's Hand */}
            {userGamePlayer && (
              <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2">
                <CardHand 
                  hand={userGamePlayer.hand}
                  onCardSelection={handleCardSelection}
                  gamePhase={gameState.subPhase}
                />
              </div>
            )}

            {/* Game Actions */}
            <div className="absolute bottom-20 left-1/2 transform -translate-x-1/2">
              <div className="flex gap-3">
                {gameState.subPhase === 'mus-decision' && (
                  <>
                    <Button 
                      className="bg-blue-600 hover:bg-blue-700"
                      onClick={() => handleMusDecision('mus')}
                    >
                      Mus
                    </Button>
                    <Button 
                      className="bg-red-600 hover:bg-red-700"
                      onClick={() => handleMusDecision('no mus')}
                    >
                      No Mus
                    </Button>
                  </>
                )}
                
                {gameState.subPhase === 'betting' && (
                  <>
                    <Button 
                      className="bg-gray-600 hover:bg-gray-700"
                      onClick={() => handleBet('paso')}
                    >
                      Paso
                    </Button>
                    <Button 
                      className="bg-yellow-600 hover:bg-yellow-700"
                      onClick={() => handleBet('envido')}
                    >
                      Envido
                    </Button>
                    <Button 
                      className="bg-purple-600 hover:bg-purple-700"
                      onClick={() => handleBet('ordago')}
                    >
                      Órdago
                    </Button>
                    {gameState.currentBet > 0 && (
                      <>
                        <Button 
                          className="bg-green-600 hover:bg-green-700"
                          onClick={() => handleBet('quiero')}
                        >
                          Quiero
                        </Button>
                        <Button 
                          className="bg-red-600 hover:bg-red-700"
                          onClick={() => handleBet('no quiero')}
                        >
                          No Quiero
                        </Button>
                      </>
                    )}
                  </>
                )}
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

      {/* Game Over Modal */}
      {gameState.phase === 'finished' && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="bg-white p-8 text-center">
            <h2 className="text-3xl font-bold mb-4">
              {gameState.teamAScore >= 30 ? '¡Equipo A Gana!' : '¡Equipo B Gana!'}
            </h2>
            <div className="text-xl mb-4">
              Puntuación Final: {gameState.teamAScore} - {gameState.teamBScore}
            </div>
            <Button
              onClick={() => setShowCharacterSelection(true)}
              className="bg-green-600 hover:bg-green-700"
            >
              Nueva Partida
            </Button>
          </Card>
        </div>
      )}
    </div>
  );
};

export default GameTable;

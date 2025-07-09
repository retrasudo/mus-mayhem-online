import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MessageCircle, Settings, Volume2, Crown, Eye } from 'lucide-react';
import { PlayerCard } from './PlayerCard';
import { GameChat } from './GameChat';
import { CardHand } from './CardHand';
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
    if (gameEngine && gameState) {
      const interval = setInterval(() => {
        const currentPlayer = gameState.players.find(p => p.id === gameState.currentPlayer);
        if (currentPlayer?.isBot) {
          console.log(`Procesando turno de bot: ${currentPlayer.name}`);
          gameEngine.processBotActions();
          setGameState({ ...gameEngine.getState() });
        }
      }, 2000);

      return () => clearInterval(interval);
    }
  }, [gameEngine, gameState?.currentPlayer]);

  const handleCharactersSelected = (players: Player[]) => {
    console.log('Iniciando juego con jugadores:', players.map(p => p.name));
    const engine = new MusGameEngine(players);
    engine.dealNewRound();
    setGameEngine(engine);
    setGameState(engine.getState());
    setShowCharacterSelection(false);
  };

  const handleMusDecision = (decision: 'mus' | 'no mus') => {
    if (!gameEngine || !gameState) return;
    
    console.log(`Jugador decide: ${decision}`);
    if (decision === 'no mus') {
      gameEngine.processMusPhase();
      setGameState({ ...gameEngine.getState() });
    } else {
      gameEngine.nextPlayer();
      setGameState({ ...gameEngine.getState() });
    }
  };

  const handleBet = (bet: 'paso' | 'envido' | 'ordago' | 'quiero' | 'no quiero') => {
    if (!gameEngine || !gameState) return;
    
    console.log(`Jugador apuesta: ${bet}`);
    const state = gameEngine.getState();
    const userGamePlayer = state.players.find(p => !p.isBot);
    if (userGamePlayer) {
      state.bets[userGamePlayer.id] = bet;
      
      if (bet === 'ordago') {
        state.currentBet = 40;
      } else if (bet === 'envido') {
        state.currentBet += 2;
      }
      
      gameEngine.nextPlayer();
      setGameState({ ...state });
    }
  };

  const handleSendSignal = (signal: 'buenas' | 'malas' | 'regulares') => {
    if (!gameEngine || !gameState) return;
    
    const userGamePlayer = gameState.players.find(p => !p.isBot);
    if (userGamePlayer) {
      gameEngine.sendCompanionSignal(userGamePlayer.id, signal);
      setGameState({ ...gameEngine.getState() });
    }
  };

  const handleCardSelection = (selectedIndices: number[]) => {
    if (!gameEngine || !gameState) return;
    
    const userGamePlayer = gameState.players.find(p => !p.isBot);
    if (userGamePlayer) {
      console.log(`Jugador descarta cartas en índices: ${selectedIndices}`);
      gameEngine.discardCards(userGamePlayer.id, selectedIndices);
      setGameState({ ...gameEngine.getState() });
    }
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
  const isUserTurn = currentPlayer && !currentPlayer.isBot;
  const companionPlayer = gameState.players.find(p => !p.isBot && p.team === userGamePlayer?.team && p.id !== userGamePlayer?.id);

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-800 via-green-700 to-green-900 relative overflow-hidden">
      {/* Game Table Background */}
      <div className="absolute inset-0 bg-green-600/20 rounded-full blur-3xl"></div>
      
      {/* Header */}
      <div className="relative z-30 flex justify-between items-center p-4 bg-black/30 backdrop-blur-sm border-b border-white/10">
        <div className="flex items-center gap-4">
          <h1 className="text-2xl font-bold text-white">🃏 El Mus</h1>
          <Badge variant="secondary" className="bg-white/20 text-white border-white/30">
            Ronda {gameState.currentRound} - {gameState.phase.toUpperCase()}
          </Badge>
          {currentPlayer && (
            <Badge className="bg-yellow-500 text-black border-yellow-400">
              <Crown className="w-3 h-3 mr-1" />
              Turno: {currentPlayer.name}
              {currentPlayer.isMano && " (Mano)"}
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
        </div>
      </div>

      {/* Main Game Area */}
      <div className="relative z-10 flex h-[calc(100vh-80px)]">
        {/* Game Table */}
        <div className="flex-1 relative">
          {/* Simple Score Board - Top left */}
          <div className="absolute top-6 left-6 z-20">
            <Card className="bg-white/95 backdrop-blur-sm p-4 shadow-lg">
              <div className="text-center">
                <div className="text-lg font-bold mb-2">Puntuación</div>
                <div className="flex justify-between items-center gap-6">
                  <div className="text-center">
                    <div className="w-4 h-4 bg-blue-500 rounded-full mx-auto mb-1"></div>
                    <div className="text-2xl font-bold text-blue-600">{gameState.teamAScore}</div>
                    <div className="text-xs">Equipo A</div>
                  </div>
                  <div className="text-center">
                    <div className="w-4 h-4 bg-red-500 rounded-full mx-auto mb-1"></div>
                    <div className="text-2xl font-bold text-red-600">{gameState.teamBScore}</div>
                    <div className="text-xs">Equipo B</div>
                  </div>
                </div>
              </div>
            </Card>
          </div>

          {/* Dialogues - Top right */}
          {gameState.dialogues.length > 0 && (
            <div className="absolute top-6 right-6 z-20 max-w-xs">
              <Card className="bg-black/80 backdrop-blur-sm p-3 text-white">
                <div className="text-sm font-semibold mb-2">Diálogos</div>
                <div className="space-y-1 max-h-32 overflow-y-auto">
                  {gameState.dialogues.slice(-3).map((dialogue, index) => {
                    const player = gameState.players.find(p => p.id === dialogue.playerId);
                    return (
                      <div key={index} className="text-xs">
                        <span className="font-semibold">{player?.name}:</span>
                        <span className="ml-1">{dialogue.message}</span>
                      </div>
                    );
                  })}
                </div>
              </Card>
            </div>
          )}

          {/* Players positioned around the table */}
          <div className="absolute inset-0 p-8">
            {gameState.players.map((player) => (
              <PlayerCard
                key={player.id}
                player={player}
                isCurrentPlayer={player.id === gameState.currentPlayer}
                isUserPlayer={!player.isBot}
              />
            ))}
          </div>

          {/* Center Table Area */}
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-10">
            <div className="w-64 h-40 bg-green-600/40 rounded-xl border-4 border-yellow-400/60 flex items-center justify-center backdrop-blur-sm">
              <div className="text-center text-white">
                <div className="text-xl font-semibold mb-2">
                  {gameState.phase === 'mus' ? 'Fase de Mus' : 
                   `${gameState.phase.charAt(0).toUpperCase() + gameState.phase.slice(1)}`}
                </div>
                {gameState.currentBet > 0 && (
                  <div className="text-sm opacity-75 mb-2">
                    Apuesta: {gameState.currentBet} puntos
                  </div>
                )}
                {gameState.companionSignal && (
                  <div className="text-xs bg-blue-500/30 rounded px-2 py-1 mb-2">
                    <Eye className="w-3 h-3 inline mr-1" />
                    Tu compañero indica: {gameState.companionSignal}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* User's Hand - Fixed at bottom */}
          {userGamePlayer && (
            <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 z-20">
              <CardHand 
                hand={userGamePlayer.hand}
                gamePhase={gameState.subPhase}
              />
            </div>
          )}

          {/* Game Actions - Above user's hand */}
          {isUserTurn && (
            <div className="absolute bottom-32 left-1/2 transform -translate-x-1/2 z-20">
              <div className="flex gap-2 bg-black/70 backdrop-blur-sm rounded-lg p-3">
                {gameState.subPhase === 'mus-decision' && (
                  <>
                    <Button 
                      className="bg-blue-600 hover:bg-blue-700 text-white"
                      onClick={() => handleMusDecision('mus')}
                    >
                      Mus
                    </Button>
                    <Button 
                      className="bg-red-600 hover:bg-red-700 text-white"
                      onClick={() => handleMusDecision('no mus')}
                    >
                      No Mus
                    </Button>
                  </>
                )}
                
                {gameState.subPhase === 'betting' && (
                  <>
                    <Button 
                      className="bg-gray-600 hover:bg-gray-700 text-white text-xs px-2"
                      onClick={() => handleBet('paso')}
                    >
                      Paso
                    </Button>
                    <Button 
                      className="bg-yellow-600 hover:bg-yellow-700 text-white text-xs px-2"
                      onClick={() => handleBet('envido')}
                    >
                      Envido
                    </Button>
                    <Button 
                      className="bg-purple-600 hover:bg-purple-700 text-white text-xs px-2"
                      onClick={() => handleBet('ordago')}
                    >
                      Órdago
                    </Button>
                    {gameState.currentBet > 0 && (
                      <>
                        <Button 
                          className="bg-green-600 hover:bg-green-700 text-white text-xs px-2"
                          onClick={() => handleBet('quiero')}
                        >
                          Quiero
                        </Button>
                        <Button 
                          className="bg-red-600 hover:bg-red-700 text-white text-xs px-2"
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
          )}

          {/* Signals Panel - Left side */}
          {gameState.senasEnabled && !isUserTurn && userGamePlayer && (
            <div className="absolute left-6 bottom-6 z-20">
              <Card className="bg-black/70 backdrop-blur-sm p-3 text-white">
                <div className="text-sm font-semibold mb-2">Señas a tu compañero</div>
                <div className="flex flex-col gap-2">
                  <Button 
                    size="sm"
                    className="bg-green-600 hover:bg-green-700 text-xs"
                    onClick={() => handleSendSignal('buenas')}
                  >
                    Tengo buenas
                  </Button>
                  <Button 
                    size="sm"
                    className="bg-yellow-600 hover:bg-yellow-700 text-xs"
                    onClick={() => handleSendSignal('regulares')}
                  >
                    Regulares
                  </Button>
                  <Button 
                    size="sm"
                    className="bg-red-600 hover:bg-red-700 text-xs"
                    onClick={() => handleSendSignal('malas')}
                  >
                    Tengo malas
                  </Button>
                </div>
              </Card>
            </div>
          )}
        </div>

        {/* Chat Panel */}
        {showChat && (
          <div className="w-80 bg-black/30 backdrop-blur-sm border-l border-white/20 z-30">
            <GameChat />
          </div>
        )}
      </div>

      {/* Game Over Modal */}
      {gameState.phase === 'finished' && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="bg-white p-8 text-center max-w-md">
            <h2 className="text-3xl font-bold mb-4">
              {gameState.teamAScore >= 40 ? '¡Equipo A Gana!' : '¡Equipo B Gana!'}
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

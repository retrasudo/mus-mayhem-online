
import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MessageCircle, Crown, Eye } from 'lucide-react';
import { PlayerCard } from './PlayerCard';
import { GameChat } from './GameChat';
import { CardHand } from './CardHand';
import { CharacterSelection } from './CharacterSelection';
import { DialogueBubble } from './DialogueBubble';
import { MusGameEngine } from '@/utils/gameLogic';
import { GameState, Player, BetAction } from '@/types/game';

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
          gameEngine.processBotActions();
          setGameState({ ...gameEngine.getState() });
        }
      }, 1000);

      return () => clearInterval(interval);
    }
  }, [gameEngine, gameState?.currentPlayer, gameState?.subPhase]);

  const handleCharactersSelected = (players: Player[]) => {
    console.log('Iniciando juego con jugadores:', players.map(p => p.name));
    const engine = new MusGameEngine(players);
    engine.dealNewRound();
    setGameEngine(engine);
    setGameState(engine.getState());
    setShowCharacterSelection(false);
  };

  const handleMusDecision = (decision: 'mus' | 'no-mus') => {
    if (!gameEngine || !gameState) return;
    
    const userGamePlayer = gameState.players.find(p => !p.isBot);
    if (userGamePlayer) {
      gameEngine.processMusDecision(userGamePlayer.id, decision);
      setGameState({ ...gameEngine.getState() });
    }
  };

  const handleBet = (betType: string) => {
    if (!gameEngine || !gameState) return;
    
    const userGamePlayer = gameState.players.find(p => !p.isBot);
    if (!userGamePlayer) return;

    let bet: BetAction;
    
    switch (betType) {
      case 'paso':
        bet = { type: 'paso', playerId: userGamePlayer.id };
        break;
      case 'envido':
        bet = { type: 'envido', playerId: userGamePlayer.id, amount: 2 };
        break;
      case 'echo-mas':
        bet = { type: 'echo-mas', playerId: userGamePlayer.id };
        break;
      case 'ordago':
        bet = { type: 'ordago', playerId: userGamePlayer.id };
        break;
      case 'quiero':
        bet = { type: 'quiero', playerId: userGamePlayer.id };
        break;
      case 'no-quiero':
        bet = { type: 'no-quiero', playerId: userGamePlayer.id };
        break;
      default:
        return;
    }
    
    gameEngine.placeBet(userGamePlayer.id, bet);
    setGameState({ ...gameEngine.getState() });
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

  const getPhaseDisplayName = (phase: string) => {
    const names = {
      'mus': 'Mus',
      'grande': 'Grande',
      'chica': 'Chica',
      'pares': 'Pares',
      'juego': 'Juego',
      'punto': 'Punto',
      'scoring': 'Puntuación',
      'finished': 'Finalizado'
    };
    return names[phase as keyof typeof names] || phase;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-800 via-green-700 to-green-900 relative overflow-hidden">
      {/* Game Table Background */}
      <div className="absolute inset-0 bg-green-600/20 rounded-full blur-3xl"></div>
      
      {/* Header */}
      <div className="relative z-30 flex justify-between items-center p-4 bg-black/30 backdrop-blur-sm border-b border-white/10">
        <div className="flex items-center gap-4">
          <h1 className="text-2xl font-bold text-white">🃏 El Mus</h1>
          <Badge variant="secondary" className="bg-white/20 text-white border-white/30">
            Ronda {gameState.currentRound} - {getPhaseDisplayName(gameState.phase)}
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
          {/* Score Board - Top left */}
          <div className="absolute top-6 left-6 z-20">
            <Card className="bg-white/95 backdrop-blur-sm p-4 shadow-lg">
              <div className="text-center">
                <div className="text-lg font-bold mb-2">Puntuación</div>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="text-center">
                    <div className="w-4 h-4 bg-blue-500 rounded-full mx-auto mb-1"></div>
                    <div className="font-bold">Equipo A</div>
                    <div className="text-xs">{gameState.teamAAmarracos} amarracos</div>
                    <div className="text-xs">{gameState.teamAScore} piedras</div>
                  </div>
                  <div className="text-center">
                    <div className="w-4 h-4 bg-red-500 rounded-full mx-auto mb-1"></div>
                    <div className="font-bold">Equipo B</div>
                    <div className="text-xs">{gameState.teamBAmarracos} amarracos</div>
                    <div className="text-xs">{gameState.teamBScore} piedras</div>
                  </div>
                </div>
                {gameState.adentro && (
                  <div className="mt-2 text-red-600 font-bold text-sm">
                    ¡ADENTRO!
                  </div>
                )}
              </div>
            </Card>
          </div>

          {/* Game Info - Top right */}
          <div className="absolute top-6 right-6 z-20">
            <Card className="bg-black/80 backdrop-blur-sm p-3 text-white">
              <div className="text-sm space-y-1">
                <div>Fase: {getPhaseDisplayName(gameState.phase)}</div>
                {gameState.currentBet > 0 && (
                  <div>Apuesta: {gameState.currentBet} piedras</div>
                )}
                {gameState.companionSignal && (
                  <div className="text-blue-400">
                    <Eye className="w-3 h-3 inline mr-1" />
                    Señas: {gameState.companionSignal}
                  </div>
                )}
              </div>
            </Card>
          </div>

          {/* Players positioned around the table */}
          <div className="absolute inset-0 p-8">
            {gameState.players.map((player) => (
              <div key={player.id} className="relative">
                <PlayerCard
                  player={player}
                  isCurrentPlayer={player.id === gameState.currentPlayer}
                  isUserPlayer={!player.isBot}
                />
                {/* Dialogue Bubbles */}
                {gameState.dialogues
                  .filter(d => d.playerId === player.id)
                  .slice(-1)
                  .map((dialogue, index) => (
                    <DialogueBubble
                      key={`${dialogue.timestamp}-${index}`}
                      dialogue={dialogue}
                      player={player}
                    />
                  ))}
              </div>
            ))}
          </div>

          {/* Center Table Area */}
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-10">
            <div className="w-64 h-40 bg-green-600/40 rounded-xl border-4 border-yellow-400/60 flex items-center justify-center backdrop-blur-sm">
              <div className="text-center text-white">
                <div className="text-xl font-semibold mb-2">
                  {getPhaseDisplayName(gameState.phase)}
                </div>
                {gameState.currentBet > 0 && (
                  <div className="text-sm opacity-75 mb-2">
                    Apuesta: {gameState.currentBet} piedras
                  </div>
                )}
                {gameState.waitingForResponse && (
                  <div className="text-xs bg-yellow-500/30 rounded px-2 py-1">
                    Esperando respuesta...
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
                onCardSelection={handleCardSelection}
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
                      onClick={() => handleMusDecision('no-mus')}
                    >
                      No Mus
                    </Button>
                  </>
                )}
                
                {gameState.subPhase === 'betting' && (
                  <>
                    {!gameState.waitingForResponse ? (
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
                      </>
                    ) : (
                      <>
                        <Button 
                          className="bg-green-600 hover:bg-green-700 text-white text-xs px-2"
                          onClick={() => handleBet('quiero')}
                        >
                          Quiero
                        </Button>
                        <Button 
                          className="bg-red-600 hover:bg-red-700 text-white text-xs px-2"
                          onClick={() => handleBet('no-quiero')}
                        >
                          No Quiero
                        </Button>
                        <Button 
                          className="bg-orange-600 hover:bg-orange-700 text-white text-xs px-2"
                          onClick={() => handleBet('echo-mas')}
                        >
                          Echo 2 Más
                        </Button>
                      </>
                    )}
                  </>
                )}
              </div>
            </div>
          )}

          {/* Signals Panel - Left side */}
          {gameState.senasEnabled && !isUserTurn && userGamePlayer && gameState.phase !== 'finished' && (
            <div className="absolute left-6 bottom-6 z-20">
              <Card className="bg-black/70 backdrop-blur-sm p-3 text-white">
                <div className="text-sm font-semibold mb-2">Señas</div>
                <div className="flex flex-col gap-2">
                  <Button 
                    size="sm"
                    className="bg-green-600 hover:bg-green-700 text-xs"
                    onClick={() => handleSendSignal('buenas')}
                  >
                    Buenas
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
                    Malas
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
              {gameState.teamAAmarracos >= 8 ? '¡Equipo A Gana!' : '¡Equipo B Gana!'}
            </h2>
            <div className="text-xl mb-4">
              Puntuación Final: {gameState.teamAAmarracos} - {gameState.teamBAmarracos} amarracos
            </div>
            <div className="text-sm mb-4">
              ({gameState.teamAScore} - {gameState.teamBScore} piedras)
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

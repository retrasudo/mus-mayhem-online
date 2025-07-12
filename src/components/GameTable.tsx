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
import { MusGameEngine, BettingSystem } from '@/utils/game';
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
        if (currentPlayer?.isBot && gameState.phase !== 'finished') {
          gameEngine.processBotActions();
          setGameState({ ...gameEngine.getState() });
        }
      }, 2000);

      return () => clearInterval(interval);
    }
  }, [gameEngine, gameState?.currentPlayer, gameState?.subPhase]);

  // Auto-resolve órdago when showingCards is true
  useEffect(() => {
    if (gameEngine && gameState?.showingCards && gameState.currentBetType === 'ordago') {
      setTimeout(() => {
        BettingSystem.resolveOrdago(gameState);
        setGameState({ ...gameEngine.getState() });
      }, 3000);
    }
  }, [gameEngine, gameState?.showingCards]);

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
    <div className="h-screen w-screen overflow-hidden bg-gradient-to-br from-emerald-900 via-green-800 to-emerald-900 relative">
      {/* Header - Compacto */}
      <div className="relative z-30 flex justify-between items-center px-3 py-2 bg-black/40 backdrop-blur-sm border-b border-white/10">
        <div className="flex items-center gap-2">
          <h1 className="text-lg font-bold text-white">🃏 El Mus</h1>
          <Badge variant="secondary" className="bg-white/20 text-white border-white/30 text-xs px-2 py-1">
            R{gameState.currentRound} - {getPhaseDisplayName(gameState.phase)}
          </Badge>
          {currentPlayer && (
            <Badge className="bg-yellow-500 text-black border-yellow-400 text-xs px-2 py-1">
              <Crown className="w-3 h-3 mr-1" />
              {currentPlayer.name}
            </Badge>
          )}
        </div>
        
        <Button
          variant="ghost"
          size="sm"
          className="text-white hover:bg-white/20 h-8 w-8 p-0"
          onClick={() => setShowChat(!showChat)}
        >
          <MessageCircle className="w-4 h-4" />
        </Button>
      </div>

      {/* Main Game Area */}
      <div className="relative flex h-[calc(100vh-48px)]">
        {/* Game Table */}
        <div className="flex-1 relative overflow-hidden">
          
          {/* Scoreboard - Esquina superior izquierda compacta */}
          <div className="absolute top-2 left-2 z-20">
            <Card className="bg-white/95 backdrop-blur-sm p-2 shadow-lg">
              <div className="text-center">
                <div className="text-xs font-bold mb-1">Puntuación</div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="text-center">
                    <div className="w-2 h-2 bg-blue-500 rounded-full mx-auto mb-0.5"></div>
                    <div className="font-bold text-xs leading-tight">Equipo A</div>
                    <div className="text-xs leading-none">{gameState.teamAVacas} vacas</div>
                    <div className="text-xs leading-none">{gameState.teamAAmarracos} amarracos</div>
                  </div>
                  <div className="text-center">
                    <div className="w-2 h-2 bg-red-500 rounded-full mx-auto mb-0.5"></div>
                    <div className="font-bold text-xs leading-tight">Equipo B</div>
                    <div className="text-xs leading-none">{gameState.teamBVacas} vacas</div>
                    <div className="text-xs leading-none">{gameState.teamBAmarracos} amarracos</div>
                  </div>
                </div>
              </div>
            </Card>
          </div>

          {/* Game Info - Esquina superior derecha compacta */}
          <div className="absolute top-2 right-2 z-20">
            <Card className="bg-black/80 backdrop-blur-sm p-2 text-white">
              <div className="text-xs space-y-0.5">
                <div>Fase: {getPhaseDisplayName(gameState.phase)}</div>
                {gameState.currentBet > 0 && (
                  <div>💰 {gameState.currentBet}</div>
                )}
                {gameState.waitingForResponse && (
                  <div className="text-yellow-400">⏳ Respuesta</div>
                )}
              </div>
            </Card>
          </div>

          {/* Players positioned around a smaller table */}
          <div className="absolute inset-4">
            {/* Bottom Player (User) */}
            <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2">
              {gameState.players
                .filter(p => p.position === 'bottom')
                .map(player => (
                  <div key={player.id} className="relative">
                    <PlayerCard
                      player={player}
                      isCurrentPlayer={player.id === gameState.currentPlayer}
                      isUserPlayer={!player.isBot}
                      compact={true}
                    />
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

            {/* Left Player */}
            <div className="absolute left-0 top-1/2 transform -translate-y-1/2">
              {gameState.players
                .filter(p => p.position === 'left')
                .map(player => (
                  <div key={player.id} className="relative">
                    <PlayerCard
                      player={player}
                      isCurrentPlayer={player.id === gameState.currentPlayer}
                      isUserPlayer={!player.isBot}
                      compact={true}
                    />
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

            {/* Top Player */}
            <div className="absolute top-0 left-1/2 transform -translate-x-1/2">
              {gameState.players
                .filter(p => p.position === 'top')
                .map(player => (
                  <div key={player.id} className="relative">
                    <PlayerCard
                      player={player}
                      isCurrentPlayer={player.id === gameState.currentPlayer}
                      isUserPlayer={!player.isBot}
                      compact={true}
                    />
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

            {/* Right Player */}
            <div className="absolute right-0 top-1/2 transform -translate-y-1/2">
              {gameState.players
                .filter(p => p.position === 'right')
                .map(player => (
                  <div key={player.id} className="relative">
                    <PlayerCard
                      player={player}
                      isCurrentPlayer={player.id === gameState.currentPlayer}
                      isUserPlayer={!player.isBot}
                      compact={true}
                    />
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
          </div>

          {/* Center Table Area - Más pequeño */}
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-10">
            <div className="w-48 h-32 bg-gradient-to-br from-green-600/50 via-green-500/40 to-green-700/50 rounded-lg border-2 border-yellow-400/70 flex items-center justify-center backdrop-blur-sm shadow-xl">
              <div className="text-center text-white p-2">
                <div className="text-lg font-bold mb-1 text-yellow-100">
                  🃏 {getPhaseDisplayName(gameState.phase)}
                </div>
                {gameState.currentBet > 0 && (
                  <div className="text-sm font-semibold text-yellow-200">
                    💰 {gameState.currentBet} piedras
                  </div>
                )}
                {gameState.waitingForResponse && (
                  <div className="text-xs bg-yellow-500/40 rounded-full px-2 py-1 border border-yellow-300/50 mt-1">
                    ⏳ Esperando respuesta...
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* User's Hand - Más compacto */}
          {userGamePlayer && (
            <div className="absolute bottom-16 left-1/2 transform -translate-x-1/2 z-20">
              <CardHand 
                hand={userGamePlayer.hand}
                gamePhase={gameState.subPhase}
                onCardSelection={handleCardSelection}
                showCards={gameState.showingCards}
              />
            </div>
          )}

          {/* Game Actions - Botones más pequeños */}
          {isUserTurn && !gameState.showingCards && (
            <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 z-20">
              <div className="flex gap-1 bg-black/70 backdrop-blur-sm rounded-lg p-2">
                {gameState.subPhase === 'mus-decision' && (
                  <>
                    <Button 
                      size="sm"
                      className="bg-blue-600 hover:bg-blue-700 text-white text-xs px-3 py-1 h-8"
                      onClick={() => handleMusDecision('mus')}
                    >
                      Mus
                    </Button>
                    <Button 
                      size="sm"
                      className="bg-red-600 hover:bg-red-700 text-white text-xs px-3 py-1 h-8"
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
                          size="sm"
                          className="bg-gray-600 hover:bg-gray-700 text-white text-xs px-2 py-1 h-8"
                          onClick={() => handleBet('paso')}
                        >
                          Paso
                        </Button>
                        <Button 
                          size="sm"
                          className="bg-yellow-600 hover:bg-yellow-700 text-white text-xs px-2 py-1 h-8"
                          onClick={() => handleBet('envido')}
                        >
                          Envido
                        </Button>
                        <Button 
                          size="sm"
                          className="bg-purple-600 hover:bg-purple-700 text-white text-xs px-2 py-1 h-8"
                          onClick={() => handleBet('ordago')}
                        >
                          Órdago
                        </Button>
                      </>
                    ) : (
                      <>
                        <Button 
                          size="sm"
                          className="bg-green-600 hover:bg-green-700 text-white text-xs px-2 py-1 h-8"
                          onClick={() => handleBet('quiero')}
                        >
                          Quiero
                        </Button>
                        <Button 
                          size="sm"
                          className="bg-red-600 hover:bg-red-700 text-white text-xs px-2 py-1 h-8"
                          onClick={() => handleBet('no-quiero')}
                        >
                          No Quiero
                        </Button>
                        <Button 
                          size="sm"
                          className="bg-orange-600 hover:bg-orange-700 text-white text-xs px-2 py-1 h-8"
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

          {/* Showing Cards Message */}
          {gameState.showingCards && (
            <div className="absolute top-1/3 left-1/2 transform -translate-x-1/2 z-30">
              <Card className="bg-yellow-500/90 backdrop-blur-sm p-4 text-center">
                <div className="text-lg font-bold text-black">
                  📋 Mostrando cartas...
                </div>
                <div className="text-sm text-black/80 mt-1">
                  Determinando ganador del órdago
                </div>
              </Card>
            </div>
          )}

          {/* Signals Panel - Más compacto */}
          {gameState.senasEnabled && !isUserTurn && userGamePlayer && gameState.phase !== 'finished' && (
            <div className="absolute left-2 bottom-2 z-20">
              <Card className="bg-black/70 backdrop-blur-sm p-2 text-white">
                <div className="text-xs font-semibold mb-1">Señas</div>
                <div className="flex flex-col gap-1">
                  <Button 
                    size="sm"
                    className="bg-green-600 hover:bg-green-700 text-xs h-7"
                    onClick={() => handleSendSignal('buenas')}
                  >
                    Buenas
                  </Button>
                  <Button 
                    size="sm"
                    className="bg-yellow-600 hover:bg-yellow-700 text-xs h-7"
                    onClick={() => handleSendSignal('regulares')}
                  >
                    Regulares
                  </Button>
                  <Button 
                    size="sm"
                    className="bg-red-600 hover:bg-red-700 text-xs h-7"
                    onClick={() => handleSendSignal('malas')}
                  >
                    Malas
                  </Button>
                </div>
              </Card>
            </div>
          )}
        </div>

        {/* Chat Panel - Más estrecho */}
        {showChat && (
          <div className="w-64 bg-black/30 backdrop-blur-sm border-l border-white/20 z-30">
            <GameChat />
          </div>
        )}
      </div>

      {/* Game Over Modal */}
      {gameState.phase === 'finished' && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="bg-white p-6 text-center max-w-md mx-4">
            {gameState.gameEnded ? (
              <>
                <h2 className="text-2xl font-bold mb-3">
                  🏆 {gameState.teamAVacas >= 3 ? '¡Equipo A Gana el Torneo!' : '¡Equipo B Gana el Torneo!'}
                </h2>
                <div className="text-lg mb-3">
                  Vacas: {gameState.teamAVacas} - {gameState.teamBVacas}
                </div>
                <div className="flex gap-3 justify-center">
                  <Button
                    onClick={() => setShowCharacterSelection(true)}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    Menú Principal
                  </Button>
                  <Button
                    onClick={() => {
                      if (gameEngine) {
                        gameEngine.resetTournament();
                        setGameState({ ...gameEngine.getState() });
                      }
                    }}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    Nuevo Torneo
                  </Button>
                </div>
              </>
            ) : (
              <>
                <h2 className="text-xl font-bold mb-3">
                  🎯 {gameState.teamAAmarracos >= 8 ? '¡Equipo A Gana!' : '¡Equipo B Gana!'}
                </h2>
                <div className="text-sm mb-3">
                  Amarracos: {gameState.teamAAmarracos} - {gameState.teamBAmarracos}
                </div>
                <div className="text-sm mb-3">
                  Vacas: {gameState.teamAVacas} - {gameState.teamBVacas}
                </div>
                <div className="flex gap-3 justify-center">
                  <Button
                    onClick={() => setShowCharacterSelection(true)}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    Menú Principal
                  </Button>
                  <Button
                    onClick={() => {
                      if (gameEngine) {
                        // Añadir una vaca al equipo ganador antes de resetear
                        if (gameState.teamAAmarracos >= 8) {
                          gameEngine.getState().teamAVacas++;
                        } else if (gameState.teamBAmarracos >= 8) {
                          gameEngine.getState().teamBVacas++;
                        }
                        
                        // Verificar si el torneo ha terminado
                        if (gameEngine.getState().teamAVacas >= 3 || gameEngine.getState().teamBVacas >= 3) {
                          gameEngine.getState().gameEnded = true;
                        } else {
                          gameEngine.resetToNewGame();
                        }
                        setGameState({ ...gameEngine.getState() });
                      }
                    }}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    Nueva Partida
                  </Button>
                </div>
              </>
            )}
          </Card>
        </div>
      )}
    </div>
  );
};

export default GameTable;
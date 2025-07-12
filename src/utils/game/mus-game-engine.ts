import { GameState, Player, GameDialogue, BetAction } from '@/types/game';
import { createDeck, dealCards } from '../cards';
import { MusBot } from '../bots';
import { CardEvaluator } from './card-evaluation';
import { ScoringSystem } from './scoring-logic';
import { BettingSystem } from './betting-system';
import { PhaseManager } from './phase-manager';

export class MusGameEngine {
  private state: GameState;

  constructor(players: Player[]) {
    // Marcar al primer jugador como mano
    players[0].isMano = true;
    
    this.state = {
      phase: 'mus',
      subPhase: 'dealing',
      currentPlayer: players[0].id,
      currentRound: 1,
      currentBet: 0,
      currentBetType: null,
      betHistory: [],
      teamAScore: 0,
      teamBScore: 0,
      teamAAmarracos: 0,
      teamBAmarracos: 0,
      teamAVacas: 0,
      teamBVacas: 0,
      players,
      deck: createDeck(),
      musCount: 0,
      playersWantingMus: [],
      bets: {},
      roundResults: [],
      dialogues: [],
      senasEnabled: true,
      waitingForResponse: false,
      adentro: false,
      showingCards: false,
      gameEnded: false
    };
  }

  getState(): GameState {
    return { ...this.state };
  }

  addDialogue(playerId: string, message: string, action: string): void {
    const player = this.state.players.find(p => p.id === playerId);
    if (!player) return;

    const dialogue: GameDialogue = {
      playerId,
      playerName: player.name,
      message,
      action,
      timestamp: Date.now()
    };
    
    this.state.dialogues.push(dialogue);
    
    // Mantener solo los últimos 5 diálogos
    if (this.state.dialogues.length > 5) {
      this.state.dialogues = this.state.dialogues.slice(-5);
    }
  }

  dealNewRound(): void {
    this.state.deck = createDeck();
    const { hands } = dealCards(this.state.deck, 4);
    
    this.state.players.forEach((player, index) => {
      player.hand = hands[index];
      player.hasPares = CardEvaluator.checkPares(player.hand);
      player.hasJuego = CardEvaluator.checkJuego(player.hand);
      player.punto = CardEvaluator.calculatePunto(player.hand);
    });
    
    this.state.phase = 'mus';
    this.state.subPhase = 'mus-decision';
    this.state.musCount = 0;
    this.state.playersWantingMus = [];
    this.state.bets = {};
    this.state.betHistory = [];
    this.state.currentBet = 0;
    this.state.currentBetType = null;
    this.state.waitingForResponse = false;
    this.state.lastBetPlayer = undefined;
    this.state.phaseWinner = undefined;
    
    PhaseManager.resetCurrentPlayer(this.state);
    console.log('Nueva ronda iniciada. Manos repartidas.');
  }

  processMusDecision(playerId: string, decision: 'mus' | 'no-mus'): void {
    const player = this.state.players.find(p => p.id === playerId);
    if (!player) return;

    if (decision === 'mus') {
      this.state.playersWantingMus.push(playerId);
      this.addDialogue(playerId, 'Mus', 'mus');
    } else {
      this.addDialogue(playerId, 'No hay mus', 'no-mus');
      // Si alguien dice "no hay mus", se corta el mus
      PhaseManager.startBettingPhase(this.state);
      return;
    }

    // Avanzar al siguiente jugador
    PhaseManager.nextPlayer(this.state);

    // Si todos han decidido y todos quieren mus, ir al descarte
    if (this.state.playersWantingMus.length === 4) {
      this.state.subPhase = 'discarding';
      PhaseManager.resetCurrentPlayer(this.state);
      this.addDialogue('system', 'Todos quieren mus. Fase de descarte', 'system');
    }
  }

  discardCards(playerId: string, cardIndices: number[]): void {
    const player = this.state.players.find(p => p.id === playerId);
    if (!player) return;

    if (cardIndices.length === 0) {
      // El jugador no descarta nada
      this.addDialogue(playerId, 'No descarto', 'no-discard');
    } else {
      // Remover cartas seleccionadas
      const newHand = player.hand.filter((_, index) => !cardIndices.includes(index));
      
      // Dar nuevas cartas del mazo
      while (newHand.length < 4 && this.state.deck.length > 0) {
        newHand.push(this.state.deck.pop()!);
      }
      
      player.hand = newHand;
      player.hasPares = CardEvaluator.checkPares(player.hand);
      player.hasJuego = CardEvaluator.checkJuego(player.hand);
      player.punto = CardEvaluator.calculatePunto(player.hand);
      
      this.addDialogue(playerId, `Descarto ${cardIndices.length} carta${cardIndices.length !== 1 ? 's' : ''}`, 'discard');
    }

    PhaseManager.nextPlayer(this.state);

    // Verificar si todos han descartado
    const currentPlayerIndex = this.state.players.findIndex(p => p.id === this.state.currentPlayer);
    const manoIndex = this.state.players.findIndex(p => p.isMano);
    
    if (currentPlayerIndex === manoIndex) {
      // Todos han descartado, volver a la decisión de mus
      this.state.subPhase = 'mus-decision';
      this.state.playersWantingMus = [];
      this.state.musCount++;
      this.addDialogue('system', 'Nueva ronda de mus', 'system');
    }
  }

  placeBet(playerId: string, bet: BetAction): void {
    const player = this.state.players.find(p => p.id === playerId);
    if (!player) return;

    BettingSystem.placeBet(this.state, playerId, bet);

    // Handle specific actions after betting
    switch (bet.type) {
      case 'paso':
        this.addDialogue(playerId, 'Paso', 'bet');
        break;
      case 'envido':
        const amount = bet.amount || 2;
        this.addDialogue(playerId, `Envido ${amount}`, 'bet');
        break;
      case 'echo-mas':
        this.addDialogue(playerId, 'Echo 2 más', 'bet');
        break;
      case 'ordago':
        this.addDialogue(playerId, '¡Órdago!', 'bet');
        break;
      case 'quiero':
        this.addDialogue(playerId, 'Quiero', 'bet');
        this.handleQuiero();
        break;
      case 'no-quiero':
        this.addDialogue(playerId, 'No quiero', 'bet');
        this.handleNoQuiero();
        break;
    }
  }

  private handleQuiero(): void {
    if (this.state.currentBetType === 'ordago') {
      // Órdago aceptado - mostrar cartas y resolver
      this.resolveOrdago();
    } else {
      // Envido aceptado - continuar a la siguiente fase
      PhaseManager.nextPhase(this.state);
    }
  }

  private handleNoQuiero(): void {
    if (this.state.currentBetType === 'ordago') {
      // Órdago no aceptado - el que apostó gana 1 piedra y continuar
      const betPlayer = this.state.players.find(p => p.id === this.state.lastBetPlayer);
      if (betPlayer) {
        ScoringSystem.addPoints(this.state, betPlayer.team, 1, 'deje por órdago');
        this.addDialogue('system', `Equipo ${betPlayer.team} gana 1 piedra por deje`, 'scoring');
      }
      // Reset betting state and continue to next phase
      this.state.currentBet = 0;
      this.state.currentBetType = null;
      this.state.waitingForResponse = false;
      PhaseManager.nextPhase(this.state);
    } else {
      // Envido no aceptado
      const betPlayer = this.state.players.find(p => p.id === this.state.lastBetPlayer);
      if (betPlayer) {
        ScoringSystem.addPoints(this.state, betPlayer.team, 1, 'deje');
        this.addDialogue('system', `Equipo ${betPlayer.team} gana 1 piedra por deje`, 'scoring');
      }
      PhaseManager.nextPhase(this.state);
    }
  }

  private resolveOrdago(): void {
    // Mostrar todas las cartas primero
    this.state.showingCards = true;
    this.addDialogue('system', '¡Órdago aceptado! Mostrando cartas...', 'system');
    
    // Mostrar las cartas de todos los jugadores
    this.state.players.forEach(player => {
      const cardsText = player.hand.map(c => `${c.name}`).join(', ');
      this.addDialogue(player.id, `Mis cartas: ${cardsText}`, 'reveal-cards');
    });
    
    const winner = ScoringSystem.determinePhaseWinner(this.state);
    if (winner) {
      // El ganador del órdago gana toda la partida
      if (winner === 'A') {
        this.state.teamAAmarracos = 8;
        this.state.teamAVacas++;
      } else {
        this.state.teamBAmarracos = 8;
        this.state.teamBVacas++;
      }
      
      this.addDialogue('system', `¡Equipo ${winner} gana la partida por órdago!`, 'game-end');
      
      // Verificar si algún equipo ha ganado 3 vacas
      if (this.state.teamAVacas >= 3 || this.state.teamBVacas >= 3) {
        this.state.gameEnded = true;
        const tournamentWinner = this.state.teamAVacas >= 3 ? 'A' : 'B';
        this.addDialogue('system', `¡Equipo ${tournamentWinner} gana el torneo ${this.state.teamAVacas}-${this.state.teamBVacas}!`, 'tournament-end');
      }
      
      // Inmediatamente finalizar la partida
      this.state.phase = 'finished';
    }
  }

  nextPhase(): void {
    PhaseManager.nextPhase(this.state);
    
    // Add announcements for special phases
    if (this.state.phase === 'pares') {
      this.announcePlayersWithPares();
    } else if (this.state.phase === 'juego') {
      this.announcePlayersWithJuego();
    }
    
    // Check if game should finish
    if (this.state.phase === 'scoring') {
      this.finishHand();
    }
  }

  private announcePlayersWithPares(): void {
    this.state.players.forEach(player => {
      if (player.hasPares) {
        this.addDialogue(player.id, 'Pares', 'announce-pares');
      } else {
        this.addDialogue(player.id, 'No pares', 'announce-no-pares');
      }
    });
  }

  private announcePlayersWithJuego(): void {
    this.state.players.forEach(player => {
      if (player.hasJuego) {
        this.addDialogue(player.id, 'Juego', 'announce-juego');
      } else {
        this.addDialogue(player.id, 'No juego', 'announce-no-juego');
      }
    });
  }

  private finishHand(): void {
    PhaseManager.finishHand(this.state);
    
    // Verificar si algún equipo ha ganado
    const gameEnded = ScoringSystem.checkGameEnd(this.state);
    if (gameEnded) {
      if (this.state.teamAAmarracos >= 8) {
        this.state.teamAVacas++;
        this.addDialogue('system', '¡Equipo A gana la partida!', 'game-end');
      } else if (this.state.teamBAmarracos >= 8) {
        this.state.teamBVacas++;
        this.addDialogue('system', '¡Equipo B gana la partida!', 'game-end');
      }
      
      // Verificar si algún equipo ha ganado 3 vacas
      if (this.state.teamAVacas >= 3 || this.state.teamBVacas >= 3) {
        this.state.gameEnded = true;
        const tournamentWinner = this.state.teamAVacas >= 3 ? 'A' : 'B';
        this.addDialogue('system', `¡Equipo ${tournamentWinner} gana el torneo ${this.state.teamAVacas}-${this.state.teamBVacas}!`, 'tournament-end');
      }
    }
    
    // Preparar siguiente mano
    setTimeout(() => {
      if (this.state.phase !== 'finished') {
        this.state.currentRound++;
        this.dealNewRound();
      }
    }, 3000);
  }

  resetToNewGame(): void {
    // Resetear solo amarracos y piedras, mantener vacas
    this.state.teamAScore = 0;
    this.state.teamBScore = 0;
    this.state.teamAAmarracos = 0;
    this.state.teamBAmarracos = 0;
    this.state.currentRound = 1;
    this.state.phase = 'mus';
    this.state.subPhase = 'dealing';
    this.state.showingCards = false;
    this.state.adentro = false;
    this.state.gameEnded = false;
    this.state.currentBet = 0;
    this.state.currentBetType = null;
    this.state.waitingForResponse = false;
    this.state.lastBetPlayer = '';
    this.state.bets = {};
    this.state.betHistory = [];
    this.dealNewRound();
  }

  resetTournament(): void {
    // Resetear todo incluyendo vacas
    this.state.teamAScore = 0;
    this.state.teamBScore = 0;
    this.state.teamAAmarracos = 0;
    this.state.teamBAmarracos = 0;
    this.state.teamAVacas = 0;
    this.state.teamBVacas = 0;
    this.state.currentRound = 1;
    this.state.phase = 'mus';
    this.state.subPhase = 'dealing';
    this.state.showingCards = false;
    this.state.adentro = false;
    this.state.gameEnded = false;
    this.state.currentBet = 0;
    this.state.currentBetType = null;
    this.state.waitingForResponse = false;
    this.state.lastBetPlayer = '';
    this.state.bets = {};
    this.state.betHistory = [];
    this.dealNewRound();
  }

  processBotActions(): void {
    const currentPlayer = this.state.players.find(p => p.id === this.state.currentPlayer);
    if (!currentPlayer?.isBot) return;

    const bot = new MusBot(currentPlayer);

    try {
      if (this.state.subPhase === 'mus-decision') {
        const decision = bot.decideMus();
        const phrase = bot.getBotPhrase(decision === 'mus' ? 'mus' : 'no-mus');
        
        setTimeout(() => {
          if (phrase) {
            this.addDialogue(currentPlayer.id, phrase, decision);
          }
          this.processMusDecision(currentPlayer.id, decision);
        }, 1500);
      } else if (this.state.subPhase === 'discarding') {
        const cardsToDiscard = bot.selectCardsToDiscard();
        setTimeout(() => {
          this.discardCards(currentPlayer.id, cardsToDiscard);
        }, 2000);
      } else if (this.state.subPhase === 'betting') {
        const bet = bot.decideBet(this.state.phase, this.state.currentBet, this.state.waitingForResponse);
        const phrase = bot.getBotPhrase('bet');
        
        setTimeout(() => {
          if (phrase) {
            this.addDialogue(currentPlayer.id, phrase, bet.type);
          }
          this.placeBet(currentPlayer.id, bet);
        }, 1800);
      }
    } catch (error) {
      console.error('Error procesando acción del bot:', error);
      // Fallback: hacer que el bot pase
      if (this.state.subPhase === 'betting') {
        this.placeBet(currentPlayer.id, { type: 'paso', playerId: currentPlayer.id });
      } else if (this.state.subPhase === 'mus-decision') {
        this.processMusDecision(currentPlayer.id, 'paso' as any);
      }
    }
  }

  sendCompanionSignal(playerId: string, signal: 'buenas' | 'malas' | 'regulares'): void {
    const player = this.state.players.find(p => p.id === playerId);
    if (!player || !this.state.senasEnabled) return;

    this.state.companionSignal = signal;
    this.addDialogue(playerId, `*Hace señas: ${signal}*`, 'signal');
    
    // La señal dura solo unos segundos
    setTimeout(() => {
      if (this.state.companionSignal === signal) {
        this.state.companionSignal = undefined;
      }
    }, 3000);
  }

  nextPlayer(): void {
    PhaseManager.nextPlayer(this.state);
  }
}
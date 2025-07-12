import { GameState, Player, GameDialogue, BetAction } from '@/types/game';
import { createDeck, dealCards } from '../cards';
import { MusBot } from '../bots';
import { CardEvaluator } from './card-evaluation';

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
    
    // Mantener solo los últimos 8 diálogos
    if (this.state.dialogues.length > 8) {
      this.state.dialogues = this.state.dialogues.slice(-8);
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
    this.state.showingCards = false;
    
    this.resetCurrentPlayer();
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
      // Si alguien dice "no hay mus", empezar las fases de apuestas
      this.startBettingPhases();
      return;
    }

    // Avanzar al siguiente jugador
    this.nextPlayer();

    // Si todos han decidido y todos quieren mus, ir al descarte
    if (this.state.playersWantingMus.length === 4) {
      this.state.subPhase = 'discarding';
      this.resetCurrentPlayer();
      this.addDialogue('system', 'Todos quieren mus. Fase de descarte', 'system');
    }
  }

  discardCards(playerId: string, cardIndices: number[]): void {
    const player = this.state.players.find(p => p.id === playerId);
    if (!player) return;

    if (cardIndices.length === 0) {
      this.addDialogue(playerId, 'No descarto', 'no-discard');
    } else {
      // Remover cartas seleccionadas y dar nuevas
      const newHand = player.hand.filter((_, index) => !cardIndices.includes(index));
      
      while (newHand.length < 4 && this.state.deck.length > 0) {
        newHand.push(this.state.deck.pop()!);
      }
      
      player.hand = newHand;
      player.hasPares = CardEvaluator.checkPares(player.hand);
      player.hasJuego = CardEvaluator.checkJuego(player.hand);
      player.punto = CardEvaluator.calculatePunto(player.hand);
      
      this.addDialogue(playerId, `Descarto ${cardIndices.length} carta${cardIndices.length !== 1 ? 's' : ''}`, 'discard');
    }

    this.nextPlayer();

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

  private startBettingPhases(): void {
    this.state.phase = 'grande';
    this.state.subPhase = 'betting';
    this.resetCurrentPlayer();
    console.log('Iniciando fase de apuestas: Grande');
  }

  placeBet(playerId: string, bet: BetAction): void {
    const player = this.state.players.find(p => p.id === playerId);
    if (!player) return;

    this.state.bets[playerId] = bet;
    this.state.betHistory.push(bet);

    switch (bet.type) {
      case 'paso':
        this.addDialogue(playerId, 'Paso', 'bet');
        this.handlePaso();
        break;
      case 'envido':
        const amount = bet.amount || 2;
        this.addDialogue(playerId, `Envido ${amount}`, 'bet');
        this.state.currentBet += amount;
        this.state.currentBetType = 'envido';
        this.state.lastBetPlayer = playerId;
        this.state.waitingForResponse = true;
        this.nextPlayer();
        break;
      case 'echo-mas':
        this.addDialogue(playerId, 'Echo 2 más', 'bet');
        this.state.currentBet += 2;
        this.state.lastBetPlayer = playerId;
        this.nextPlayer();
        break;
      case 'ordago':
        this.addDialogue(playerId, '¡Órdago!', 'bet');
        this.state.currentBet = 40;
        this.state.currentBetType = 'ordago';
        this.state.lastBetPlayer = playerId;
        this.state.waitingForResponse = true;
        this.nextPlayer();
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

  private handlePaso(): void {
    if (this.checkAllPassed()) {
      this.resolvePhaseWithoutBets();
    } else {
      this.nextPlayer();
    }
  }

  private handleQuiero(): void {
    this.state.waitingForResponse = false;
    
    if (this.state.currentBetType === 'ordago') {
      // Órdago aceptado - mostrar cartas y determinar ganador inmediatamente
      this.resolveOrdago();
    } else {
      // Envido aceptado - resolver fase y continuar
      this.resolvePhase();
    }
  }

  private handleNoQuiero(): void {
    this.state.waitingForResponse = false;
    
    const betPlayer = this.state.players.find(p => p.id === this.state.lastBetPlayer);
    if (betPlayer) {
      this.addPoints(betPlayer.team, 1, 'deje');
    }
    
    this.state.currentBet = 0;
    this.state.currentBetType = null;
    this.nextPhase();
  }

  private resolveOrdago(): void {
    this.state.showingCards = true;
    this.addDialogue('system', '¡Órdago aceptado! Mostrando cartas...', 'system');
    
    // Mostrar cartas de todos los jugadores
    this.state.players.forEach(player => {
      const cardsText = player.hand.map(c => `${c.name}`).join(', ');
      this.addDialogue(player.id, `Cartas: ${cardsText}`, 'reveal-cards');
    });
    
    // Determinar ganador del órdago
    const winner = this.determinePhaseWinner();
    if (winner) {
      // El ganador del órdago gana toda la partida (1 vaca)
      if (winner === 'A') {
        this.state.teamAVacas++;
      } else {
        this.state.teamBVacas++;
      }
      
      this.addDialogue('system', `¡Equipo ${winner} gana la vaca por órdago!`, 'game-end');
      
      // Verificar si algún equipo ha ganado el torneo (3 vacas)
      if (this.state.teamAVacas >= 3 || this.state.teamBVacas >= 3) {
        this.state.gameEnded = true;
        const tournamentWinner = this.state.teamAVacas >= 3 ? 'A' : 'B';
        this.addDialogue('system', `¡Equipo ${tournamentWinner} gana el torneo ${this.state.teamAVacas}-${this.state.teamBVacas}!`, 'tournament-end');
      }
      
      // Finalizar inmediatamente
      this.state.phase = 'finished';
      this.state.subPhase = 'ordago-resolved';
    }
  }

  private checkAllPassed(): boolean {
    const activePlayers = this.getActivePlayers();
    return activePlayers.every(p => this.state.bets[p.id]?.type === 'paso');
  }

  private getActivePlayers(): Player[] {
    switch (this.state.phase) {
      case 'pares':
        return this.state.players.filter(p => p.hasPares);
      case 'juego':
        return this.state.players.filter(p => p.hasJuego);
      case 'punto':
        return this.state.players.filter(p => !p.hasJuego);
      default:
        return this.state.players;
    }
  }

  private resolvePhaseWithoutBets(): void {
    const winner = this.determinePhaseWinner();
    if (winner) {
      this.addPoints(winner, 1, `${this.state.phase} en paso`);
    }
    this.nextPhase();
  }

  private resolvePhase(): void {
    const winner = this.determinePhaseWinner();
    if (winner) {
      this.addPoints(winner, this.state.currentBet, `${this.state.phase} con ${this.state.currentBet} piedras`);
    }
    this.state.currentBet = 0;
    this.state.currentBetType = null;
    this.nextPhase();
  }

  private determinePhaseWinner(): 'A' | 'B' | null {
    const teamAPlayers = this.state.players.filter(p => p.team === 'A');
    const teamBPlayers = this.state.players.filter(p => p.team === 'B');
    
    let teamABest = 0;
    let teamBBest = 0;
    
    switch (this.state.phase) {
      case 'grande':
        teamABest = Math.max(...teamAPlayers.map(p => Math.max(...p.hand.map(c => c.musValue))));
        teamBBest = Math.max(...teamBPlayers.map(p => Math.max(...p.hand.map(c => c.musValue))));
        break;
      case 'chica':
        teamABest = 11 - Math.min(...teamAPlayers.map(p => Math.min(...p.hand.map(c => c.musValue))));
        teamBBest = 11 - Math.min(...teamBPlayers.map(p => Math.min(...p.hand.map(c => c.musValue))));
        break;
      case 'pares':
        teamABest = Math.max(...teamAPlayers.filter(p => p.hasPares).map(p => CardEvaluator.evaluateParesValue(p.hand)));
        teamBBest = Math.max(...teamBPlayers.filter(p => p.hasPares).map(p => CardEvaluator.evaluateParesValue(p.hand)));
        break;
      case 'juego':
        teamABest = Math.max(...teamAPlayers.filter(p => p.hasJuego).map(p => CardEvaluator.evaluateJuegoValue(p.hand)));
        teamBBest = Math.max(...teamBPlayers.filter(p => p.hasJuego).map(p => CardEvaluator.evaluateJuegoValue(p.hand)));
        break;
      case 'punto':
        const teamAPunto = teamAPlayers.filter(p => !p.hasJuego).map(p => p.punto || 0);
        const teamBPunto = teamBPlayers.filter(p => !p.hasJuego).map(p => p.punto || 0);
        if (teamAPunto.length > 0) teamABest = Math.max(...teamAPunto);
        if (teamBPunto.length > 0) teamBBest = Math.max(...teamBPunto);
        break;
    }
    
    if (teamABest > teamBBest) return 'A';
    if (teamBBest > teamABest) return 'B';
    return null; // Empate
  }

  private addPoints(team: 'A' | 'B', points: number, reason: string): void {
    if (team === 'A') {
      this.state.teamAScore += points;
    } else {
      this.state.teamBScore += points;
    }
    
    this.addDialogue('system', `Equipo ${team} gana ${points} piedra${points !== 1 ? 's' : ''} (${reason})`, 'scoring');
    
    // Convertir a amarracos
    this.convertToAmarracos();
  }

  private convertToAmarracos(): void {
    if (this.state.teamAScore >= 5) {
      this.state.teamAAmarracos += Math.floor(this.state.teamAScore / 5);
      this.state.teamAScore = this.state.teamAScore % 5;
    }
    if (this.state.teamBScore >= 5) {
      this.state.teamBAmarracos += Math.floor(this.state.teamBScore / 5);
      this.state.teamBScore = this.state.teamBScore % 5;
    }
  }

  private nextPhase(): void {
    this.state.bets = {};
    this.state.betHistory = [];
    
    switch (this.state.phase) {
      case 'grande':
        // Verificar si hay jugadores con pares
        if (this.state.players.some(p => p.hasPares)) {
          this.state.phase = 'pares';
          this.state.subPhase = 'announcing';
          this.announcePlayersWithPares();
        } else {
          this.skipToJuego();
        }
        break;
      case 'pares':
        this.skipToJuego();
        break;
      case 'juego':
        // Verificar si hay jugadores sin juego para el punto
        if (this.state.players.some(p => !p.hasJuego)) {
          this.state.phase = 'punto';
          this.state.subPhase = 'betting';
        } else {
          this.finishHand();
        }
        break;
      case 'punto':
        this.finishHand();
        break;
      default:
        this.finishHand();
    }
    
    if (this.state.subPhase === 'betting') {
      this.resetCurrentPlayer();
    }
  }

  private skipToJuego(): void {
    // Verificar si hay jugadores con juego
    if (this.state.players.some(p => p.hasJuego)) {
      this.state.phase = 'juego';
      this.state.subPhase = 'announcing';
      this.announcePlayersWithJuego();
    } else {
      // Ir directamente al punto
      this.state.phase = 'punto';
      this.state.subPhase = 'betting';
      this.resetCurrentPlayer();
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
    
    // Después de 3 segundos, cambiar a betting
    setTimeout(() => {
      this.state.subPhase = 'betting';
      this.resetCurrentPlayer();
    }, 3000);
  }

  private announcePlayersWithJuego(): void {
    this.state.players.forEach(player => {
      if (player.hasJuego) {
        this.addDialogue(player.id, 'Juego', 'announce-juego');
      } else {
        this.addDialogue(player.id, 'No juego', 'announce-no-juego');
      }
    });
    
    // Después de 3 segundos, cambiar a betting
    setTimeout(() => {
      this.state.subPhase = 'betting';
      this.resetCurrentPlayer();
    }, 3000);
  }

  private finishHand(): void {
    // Verificar si algún equipo ha ganado la partida
    if (this.state.teamAAmarracos >= 8) {
      this.state.teamAVacas++;
      this.addDialogue('system', '¡Equipo A gana la partida!', 'game-end');
      this.checkTournamentEnd();
    } else if (this.state.teamBAmarracos >= 8) {
      this.state.teamBVacas++;
      this.addDialogue('system', '¡Equipo B gana la partida!', 'game-end');
      this.checkTournamentEnd();
    } else {
      // Continuar con la siguiente mano
      setTimeout(() => {
        this.state.currentRound++;
        this.dealNewRound();
      }, 3000);
    }
  }

  private checkTournamentEnd(): void {
    if (this.state.teamAVacas >= 3 || this.state.teamBVacas >= 3) {
      this.state.gameEnded = true;
      const tournamentWinner = this.state.teamAVacas >= 3 ? 'A' : 'B';
      this.addDialogue('system', `¡Equipo ${tournamentWinner} gana el torneo ${this.state.teamAVacas}-${this.state.teamBVacas}!`, 'tournament-end');
      this.state.phase = 'finished';
    } else {
      // Reset para nueva partida pero mantener vacas
      this.state.teamAScore = 0;
      this.state.teamBScore = 0;
      this.state.teamAAmarracos = 0;
      this.state.teamBAmarracos = 0;
      this.state.phase = 'finished';
    }
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
        setTimeout(() => {
          this.processMusDecision(currentPlayer.id, decision);
        }, 1500);
      } else if (this.state.subPhase === 'discarding') {
        const cardsToDiscard = bot.selectCardsToDiscard();
        setTimeout(() => {
          this.discardCards(currentPlayer.id, cardsToDiscard);
        }, 2000);
      } else if (this.state.subPhase === 'betting') {
        // Solo apostar si el jugador puede participar en esta fase
        const activePlayers = this.getActivePlayers();
        if (activePlayers.includes(currentPlayer)) {
          const bet = bot.decideBet(this.state.phase, this.state.currentBet, this.state.waitingForResponse);
          setTimeout(() => {
            this.placeBet(currentPlayer.id, bet);
          }, 1800);
        } else {
          // Si no puede participar, pasar al siguiente jugador
          this.nextPlayer();
        }
      }
    } catch (error) {
      console.error('Error procesando acción del bot:', error);
      // Fallback: hacer que el bot pase
      if (this.state.subPhase === 'betting') {
        this.placeBet(currentPlayer.id, { type: 'paso', playerId: currentPlayer.id });
      } else if (this.state.subPhase === 'mus-decision') {
        this.processMusDecision(currentPlayer.id, 'no-mus');
      }
    }
  }

  sendCompanionSignal(playerId: string, signal: 'buenas' | 'malas' | 'regulares'): void {
    const player = this.state.players.find(p => p.id === playerId);
    if (!player || !this.state.senasEnabled) return;

    this.state.companionSignal = signal;
    this.addDialogue(playerId, `*Hace señas: ${signal}*`, 'signal');
    
    setTimeout(() => {
      if (this.state.companionSignal === signal) {
        this.state.companionSignal = undefined;
      }
    }, 3000);
  }

  private nextPlayer(): void {
    const currentIndex = this.state.players.findIndex(p => p.id === this.state.currentPlayer);
    const nextIndex = (currentIndex + 1) % this.state.players.length;
    this.state.currentPlayer = this.state.players[nextIndex].id;
  }

  private resetCurrentPlayer(): void {
    const manoPlayer = this.state.players.find(p => p.isMano);
    this.state.currentPlayer = manoPlayer ? manoPlayer.id : this.state.players[0].id;
  }
}
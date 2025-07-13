import { GameState, Player, GameDialogue, BetAction } from '@/types/game';
import { createDeck, dealCards } from '../cards';
import { MusBot } from '../bots';
import { CardEvaluator } from './card-evaluation';
import { getActionPhrase, getRandomCustomPhrase } from '../bots/custom-phrases';

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
      gameEnded: false,
      selectedCards: []
    };
  }

  getState(): GameState {
    return { ...this.state };
  }

  addDialogue(playerId: string, message: string, action: string): void {
    const player = this.state.players.find(p => p.id === playerId);
    
    let finalMessage = message;
    
    // Añadir frases personalizadas para bots en acciones específicas
    if (player?.isBot && ['paso', 'envido', 'ordago', 'mus', 'no-mus'].includes(action)) {
      if (Math.random() < 0.4) { // 40% de probabilidad de usar frase personalizada
        finalMessage = getActionPhrase(action);
      }
    }

    const dialogue: GameDialogue = {
      playerId,
      playerName: player?.name || 'Sistema',
      message: finalMessage,
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
    this.state.selectedCards = [];
    
    this.resetCurrentPlayer();
    console.log('Nueva ronda iniciada. Manos repartidas.');
  }

  // Métodos para manejar el sistema de descartes
  selectCard(cardIndex: number): void {
    if (this.state.selectedCards.includes(cardIndex)) {
      this.state.selectedCards = this.state.selectedCards.filter(i => i !== cardIndex);
    } else {
      this.state.selectedCards.push(cardIndex);
    }
  }

  confirmDiscard(): void {
    const userPlayer = this.state.players.find(p => !p.isBot);
    if (userPlayer && this.state.selectedCards.length > 0) {
      this.processDiscard(userPlayer.id, this.state.selectedCards);
      this.state.selectedCards = [];
    }
  }

  // Método para enviar señales al compañero
  sendCompanionSignal(playerId: string, signal: 'buenas' | 'malas' | 'regulares'): void {
    this.state.companionSignal = signal;
    this.addDialogue(playerId, `Señal: ${signal}`, 'signal');
  }

  // Método para procesar descarte de cartas
  discardCards(playerId: string, cardIndices: number[]): void {
    this.processDiscard(playerId, cardIndices);
  }

  // Métodos para reiniciar el torneo o juego
  resetTournament(): void {
    this.state.teamAVacas = 0;
    this.state.teamBVacas = 0;
    this.resetGame();
  }

  resetToNewGame(): void {
    this.resetGame();
  }

  // Método para reiniciar completamente el juego (para rematch)
  resetGame(): void {
    // Reiniciar puntuaciones pero mantener vacas del ganador
    const winningTeam = this.state.teamAVacas > this.state.teamBVacas ? 'A' : 'B';
    
    this.state.teamAScore = 0;
    this.state.teamBScore = 0;
    this.state.teamAAmarracos = 0;
    this.state.teamBAmarracos = 0;
    
    // Añadir una vaca al equipo ganador
    if (winningTeam === 'A') {
      this.state.teamAVacas++;
    } else {
      this.state.teamBVacas++;
    }
    
    this.state.currentRound = 1;
    this.state.roundResults = [];
    this.state.dialogues = [];
    this.state.gameEnded = false;
    
    // Verificar si algún equipo ha ganado el torneo (3 vacas)
    if (this.state.teamAVacas >= 3 || this.state.teamBVacas >= 3) {
      this.state.gameEnded = true;
      const tournamentWinner = this.state.teamAVacas >= 3 ? 'A' : 'B';
      this.addDialogue('system', `¡Equipo ${tournamentWinner} gana el torneo ${this.state.teamAVacas}-${this.state.teamBVacas}!`, 'tournament-end');
    } else {
      // Iniciar nueva partida
      this.dealNewRound();
    }
  }

  processMusDecision(playerId: string, decision: 'mus' | 'no-mus'): void {
    const player = this.state.players.find(p => p.id === playerId);
    if (!player) return;

    if (decision === 'mus') {
      this.state.playersWantingMus.push(playerId);
      this.addDialogue(playerId, 'Mus', 'mus');
    } else {
      this.addDialogue(playerId, 'Corto', 'no-mus');
      this.finishMusPhase();
      return;
    }

    if (this.state.playersWantingMus.length === this.state.players.length) {
      // Todos quieren mus
      this.state.musCount++;
      this.addDialogue('system', `Mus ${this.state.musCount}`, 'system');
      this.state.subPhase = 'discarding';
      this.resetCurrentPlayer();
    } else {
      this.nextPlayer();
    }
  }

  processDiscard(playerId: string, cardIndices: number[]): void {
    const player = this.state.players.find(p => p.id === playerId);
    if (!player) return;

    // Descartar cartas seleccionadas
    cardIndices.sort((a, b) => b - a); // Orden descendente para no afectar indices
    cardIndices.forEach(index => {
      if (index >= 0 && index < player.hand.length) {
        player.hand.splice(index, 1);
      }
    });

    // Repartir nuevas cartas
    const newCards = dealCards(this.state.deck, cardIndices.length).hands[0];
    player.hand.push(...newCards);

    // Recalcular estadísticas de la mano
    player.hasPares = CardEvaluator.checkPares(player.hand);
    player.hasJuego = CardEvaluator.checkJuego(player.hand);
    player.punto = CardEvaluator.calculatePunto(player.hand);

    this.addDialogue(playerId, `Descarta ${cardIndices.length} carta${cardIndices.length !== 1 ? 's' : ''}`, 'discard');

    // Verificar si todos han descartado
    this.checkAllDiscarded();
  }


  private checkAllDiscarded(): void {
    // Simplificado: después del primer descarte, continuar
    this.state.playersWantingMus = [];
    this.state.subPhase = 'mus-decision';
    this.resetCurrentPlayer();
  }

  private finishMusPhase(): void {
    this.state.phase = 'grande';
    this.state.subPhase = 'betting';
    this.resetCurrentPlayer();
    this.addDialogue('system', 'Comienza la Grande', 'system');
  }

  placeBet(playerId: string, bet: BetAction): void {
    this.state.bets[playerId] = bet;
    
    switch (bet.type) {
      case 'paso':
        this.addDialogue(playerId, 'Paso', 'paso');
        this.handlePaso();
        break;
      case 'envido':
        this.state.currentBet = bet.amount || 2;
        this.state.currentBetType = 'envido';
        this.state.waitingForResponse = true;
        this.state.lastBetPlayer = playerId;
        this.addDialogue(playerId, `Envido ${this.state.currentBet}`, 'envido');
        this.nextPlayer();
        break;
      case 'echo-mas':
        this.state.currentBet += 2;
        this.addDialogue(playerId, `Echo ${this.state.currentBet}`, 'echo-mas');
        this.nextPlayer();
        break;
      case 'ordago':
        this.state.currentBet = 40;
        this.state.currentBetType = 'ordago';
        this.state.waitingForResponse = true;
        this.state.lastBetPlayer = playerId;
        this.addDialogue(playerId, '¡Órdago!', 'ordago');
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
      // Órdago aceptado - resolver inmediatamente
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
    // Determinar ganador del órdago inmediatamente
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
        this.state.phase = 'chica';
        this.state.subPhase = 'betting';
        break;
      case 'chica':
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
        break;
    }
    
    this.resetCurrentPlayer();
  }

  private skipToJuego(): void {
    // Verificar si hay jugadores con juego
    if (this.state.players.some(p => p.hasJuego)) {
      this.state.phase = 'juego';
      this.state.subPhase = 'announcing';
      this.announcePlayersWithJuego();
    } else {
      // Si nadie tiene juego, ir directamente al punto
      this.state.phase = 'punto';
      this.state.subPhase = 'betting';
    }
  }

  private announcePlayersWithPares(): void {
    this.state.players.forEach(player => {
      if (player.hasPares) {
        this.addDialogue(player.id, '¡Pares!', 'announce-pares');
      } else {
        this.addDialogue(player.id, 'No hay pares', 'announce-no-pares');
      }
    });
    
    // Después de anunciar, empezar apuestas solo con los que tienen pares
    setTimeout(() => {
      this.state.subPhase = 'betting';
      this.resetCurrentPlayer();
    }, 2000);
  }

  private announcePlayersWithJuego(): void {
    this.state.players.forEach(player => {
      if (player.hasJuego) {
        this.addDialogue(player.id, '¡Juego!', 'announce-juego');
      } else {
        this.addDialogue(player.id, 'No hay juego', 'announce-no-juego');
      }
    });
    
    // Después de anunciar, empezar apuestas solo con los que tienen juego
    setTimeout(() => {
      this.state.subPhase = 'betting';
      this.resetCurrentPlayer();
    }, 2000);
  }

  private finishHand(): void {
    this.state.phase = 'scoring';
    this.state.subPhase = 'next-round';
    
    // Verificar si algún equipo ha ganado la partida
    if (this.state.teamAAmarracos >= 3 || this.state.teamBAmarracos >= 3) {
      const winner = this.state.teamAAmarracos >= 3 ? 'A' : 'B';
      if (winner === 'A') {
        this.state.teamAVacas++;
      } else {
        this.state.teamBVacas++;
      }
      
      this.addDialogue('system', `¡Equipo ${winner} gana la partida!`, 'game-end');
      
      // Verificar si algún equipo ha ganado el torneo (3 vacas)
      if (this.state.teamAVacas >= 3 || this.state.teamBVacas >= 3) {
        this.state.gameEnded = true;
        const tournamentWinner = this.state.teamAVacas >= 3 ? 'A' : 'B';
        this.addDialogue('system', `¡Equipo ${tournamentWinner} gana el torneo ${this.state.teamAVacas}-${this.state.teamBVacas}!`, 'tournament-end');
      }
      
      this.state.phase = 'finished';
    } else {
      // Continuar con la siguiente mano
      setTimeout(() => {
        this.dealNewRound();
      }, 3000);
    }
  }

  processBotActions(): void {
    const currentPlayer = this.state.players.find(p => p.id === this.state.currentPlayer);
    if (!currentPlayer?.isBot) return;

    const bot = new MusBot(currentPlayer);

    setTimeout(() => {
      if (this.state.subPhase === 'mus-decision') {
        const decision = bot.decideMus();
        this.processMusDecision(currentPlayer.id, decision);
      } else if (this.state.subPhase === 'discarding') {
        const cardsToDiscard = bot.selectCardsToDiscard();
        this.processDiscard(currentPlayer.id, cardsToDiscard);
      } else if (this.state.subPhase === 'betting') {
        const bet = bot.decideBet(this.state.phase, this.state.currentBet, this.state.waitingForResponse);
        this.placeBet(currentPlayer.id, bet);
      }
    }, 1000 + Math.random() * 2000); // Variación en tiempo de respuesta
  }

  private resetCurrentPlayer(): void {
    const manoPlayer = this.state.players.find(p => p.isMano);
    this.state.currentPlayer = manoPlayer?.id || this.state.players[0].id;
  }

  private nextPlayer(): void {
    const activePlayers = this.getActivePlayers();
    const currentIndex = activePlayers.findIndex(p => p.id === this.state.currentPlayer);
    const nextIndex = (currentIndex + 1) % activePlayers.length;
    this.state.currentPlayer = activePlayers[nextIndex].id;
  }
}
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
      player.hasDiscarded = false;
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
    this.state.teamAScore = 0;
    this.state.teamBScore = 0;
    this.state.teamAVacas = 0;
    this.state.teamBVacas = 0;
    this.state.teamAAmarracos = 0;
    this.state.teamBAmarracos = 0;
    this.state.gameEnded = false;
    this.dealNewRound();
  }

  resetToNewGame(): void {
    // Reiniciar puntos pero mantener vacas para revancha
    this.state.teamAScore = 0;
    this.state.teamBScore = 0;
    this.state.teamAAmarracos = 0;
    this.state.teamBAmarracos = 0;
    this.state.gameEnded = false;
    this.dealNewRound();
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

    if (cardIndices.length === 0) {
      this.addDialogue(playerId, 'No descarta', 'discard');
    } else {
      // Descartar cartas seleccionadas
      cardIndices.sort((a, b) => b - a); // Orden descendente para no afectar indices
      cardIndices.forEach(index => {
        if (index >= 0 && index < player.hand.length) {
          player.hand.splice(index, 1);
        }
      });

      // Repartir nuevas cartas del mazo
      while (player.hand.length < 4 && this.state.deck.length > 0) {
        const randomIndex = Math.floor(Math.random() * this.state.deck.length);
        const newCard = this.state.deck.splice(randomIndex, 1)[0];
        player.hand.push(newCard);
      }

      // Recalcular estadísticas de la mano
      player.hasPares = CardEvaluator.checkPares(player.hand);
      player.hasJuego = CardEvaluator.checkJuego(player.hand);
      player.punto = CardEvaluator.calculatePunto(player.hand);

      this.addDialogue(playerId, `Descarta ${cardIndices.length} carta${cardIndices.length !== 1 ? 's' : ''}`, 'discard');
    }

    // Marcar como descartado
    player.hasDiscarded = true;

    // Verificar si todos han descartado
    this.checkAllDiscarded();
  }


  private checkAllDiscarded(): void {
    const allDiscarded = this.state.players.every(p => p.hasDiscarded);
    
    if (allDiscarded) {
      // Hacer que los bots descarten también
      this.processBotDiscards();
      
      // Reset para nueva ronda de Mus
      this.state.players.forEach(p => p.hasDiscarded = false);
      this.state.playersWantingMus = [];
      this.state.subPhase = 'mus-decision';
      this.resetCurrentPlayer();
      this.addDialogue('system', 'Cartas repartidas. Nueva ronda de Mus', 'system');
      
      // Procesar decisiones de bots automáticamente
      setTimeout(() => {
        this.processBotActions();
      }, 1000);
    } else {
      this.nextPlayer();
    }
  }

  private processBotDiscards(): void {
    this.state.players.filter(p => p.isBot).forEach(player => {
      if (!player.hasDiscarded) {
        // Estrategia de descarte simple para bots
        const cardsToDiscard = this.getBotDiscardStrategy(player);
        if (cardsToDiscard.length > 0) {
          this.processDiscard(player.id, cardsToDiscard);
        } else {
          player.hasDiscarded = true;
          this.addDialogue(player.id, 'No descarta', 'discard');
        }
      }
    });
  }

  private getBotDiscardStrategy(player: Player): number[] {
    const toDiscard: number[] = [];
    
    // Estrategia simple: descartar cartas medias (4-6)
    player.hand.forEach((card, index) => {
      if (card.musValue >= 4 && card.musValue <= 6 && Math.random() > 0.6) {
        toDiscard.push(index);
      }
    });
    
    // Limitar a máximo 3 cartas
    return toDiscard.slice(0, 3);
  }

  selectCard(cardIndex: number): void {
    const selectedCards = [...this.state.selectedCards];
    const index = selectedCards.indexOf(cardIndex);
    
    if (index === -1) {
      selectedCards.push(cardIndex);
    } else {
      selectedCards.splice(index, 1);
    }
    
    this.state.selectedCards = selectedCards;
  }

  confirmDiscard(): void {
    const userPlayer = this.state.players.find(p => !p.isBot);
    if (!userPlayer) return;
    
    this.processDiscard(userPlayer.id, this.state.selectedCards);
    this.state.selectedCards = [];
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
      // Órdago aceptado - finalizar partida inmediatamente
      this.resolveOrdagoFinal();
    } else {
      // Envido aceptado - resolver fase y continuar
      this.resolvePhase();
    }
  }

  private handleNoQuiero(): void {
    // Contar cuántos jugadores del equipo contrario han dicho "no quiero"
    const currentPlayerId = this.state.currentPlayer;
    const currentPlayer = this.state.players.find(p => p.id === currentPlayerId);
    const betPlayer = this.state.players.find(p => p.id === this.state.lastBetPlayer);
    
    if (!currentPlayer || !betPlayer) return;
    
    // Obtener equipo que apostó y equipo que responde
    const bettingTeam = betPlayer.team;
    const respondingTeam = currentPlayer.team;
    const respondingTeamPlayers = this.state.players.filter(p => p.team === respondingTeam);
    
    // Verificar si ambos jugadores del equipo han rechazado
    const noQuieroCount = respondingTeamPlayers.filter(p => 
      this.state.bets[p.id]?.type === 'no-quiero'
    ).length;
    
    // Si solo uno ha dicho no-quiero, pasar al compañero
    if (noQuieroCount < 2) {
      const nextTeammate = respondingTeamPlayers.find(p => 
        p.id !== currentPlayerId && !this.state.bets[p.id]
      );
      if (nextTeammate) {
        this.state.currentPlayer = nextTeammate.id;
        return;
      }
    }
    
    // Si ambos han dicho no-quiero, otorgar deje al equipo apostador
    this.state.waitingForResponse = false;
    this.addPoints(bettingTeam, 1, 'deje');
    
    this.state.currentBet = 0;
    this.state.currentBetType = null;
    this.nextPhase();
  }

  private resolveOrdagoFinal(): void {
    // Determinar ganador del órdago por mejor mano general
    const winner = this.determineOrdagoWinner();
    if (winner) {
      // El ganador del órdago gana toda la partida (40 puntos)
      this.addPoints(winner, 40, 'órdago querido');
      
      this.addDialogue('system', `¡Equipo ${winner} gana por órdago!`, 'game-end');
      
      // Finalizar partida inmediatamente
      this.state.phase = 'finished';
      this.state.gameEnded = true;
    }
  }

  private determineOrdagoWinner(): 'A' | 'B' | null {
    const teamAPlayers = this.state.players.filter(p => p.team === 'A');
    const teamBPlayers = this.state.players.filter(p => p.team === 'B');
    
    // Evaluar mejor mano de cada equipo considerando todas las modalidades
    let teamABest = 0;
    let teamBBest = 0;
    
    // Prioridad: Juego > Pares > Grande > Chica > Punto
    for (const player of teamAPlayers) {
      const handValue = this.calculateHandValue(player);
      if (handValue > teamABest) teamABest = handValue;
    }
    
    for (const player of teamBPlayers) {
      const handValue = this.calculateHandValue(player);
      if (handValue > teamBBest) teamBBest = handValue;
    }
    
    if (teamABest > teamBBest) return 'A';
    if (teamBBest > teamABest) return 'B';
    return null;
  }

  private calculateHandValue(player: Player): number {
    let value = 0;
    
    // Juego (máxima prioridad): 10000 + valor del juego
    if (player.hasJuego) {
      value += 10000 + CardEvaluator.evaluateJuegoValue(player.hand);
    }
    // Pares: 5000 + valor de los pares
    else if (player.hasPares) {
      value += 5000 + CardEvaluator.evaluateParesValue(player.hand);
    }
    // Solo cartas altas: grande + punto
    else {
      const grande = Math.max(...player.hand.map(c => c.musValue));
      value += grande * 100 + (player.punto || 0);
    }
    
    return value;
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
    
    this.addDialogue('system', `Equipo ${team} gana ${points} punto${points !== 1 ? 's' : ''} (${reason})`, 'scoring');
    
    // Verificar fin de partida por 40 puntos
    if (this.state.teamAScore >= 40 || this.state.teamBScore >= 40) {
      const winner = this.state.teamAScore >= 40 ? 'A' : 'B';
      if (winner === 'A') {
        this.state.teamAVacas++;
      } else {
        this.state.teamBVacas++;
      }
      
      this.addDialogue('system', `¡Equipo ${winner} gana la partida con 40 puntos!`, 'game-end');
      
      // Verificar si algún equipo ha ganado el torneo (3 vacas)
      if (this.state.teamAVacas >= 3 || this.state.teamBVacas >= 3) {
        this.state.gameEnded = true;
        const tournamentWinner = this.state.teamAVacas >= 3 ? 'A' : 'B';
        this.addDialogue('system', `¡Equipo ${tournamentWinner} gana el torneo ${this.state.teamAVacas}-${this.state.teamBVacas}!`, 'tournament-end');
      }
      
      this.state.phase = 'finished';
    }
  }

  // Removed amarracos system - now using simple points to 40

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
        this.addDialogue(player.id, 'Pares Sí', 'announce-pares');
      } else {
        this.addDialogue(player.id, 'Pares No', 'announce-no-pares');
      }
    });
    
    // Después de anunciar, empezar apuestas solo con los que tienen pares
    setTimeout(() => {
      if (this.state.players.some(p => p.hasPares)) {
        this.state.subPhase = 'betting';
        this.resetCurrentPlayer();
      } else {
        // Si nadie tiene pares, saltar a juego
        this.skipToJuego();
      }
    }, 2000);
  }

  private announcePlayersWithJuego(): void {
    this.state.players.forEach(player => {
      if (player.hasJuego) {
        this.addDialogue(player.id, 'Juego Sí', 'announce-juego');
      } else {
        this.addDialogue(player.id, 'Juego No', 'announce-no-juego');
      }
    });
    
    // Después de anunciar, empezar apuestas solo con los que tienen juego
    setTimeout(() => {
      if (this.state.players.some(p => p.hasJuego)) {
        this.state.subPhase = 'betting';
        this.resetCurrentPlayer();
      } else {
        // Si nadie tiene juego, ir al punto
        this.state.phase = 'punto';
        this.state.subPhase = 'betting';
        this.resetCurrentPlayer();
      }
    }, 2000);
  }

  private finishHand(): void {
    this.state.phase = 'scoring';
    this.state.subPhase = 'next-round';
    
    // Verificar si algún equipo ha ganado la partida (40 puntos)
    if (this.state.teamAScore >= 40 || this.state.teamBScore >= 40) {
      const winner = this.state.teamAScore >= 40 ? 'A' : 'B';
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

import { GameState, Player, Card, RoundResult, GameDialogue, BetAction } from '@/types/game';
import { createDeck, dealCards, getCardOrder } from './cards';
import { MusBot } from './bots';

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
      players,
      deck: createDeck(),
      musCount: 0,
      playersWantingMus: [],
      bets: {},
      roundResults: [],
      dialogues: [],
      senasEnabled: true,
      waitingForResponse: false,
      adentro: false
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
      player.hasPares = this.checkPares(player.hand);
      player.hasJuego = this.checkJuego(player.hand);
      player.punto = this.calculatePunto(player.hand);
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
    
    this.resetCurrentPlayer();
    console.log('Nueva ronda iniciada. Manos repartidas.');
  }

  private checkPares(hand: Card[]): boolean {
    const values = hand.map(c => c.musValue);
    const counts = values.reduce((acc, val) => {
      acc[val] = (acc[val] || 0) + 1;
      return acc;
    }, {} as Record<number, number>);
    
    return Object.values(counts).some(count => count >= 2);
  }

  private checkJuego(hand: Card[]): boolean {
    const total = hand.reduce((sum, card) => sum + card.musValue, 0);
    return total >= 31;
  }

  private calculatePunto(hand: Card[]): number {
    return hand.reduce((sum, card) => sum + card.musValue, 0);
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
      this.startBettingPhase();
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
      player.hasPares = this.checkPares(player.hand);
      player.hasJuego = this.checkJuego(player.hand);
      player.punto = this.calculatePunto(player.hand);
      
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

  private startBettingPhase(): void {
    this.state.phase = 'grande';
    this.state.subPhase = 'betting';
    this.state.bets = {};
    this.state.betHistory = [];
    this.state.currentBet = 0;
    this.state.waitingForResponse = false;
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
        this.handlePaso(playerId);
        break;
      case 'envido':
        const amount = bet.amount || 2;
        this.state.currentBet += amount;
        this.state.currentBetType = 'envido';
        this.state.lastBetPlayer = playerId;
        this.state.waitingForResponse = true;
        this.addDialogue(playerId, `Envido ${amount}`, 'bet');
        this.nextPlayer();
        break;
      case 'echo-mas':
        this.state.currentBet += 2;
        this.state.lastBetPlayer = playerId;
        this.addDialogue(playerId, 'Echo 2 más', 'bet');
        this.nextPlayer();
        break;
      case 'ordago':
        this.state.currentBet = 40;
        this.state.currentBetType = 'ordago';
        this.state.lastBetPlayer = playerId;
        this.state.waitingForResponse = true;
        this.addDialogue(playerId, '¡Órdago!', 'bet');
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

  private handlePaso(playerId: string): void {
    // Si todos pasan en una fase, se gana 1 piedra al mejor
    const allPassed = this.checkAllPassed();
    if (allPassed) {
      this.resolvePhaseWithoutBets();
    } else {
      this.nextPlayer();
    }
  }

  private handleQuiero(): void {
    if (this.state.currentBetType === 'ordago') {
      // Órdago aceptado - se decide la partida
      this.resolveOrdago();
    } else {
      // Envido aceptado - continuar a la siguiente fase
      this.nextPhase();
    }
  }

  private handleNoQuiero(): void {
    // El equipo que apostó gana 1 piedra (deje)
    const betPlayer = this.state.players.find(p => p.id === this.state.lastBetPlayer);
    if (betPlayer) {
      this.addPoints(betPlayer.team, 1, 'deje');
    }
    this.nextPhase();
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

  private resolveOrdago(): void {
    const winner = this.determinePhaseWinner();
    if (winner) {
      // El ganador del órdago gana toda la partida
      if (winner === 'A') {
        this.state.teamAAmarracos = 8;
      } else {
        this.state.teamBAmarracos = 8;
      }
      this.state.phase = 'finished';
      this.addDialogue('system', `¡Equipo ${winner} gana la partida por órdago!`, 'game-end');
    }
  }

  private determinePhaseWinner(): 'A' | 'B' | null {
    const teamAPlayers = this.state.players.filter(p => p.team === 'A');
    const teamBPlayers = this.state.players.filter(p => p.team === 'B');

    const teamABest = this.getBestHandForPhase(teamAPlayers);
    const teamBBest = this.getBestHandForPhase(teamBPlayers);

    if (teamABest > teamBBest) return 'A';
    if (teamBBest > teamABest) return 'B';
    return null;
  }

  private getBestHandForPhase(players: Player[]): number {
    return Math.max(...players.map(player => {
      const hand = player.hand;
      
      switch (this.state.phase) {
        case 'grande':
          return Math.max(...hand.map(c => getCardOrder(c.value)));
        case 'chica':
          return 13 - Math.min(...hand.map(c => getCardOrder(c.value)));
        case 'pares':
          return this.evaluateParesValue(hand);
        case 'juego':
          return this.evaluateJuegoValue(hand);
        case 'punto':
          const total = hand.reduce((sum, card) => sum + card.musValue, 0);
          return total >= 31 ? 0 : total; // Solo si no tiene juego
        default:
          return 0;
      }
    }));
  }

  private evaluateParesValue(hand: Card[]): number {
    const values = hand.map(c => c.musValue);
    const counts = values.reduce((acc, val) => {
      acc[val] = (acc[val] || 0) + 1;
      return acc;
    }, {} as Record<number, number>);
    
    let score = 0;
    let hasAnyPair = false;
    const pairs = Object.entries(counts).filter(([_, count]) => count >= 2);
    
    for (const [value, count] of pairs) {
      hasAnyPair = true;
      const cardValue = parseInt(value);
      if (count === 4) {
        score += 100 + cardValue; // Duples (muy alto)
      } else if (count === 3) {
        score += 50 + cardValue; // Medias
      } else if (count === 2) {
        score += 10 + cardValue; // Pares simples
      }
    }
    
    // Duples especiales (dos pares diferentes)
    if (pairs.length === 2 && pairs.every(([_, count]) => count === 2)) {
      const values = pairs.map(([v, _]) => parseInt(v)).sort((a,b) => b-a);
      score = 200 + values[0] + values[1]; // Duples (dos pares)
    }
    
    return hasAnyPair ? score : 0;
  }

  private evaluateJuegoValue(hand: Card[]): number {
    const total = hand.reduce((sum, card) => sum + card.musValue, 0);
    if (total < 31) return 0; // No tiene juego
    if (total === 31) return 1000; // Mejor juego posible
    if (total === 32) return 999;  // Segundo mejor
    if (total === 40) return 998;  // Tercero (salta a 40)
    if (total >= 37 && total <= 39) return 1001 - total; // 39, 38, 37
    if (total >= 33 && total <= 36) return 1040 - total; // 36, 35, 34, 33
    return total; // Otros casos
  }

  nextPhase(): void {
    const phases = ['grande', 'chica', 'pares', 'juego', 'punto'];
    let currentIndex = phases.indexOf(this.state.phase);
    
    // Saltar fases que no aplican
    while (currentIndex < phases.length - 1) {
      currentIndex++;
      const nextPhase = phases[currentIndex];
      
      // Verificar si la fase es aplicable
      if (nextPhase === 'pares') {
        // Solo si hay jugadores con pares
        if (!this.state.players.some(p => p.hasPares)) {
          continue;
        }
        // Los jugadores deben declarar si tienen pares
        this.announcePlayersWithPares();
      }
      
      if (nextPhase === 'juego') {
        // Solo si hay jugadores con juego
        if (!this.state.players.some(p => p.hasJuego)) {
          continue;
        }
        // Los jugadores deben declarar si tienen juego
        this.announcePlayersWithJuego();
      }
      
      if (nextPhase === 'punto') {
        // Solo si NO hay jugadores con juego
        if (this.state.players.some(p => p.hasJuego)) {
          continue;
        }
      }
      
      this.state.phase = nextPhase as any;
      this.state.subPhase = 'betting';
      this.state.bets = {};
      this.state.betHistory = [];
      this.state.currentBet = 0;
      this.state.currentBetType = null;
      this.state.waitingForResponse = false;
      this.resetCurrentPlayer();
      console.log(`Pasando a la fase: ${this.state.phase}`);
      return;
    }
    
    // No quedan más fases, terminar la mano
    this.finishHand();
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
    this.state.phase = 'scoring';
    this.state.subPhase = 'revealing';
    
    // Resolver todas las apuestas aceptadas
    this.resolveAllBets();
    
    // Verificar si algún equipo ha ganado
    this.checkGameEnd();
    
    // Preparar siguiente mano
    setTimeout(() => {
      if (this.state.phase !== 'finished') {
        this.state.currentRound++;
        this.dealNewRound();
      }
    }, 3000);
  }

  private resolveAllBets(): void {
    // Resolver fases automáticamente si nadie apostó
    const phases = ['grande', 'chica', 'pares', 'juego', 'punto'];
    
    phases.forEach(phase => {
      const phaseHadActivity = this.state.roundResults.some(r => r.phase === phase);
      if (!phaseHadActivity) {
        // Nadie apostó en esta fase, dar 1 piedra al mejor
        const tempPhase = this.state.phase;
        this.state.phase = phase as any;
        const winner = this.determinePhaseWinner();
        this.state.phase = tempPhase;
        
        if (winner) {
          let points = 1;
          // Puntos especiales según la fase
          if (phase === 'pares') {
            const teamABest = this.getBestParesForTeam('A');
            const teamBBest = this.getBestParesForTeam('B');
            if (teamABest.type === 'duples' || teamBBest.type === 'duples') points = 3;
            else if (teamABest.type === 'medias' || teamBBest.type === 'medias') points = 2;
          } else if (phase === 'juego') {
            points = 2; // Juego básico
            // Si es juego de 31, son 3 puntos
            const teamAHas31 = this.teamHasJuego31('A');
            const teamBHas31 = this.teamHasJuego31('B');
            if (teamAHas31 || teamBHas31) points = 3;
          }
          
          this.addPoints(winner, points, `${phase} en paso`);
          this.state.roundResults.push({
            phase,
            winner,
            points,
            details: `${phase} ganado automáticamente`,
            isDeje: false
          });
        }
      }
    });
  }

  private getBestParesForTeam(team: 'A' | 'B'): { type: string, value: number } {
    const teamPlayers = this.state.players.filter(p => p.team === team && p.hasPares);
    let bestType = 'none';
    let bestValue = 0;
    
    teamPlayers.forEach(player => {
      const values = player.hand.map(c => c.musValue);
      const counts = values.reduce((acc, val) => {
        acc[val] = (acc[val] || 0) + 1;
        return acc;
      }, {} as Record<number, number>);
      
      const pairs = Object.entries(counts).filter(([_, count]) => count >= 2);
      
      for (const [value, count] of pairs) {
        const cardValue = parseInt(value);
        if (count === 4) {
          bestType = 'duples';
          bestValue = Math.max(bestValue, cardValue);
        } else if (count === 3 && bestType !== 'duples') {
          bestType = 'medias';
          bestValue = Math.max(bestValue, cardValue);
        } else if (count === 2 && !['duples', 'medias'].includes(bestType)) {
          bestType = 'pares';
          bestValue = Math.max(bestValue, cardValue);
        }
      }
      
      // Duples especiales (dos pares)
      if (pairs.length === 2 && pairs.every(([_, count]) => count === 2)) {
        bestType = 'duples';
        const values = pairs.map(([v, _]) => parseInt(v));
        bestValue = Math.max(...values);
      }
    });
    
    return { type: bestType, value: bestValue };
  }

  private teamHasJuego31(team: 'A' | 'B'): boolean {
    return this.state.players
      .filter(p => p.team === team)
      .some(p => {
        const total = p.hand.reduce((sum, card) => sum + card.musValue, 0);
        return total === 31;
      });
  }

  private getPhaseForBet(bet: BetAction): string {
    // Lógica simplificada - en un juego real necesitarías trackear mejor
    return this.state.phase;
  }

  private addPoints(team: 'A' | 'B', points: number, reason: string): void {
    if (team === 'A') {
      this.state.teamAScore += points;
    } else {
      this.state.teamBScore += points;
    }
    
    // Convertir piedras a amarracos
    this.convertToAmarracos();
    
    // Verificar "adentro" (35+ puntos)
    if (this.state.teamAScore >= 35 || this.state.teamBScore >= 35) {
      this.state.adentro = true;
      this.addDialogue('system', '¡Adentro!', 'adentro');
    }
    
    this.addDialogue('system', `Equipo ${team} gana ${points} piedra${points !== 1 ? 's' : ''} por ${reason}`, 'scoring');
  }

  private convertToAmarracos(): void {
    // Convertir piedras del equipo A
    if (this.state.teamAScore >= 5) {
      const newAmarracos = Math.floor(this.state.teamAScore / 5);
      this.state.teamAAmarracos += newAmarracos;
      this.state.teamAScore = this.state.teamAScore % 5;
    }
    
    // Convertir piedras del equipo B
    if (this.state.teamBScore >= 5) {
      const newAmarracos = Math.floor(this.state.teamBScore / 5);
      this.state.teamBAmarracos += newAmarracos;
      this.state.teamBScore = this.state.teamBScore % 5;
    }
  }

  private checkGameEnd(): void {
    if (this.state.teamAAmarracos >= 8) {
      this.state.phase = 'finished';
      this.addDialogue('system', '¡Equipo A gana la partida!', 'game-end');
    } else if (this.state.teamBAmarracos >= 8) {
      this.state.phase = 'finished';
      this.addDialogue('system', '¡Equipo B gana la partida!', 'game-end');
    }
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
    const currentIndex = this.state.players.findIndex(p => p.id === this.state.currentPlayer);
    const nextIndex = (currentIndex + 1) % this.state.players.length;
    this.state.currentPlayer = this.state.players[nextIndex].id;
  }

  private resetCurrentPlayer(): void {
    const manoPlayer = this.state.players.find(p => p.isMano);
    this.state.currentPlayer = manoPlayer?.id || this.state.players[0].id;
  }
}

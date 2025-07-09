import { GameState, Player, Card, RoundResult, GameDialogue } from '@/types/game';
import { createDeck, dealCards } from './cards';
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
      teamAScore: 0,
      teamBScore: 0,
      players,
      deck: createDeck(),
      musCount: 0,
      bets: {},
      roundResults: [],
      dialogues: [],
      senasEnabled: true
    };
  }

  getState(): GameState {
    return { ...this.state };
  }

  addDialogue(playerId: string, message: string, action: string): void {
    const dialogue: GameDialogue = {
      playerId,
      message,
      action,
      timestamp: Date.now()
    };
    
    this.state.dialogues.push(dialogue);
    
    // Mantener solo los últimos 10 diálogos
    if (this.state.dialogues.length > 10) {
      this.state.dialogues = this.state.dialogues.slice(-10);
    }
  }

  dealNewRound(): void {
    this.state.deck = createDeck();
    const { hands } = dealCards(this.state.deck, 4);
    
    this.state.players.forEach((player, index) => {
      player.hand = hands[index];
    });
    
    this.state.phase = 'mus';
    this.state.subPhase = 'mus-decision';
    this.state.musCount = 0;
    this.state.bets = {};
    this.state.currentBet = 0;
    this.state.dialogues = [];
    
    console.log('Nueva ronda iniciada. Manos repartidas.');
  }

  processMusPhase(): boolean {
    console.log('Procesando fase de mus...');
    
    this.state.phase = 'grande';
    this.state.subPhase = 'betting';
    this.resetCurrentPlayer();
    
    console.log('Mus cortado. Pasando a la fase de Grande.');
    return true;
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
    }, 5000);
  }

  discardCards(playerId: string, cardIndices: number[]): void {
    const player = this.state.players.find(p => p.id === playerId);
    if (!player) return;

    console.log(`${player.name} descarta cartas en posiciones:`, cardIndices);

    // Remover cartas seleccionadas
    const newHand = player.hand.filter((_, index) => !cardIndices.includes(index));
    
    // Dar nuevas cartas del mazo
    while (newHand.length < 4 && this.state.deck.length > 0) {
      newHand.push(this.state.deck.pop()!);
    }
    
    player.hand = newHand;
    console.log(`${player.name} nueva mano:`, newHand.map(c => c.name));
  }

  evaluateRound(phase: string): RoundResult {
    const teamAPlayers = this.state.players.filter(p => p.team === 'A');
    const teamBPlayers = this.state.players.filter(p => p.team === 'B');

    const teamABest = this.getBestHandForPhase(teamAPlayers, phase);
    const teamBBest = this.getBestHandForPhase(teamBPlayers, phase);

    let winner: 'A' | 'B' | 'tie' = 'tie';
    let points = 1; // Puntos base por ganar la ronda

    if (teamABest > teamBBest) {
      winner = 'A';
    } else if (teamBBest > teamABest) {
      winner = 'B';
    }

    // Aplicar puntos especiales por órdago
    if (this.state.currentBet >= 30) {
      points = 30; // Órdago vale 30 puntos
    } else if (this.state.currentBet >= 10) {
      points = this.state.currentBet;
    }

    return {
      phase,
      winner,
      points,
      details: `${phase}: Equipo ${winner} gana con ${winner === 'A' ? teamABest : teamBBest}`
    };
  }

  private getBestHandForPhase(players: Player[], phase: string): number {
    return Math.max(...players.map(player => {
      const hand = player.hand;
      
      switch (phase) {
        case 'grande':
          return Math.max(...hand.map(c => c.musValue));
        case 'chica':
          return 11 - Math.min(...hand.map(c => c.musValue));
        case 'pares':
          return this.evaluatePares(hand);
        case 'juego':
          return this.evaluateJuego(hand);
        default:
          return 0;
      }
    }));
  }

  private evaluatePares(hand: Card[]): number {
    const values = hand.map(c => c.musValue);
    const counts = values.reduce((acc, val) => {
      acc[val] = (acc[val] || 0) + 1;
      return acc;
    }, {} as Record<number, number>);
    
    const pairs = Object.values(counts).filter(count => count >= 2);
    if (pairs.length === 0) return 0;
    
    return pairs.reduce((sum, count) => {
      if (count === 4) return sum + 6; // Duples
      if (count === 3) return sum + 3; // Medias  
      if (count === 2) return sum + 1; // Pares
      return sum;
    }, 0);
  }

  private evaluateJuego(hand: Card[]): number {
    const total = hand.reduce((sum, card) => sum + card.musValue, 0);
    if (total >= 31) return total;
    return 0;
  }

  nextPhase(): void {
    const phases = ['grande', 'chica', 'pares', 'juego'];
    const currentIndex = phases.indexOf(this.state.phase);
    
    if (currentIndex < phases.length - 1) {
      this.state.phase = phases[currentIndex + 1] as any;
      this.state.subPhase = 'betting';
      this.state.bets = {};
      this.state.currentBet = 0;
      this.resetCurrentPlayer();
      console.log(`Pasando a la fase: ${this.state.phase}`);
    } else {
      this.finishRound();
    }
  }

  private finishRound(): void {
    console.log('Finalizando ronda...');
    
    const phases = ['grande', 'chica', 'pares', 'juego'];
    phases.forEach(phase => {
      const result = this.evaluateRound(phase);
      this.state.roundResults.push(result);
      
      if (result.winner === 'A') {
        this.state.teamAScore += result.points;
      } else if (result.winner === 'B') {
        this.state.teamBScore += result.points;
      }
      
      console.log(`${phase}: Equipo ${result.winner} gana ${result.points} puntos`);
    });

    if (this.state.teamAScore >= 40 || this.state.teamBScore >= 40) {
      this.state.phase = 'finished';
      console.log('¡Juego terminado!');
    } else {
      this.state.currentRound++;
      this.dealNewRound();
    }
  }

  processBotActions(): void {
    const currentPlayer = this.state.players.find(p => p.id === this.state.currentPlayer);
    if (!currentPlayer?.isBot) return;

    const bot = new MusBot(currentPlayer);

    try {
      if (this.state.subPhase === 'mus-decision') {
        const decision = bot.decideMus();
        const phrase = bot.getBotPhrase('mus');
        
        this.addDialogue(currentPlayer.id, phrase, 'mus');
        console.log(`${currentPlayer.name}: ${phrase} - ${decision}`);
        
        if (decision === 'no mus') {
          this.processMusPhase();
        } else {
          this.nextPlayer();
        }
      } else if (this.state.subPhase === 'betting') {
        const bet = bot.decideBet(this.state.phase);
        const phrase = bot.getBotPhrase('bet');
        
        this.addDialogue(currentPlayer.id, phrase, 'bet');
        console.log(`${currentPlayer.name}: ${phrase} - ${bet}`);
        
        this.state.bets[currentPlayer.id] = bet;
        
        if (bet === 'ordago') {
          this.state.currentBet = 40;
        } else if (bet === 'envido') {
          this.state.currentBet += 2;
        }
        
        const allBets = Object.keys(this.state.bets).length;
        if (allBets >= this.state.players.length) {
          this.nextPhase();
        } else {
          this.nextPlayer();
        }
      }
    } catch (error) {
      console.error('Error procesando acción del bot:', error);
      this.nextPlayer();
    }
  }

  nextPlayer(): void {
    const currentIndex = this.state.players.findIndex(p => p.id === this.state.currentPlayer);
    const nextIndex = (currentIndex + 1) % this.state.players.length;
    this.state.currentPlayer = this.state.players[nextIndex].id;
    
    console.log(`Turno pasa a: ${this.state.players[nextIndex].name}`);
  }

  private resetCurrentPlayer(): void {
    const manoPlayer = this.state.players.find(p => p.isMano);
    this.state.currentPlayer = manoPlayer?.id || this.state.players[0].id;
  }
}

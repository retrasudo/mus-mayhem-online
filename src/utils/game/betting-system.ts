import { GameState, BetAction } from '@/types/game';
import { ScoringSystem } from './scoring-logic';

export class BettingSystem {
  static placeBet(state: GameState, playerId: string, bet: BetAction): void {
    state.bets[playerId] = bet;
    state.betHistory.push(bet);

    switch (bet.type) {
      case 'paso':
        BettingSystem.handlePaso(state, playerId);
        break;
      case 'envido':
        const amount = bet.amount || 2;
        state.currentBet += amount;
        state.currentBetType = 'envido';
        state.lastBetPlayer = playerId;
        state.waitingForResponse = true;
        BettingSystem.nextPlayer(state);
        break;
      case 'echo-mas':
        state.currentBet += 2;
        state.lastBetPlayer = playerId;
        BettingSystem.nextPlayer(state);
        break;
      case 'ordago':
        state.currentBet = 40;
        state.currentBetType = 'ordago';
        state.lastBetPlayer = playerId;
        state.waitingForResponse = true;
        BettingSystem.nextPlayer(state);
        break;
      case 'quiero':
        BettingSystem.handleQuiero(state);
        break;
      case 'no-quiero':
        BettingSystem.handleNoQuiero(state);
        break;
    }
  }

  private static handlePaso(state: GameState, playerId: string): void {
    // Si todos pasan en una fase, se gana 1 piedra al mejor
    const allPassed = BettingSystem.checkAllPassed(state);
    if (allPassed) {
      BettingSystem.resolvePhaseWithoutBets(state);
    } else {
      BettingSystem.nextPlayer(state);
    }
  }

  private static handleQuiero(state: GameState): void {
    if (state.currentBetType === 'ordago') {
      // Órdago aceptado - se decide la partida
      BettingSystem.resolveOrdago(state);
    } else {
      // Envido aceptado - continuar a la siguiente fase
      // Logic handled by game engine
    }
  }

  private static handleNoQuiero(state: GameState): void {
    // El equipo que apostó gana 1 piedra (deje)
    const betPlayer = state.players.find(p => p.id === state.lastBetPlayer);
    if (betPlayer) {
      ScoringSystem.addPoints(state, betPlayer.team, 1, 'deje');
    }
  }

  private static checkAllPassed(state: GameState): boolean {
    const activePlayers = BettingSystem.getActivePlayers(state);
    return activePlayers.every(p => state.bets[p.id]?.type === 'paso');
  }

  private static getActivePlayers(state: GameState) {
    switch (state.phase) {
      case 'pares':
        return state.players.filter(p => p.hasPares);
      case 'juego':
        return state.players.filter(p => p.hasJuego);
      case 'punto':
        return state.players.filter(p => !p.hasJuego);
      default:
        return state.players;
    }
  }

  private static resolvePhaseWithoutBets(state: GameState): void {
    const winner = ScoringSystem.determinePhaseWinner(state);
    if (winner) {
      ScoringSystem.addPoints(state, winner, 1, `${state.phase} en paso`);
    }
  }

  private static resolveOrdago(state: GameState): void {
    const winner = ScoringSystem.determinePhaseWinner(state);
    if (winner) {
      // El ganador del órdago gana toda la partida
      if (winner === 'A') {
        state.teamAAmarracos = 8;
      } else {
        state.teamBAmarracos = 8;
      }
      state.phase = 'finished';
    }
  }

  private static nextPlayer(state: GameState): void {
    const currentIndex = state.players.findIndex(p => p.id === state.currentPlayer);
    const nextIndex = (currentIndex + 1) % state.players.length;
    state.currentPlayer = state.players[nextIndex].id;
  }
}
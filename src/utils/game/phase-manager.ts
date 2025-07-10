import { GameState } from '@/types/game';
import { ScoringSystem } from './scoring-logic';

export class PhaseManager {
  static nextPhase(state: GameState): void {
    const phases = ['grande', 'chica', 'pares', 'juego', 'punto'];
    let currentIndex = phases.indexOf(state.phase);
    
    // Saltar fases que no aplican
    while (currentIndex < phases.length - 1) {
      currentIndex++;
      const nextPhase = phases[currentIndex];
      
      // Verificar si la fase es aplicable
      if (nextPhase === 'pares') {
        // Solo si hay jugadores con pares
        if (!state.players.some(p => p.hasPares)) {
          continue;
        }
        // Los jugadores deben declarar si tienen pares
        PhaseManager.announcePlayersWithPares(state);
      }
      
      if (nextPhase === 'juego') {
        // Solo si hay jugadores con juego
        if (!state.players.some(p => p.hasJuego)) {
          continue;
        }
        // Los jugadores deben declarar si tienen juego
        PhaseManager.announcePlayersWithJuego(state);
      }
      
      if (nextPhase === 'punto') {
        // Solo si NO hay jugadores con juego
        if (state.players.some(p => p.hasJuego)) {
          continue;
        }
      }
      
      state.phase = nextPhase as any;
      state.subPhase = 'betting';
      state.bets = {};
      state.betHistory = [];
      state.currentBet = 0;
      state.currentBetType = null;
      state.waitingForResponse = false;
      PhaseManager.resetCurrentPlayer(state);
      console.log(`Pasando a la fase: ${state.phase}`);
      return;
    }
    
    // No quedan más fases, terminar la mano
    PhaseManager.finishHand(state);
  }

  static startBettingPhase(state: GameState): void {
    state.phase = 'grande';
    state.subPhase = 'betting';
    state.bets = {};
    state.betHistory = [];
    state.currentBet = 0;
    state.waitingForResponse = false;
    PhaseManager.resetCurrentPlayer(state);
    console.log('Iniciando fase de apuestas: Grande');
  }

  static finishHand(state: GameState): void {
    state.phase = 'scoring';
    state.subPhase = 'revealing';
    
    // Resolver todas las apuestas aceptadas
    ScoringSystem.resolveAllBets(state);
    
    // Verificar si algún equipo ha ganado
    ScoringSystem.checkGameEnd(state);
    
    // Preparar siguiente mano se hace desde el engine principal
  }

  private static announcePlayersWithPares(state: GameState): void {
    state.players.forEach(player => {
      // Announcement logic handled by dialogue system in main engine
    });
  }

  private static announcePlayersWithJuego(state: GameState): void {
    state.players.forEach(player => {
      // Announcement logic handled by dialogue system in main engine
    });
  }

  static resetCurrentPlayer(state: GameState): void {
    const manoPlayer = state.players.find(p => p.isMano);
    state.currentPlayer = manoPlayer?.id || state.players[0].id;
  }

  static nextPlayer(state: GameState): void {
    const currentIndex = state.players.findIndex(p => p.id === state.currentPlayer);
    const nextIndex = (currentIndex + 1) % state.players.length;
    state.currentPlayer = state.players[nextIndex].id;
  }
}
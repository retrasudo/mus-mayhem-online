import { GameState, RoundResult } from '@/types/game';
import { CardEvaluator } from './card-evaluation';

export class ScoringSystem {
  static addPoints(state: GameState, team: 'A' | 'B', points: number, reason: string): void {
    if (team === 'A') {
      state.teamAScore += points;
    } else {
      state.teamBScore += points;
    }
    
    // Convertir piedras a amarracos
    ScoringSystem.convertToAmarracos(state);
    
    // Verificar "adentro" (35+ puntos)
    if (state.teamAScore >= 35 || state.teamBScore >= 35) {
      state.adentro = true;
    }
  }

  static convertToAmarracos(state: GameState): void {
    // Convertir piedras del equipo A
    if (state.teamAScore >= 5) {
      const newAmarracos = Math.floor(state.teamAScore / 5);
      state.teamAAmarracos += newAmarracos;
      state.teamAScore = state.teamAScore % 5;
    }
    
    // Convertir piedras del equipo B
    if (state.teamBScore >= 5) {
      const newAmarracos = Math.floor(state.teamBScore / 5);
      state.teamBAmarracos += newAmarracos;
      state.teamBScore = state.teamBScore % 5;
    }
  }

  static checkGameEnd(state: GameState): boolean {
    if (state.teamAAmarracos >= 8) {
      state.phase = 'finished';
      return true;
    } else if (state.teamBAmarracos >= 8) {
      state.phase = 'finished';
      return true;
    }
    return false;
  }

  static determinePhaseWinner(state: GameState): 'A' | 'B' | null {
    const teamAPlayers = state.players.filter(p => p.team === 'A');
    const teamBPlayers = state.players.filter(p => p.team === 'B');

    const teamABest = CardEvaluator.getBestHandForPhase(teamAPlayers, state.phase);
    const teamBBest = CardEvaluator.getBestHandForPhase(teamBPlayers, state.phase);

    if (teamABest > teamBBest) return 'A';
    if (teamBBest > teamABest) return 'B';
    return null;
  }

  static resolveAllBets(state: GameState): void {
    // Resolver fases automáticamente si nadie apostó
    const phases = ['grande', 'chica', 'pares', 'juego', 'punto'];
    
    phases.forEach(phase => {
      const phaseHadActivity = state.roundResults.some(r => r.phase === phase);
      if (!phaseHadActivity) {
        // Nadie apostó en esta fase, dar 1 piedra al mejor
        const tempPhase = state.phase;
        state.phase = phase as any;
        const winner = ScoringSystem.determinePhaseWinner(state);
        state.phase = tempPhase;
        
        if (winner) {
          let points = 1;
          // Puntos especiales según la fase
          if (phase === 'pares') {
            const teamABest = CardEvaluator.getBestParesForTeam(state.players, 'A');
            const teamBBest = CardEvaluator.getBestParesForTeam(state.players, 'B');
            if (teamABest.type === 'duples' || teamBBest.type === 'duples') points = 3;
            else if (teamABest.type === 'medias' || teamBBest.type === 'medias') points = 2;
          } else if (phase === 'juego') {
            points = 2; // Juego básico
            // Si es juego de 31, son 3 puntos
            const teamAHas31 = CardEvaluator.teamHasJuego31(state.players, 'A');
            const teamBHas31 = CardEvaluator.teamHasJuego31(state.players, 'B');
            if (teamAHas31 || teamBHas31) points = 3;
          }
          
          ScoringSystem.addPoints(state, winner, points, `${phase} en paso`);
          state.roundResults.push({
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
}
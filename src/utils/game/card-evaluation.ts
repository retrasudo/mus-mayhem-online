import { Card, Player } from '@/types/game';
import { getCardOrder } from '../cards';

export class CardEvaluator {
  static checkPares(hand: Card[]): boolean {
    const values = hand.map(c => c.musValue);
    const counts = values.reduce((acc, val) => {
      acc[val] = (acc[val] || 0) + 1;
      return acc;
    }, {} as Record<number, number>);
    
    return Object.values(counts).some(count => count >= 2);
  }

  static checkJuego(hand: Card[]): boolean {
    const total = hand.reduce((sum, card) => sum + card.musValue, 0);
    return total >= 31;
  }

  static calculatePunto(hand: Card[]): number {
    return hand.reduce((sum, card) => sum + card.musValue, 0);
  }

  static evaluateParesValue(hand: Card[]): number {
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

  static evaluateJuegoValue(hand: Card[]): number {
    const total = hand.reduce((sum, card) => sum + card.musValue, 0);
    if (total < 31) return 0; // No tiene juego
    if (total === 31) return 1000; // Mejor juego posible
    if (total === 32) return 999;  // Segundo mejor
    if (total === 40) return 998;  // Tercero (salta a 40)
    if (total >= 37 && total <= 39) return 1001 - total; // 39, 38, 37
    if (total >= 33 && total <= 36) return 1040 - total; // 36, 35, 34, 33
    return total; // Otros casos
  }

  static getBestHandForPhase(players: Player[], phase: string): number {
    return Math.max(...players.map(player => {
      const hand = player.hand;
      
      switch (phase) {
        case 'grande':
          return Math.max(...hand.map((c: Card) => getCardOrder(c.value)));
        case 'chica':
          return 13 - Math.min(...hand.map((c: Card) => getCardOrder(c.value)));
        case 'pares':
          return CardEvaluator.evaluateParesValue(hand);
        case 'juego':
          return CardEvaluator.evaluateJuegoValue(hand);
        case 'punto':
          const total = hand.reduce((sum: number, card: Card) => sum + card.musValue, 0);
          return total >= 31 ? 0 : total; // Solo si no tiene juego
        default:
          return 0;
      }
    }));
  }

  static getBestParesForTeam(players: Player[], team: 'A' | 'B'): { type: string, value: number } {
    const teamPlayers = players.filter((p: any) => p.team === team && p.hasPares);
    let bestType = 'none';
    let bestValue = 0;
    
    teamPlayers.forEach((player: any) => {
      const values = player.hand.map((c: Card) => c.musValue);
      const counts = values.reduce((acc, val) => {
        acc[val] = (acc[val] || 0) + 1;
        return acc;
      }, {} as Record<number, number>);
      
      const pairs = Object.entries(counts).filter(([_, count]) => (count as number) >= 2);
      
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

  static teamHasJuego31(players: Player[], team: 'A' | 'B'): boolean {
    return players
      .filter((p: any) => p.team === team)
      .some((p: any) => {
        const total = p.hand.reduce((sum: number, card: Card) => sum + card.musValue, 0);
        return total === 31;
      });
  }
}
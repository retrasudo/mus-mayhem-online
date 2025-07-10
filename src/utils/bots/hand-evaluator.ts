import { Player } from '@/types/game';

export class HandEvaluator {
  constructor(private player: Player) {}

  evaluateHand(phase: string): number {
    const hand = this.player.hand;
    
    switch (phase) {
      case 'grande':
        return Math.max(...hand.map(c => c.musValue));
      case 'chica':
        return 11 - Math.min(...hand.map(c => c.musValue));
      case 'pares':
        return this.evaluatePares();
      case 'juego':
        return this.evaluateJuego();
      case 'punto':
        return this.player.punto || 0;
      default:
        return 0;
    }
  }

  evaluatePares(): number {
    const values = this.player.hand.map(c => c.musValue);
    const counts = values.reduce((acc, val) => {
      acc[val] = (acc[val] || 0) + 1;
      return acc;
    }, {} as Record<number, number>);
    
    const pairs = Object.values(counts).filter(count => count >= 2);
    if (pairs.length === 0) return 0;
    
    // Duples = 2, Medias = 1, Pares = 0.5
    return pairs.reduce((sum, count) => {
      if (count === 4) return sum + 3; // Duples
      if (count === 3) return sum + 2; // Medias
      if (count === 2) return sum + 1; // Pares
      return sum;
    }, 0);
  }

  evaluateJuego(): number {
    const total = this.player.hand.reduce((sum, card) => sum + card.musValue, 0);
    if (total >= 31) return total - 30; // Juego
    if (total >= 30) return 0.5; // Punto alto
    return 0; // No tiene juego
  }

  evaluateGeneralStrength(): number {
    const grande = this.evaluateHand('grande');
    const chica = this.evaluateHand('chica');
    const pares = this.evaluateHand('pares');
    const juego = this.evaluateHand('juego');
    
    return (grande + chica + pares * 2 + juego * 3) / 4;
  }
}
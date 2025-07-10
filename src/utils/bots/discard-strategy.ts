import { Player } from '@/types/game';

export class DiscardStrategy {
  constructor(private player: Player) {}

  selectCardsToDiscard(): number[] {
    const hand = this.player.hand;
    const toDiscard: number[] = [];
    
    // Estrategia mejorada: evaluar qué cartas son menos útiles
    const cardScores = hand.map((card, index) => {
      let score = 0;
      
      // Penalizar cartas mediocres
      if (card.musValue >= 4 && card.musValue <= 6) {
        score -= 2;
      }
      
      // Valorar cartas altas para grande
      if (card.musValue === 10) {
        score += 2;
      }
      
      // Valorar cartas bajas para chica
      if (card.musValue === 1) {
        score += 2;
      }
      
      // Valorar cartas que forman pares
      const sameValues = hand.filter(c => c.musValue === card.musValue).length;
      if (sameValues > 1) {
        score += sameValues;
      }
      
      return { index, score };
    });
    
    // Descartar las cartas con peor puntuación
    const sortedCards = cardScores.sort((a, b) => a.score - b.score);
    const numToDiscard = Math.min(Math.floor(Math.random() * 3) + 1, 4);
    
    for (let i = 0; i < numToDiscard; i++) {
      toDiscard.push(sortedCards[i].index);
    }
    
    return toDiscard;
  }
}
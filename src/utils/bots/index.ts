import { Player, BetAction } from '@/types/game';
import { HandEvaluator } from './hand-evaluator';
import { PersonalityModifiers } from './personality-modifiers';
import { DiscardStrategy } from './discard-strategy';
import { getBotPhrase } from './bot-phrases';

export class MusBot {
  private handEvaluator: HandEvaluator;
  private personalityModifiers: PersonalityModifiers;
  private discardStrategy: DiscardStrategy;

  constructor(public player: Player) {
    this.handEvaluator = new HandEvaluator(player);
    this.personalityModifiers = new PersonalityModifiers(player);
    this.discardStrategy = new DiscardStrategy(player);
  }

  decideMus(): 'mus' | 'no-mus' {
    const stats = this.player.stats!;
    
    // Evaluar mano actual
    const handStrength = this.handEvaluator.evaluateGeneralStrength();
    const hasGoodPairs = this.handEvaluator.evaluatePares() > 3;
    const hasGoodJuego = this.handEvaluator.evaluateJuego() > 5;
    const hasGoodGrande = this.handEvaluator.evaluateHand('grande') > 8;
    const hasGoodChica = this.handEvaluator.evaluateHand('chica') > 8;
    
    // Personalidades específicas con variabilidad
    if (this.player.name === 'Pato') {
      // Pato es muy aleatorio
      return Math.random() > 0.6 ? 'mus' : 'no-mus';
    }
    
    if (this.player.name === 'Vasco') {
      // Vasco es osado pero inteligente
      if (stats.osadia >= 8 && handStrength > 4) {
        return Math.random() > 0.7 ? 'no-mus' : 'mus';
      }
      return Math.random() > 0.4 ? 'mus' : 'no-mus';
    }
    
    if (this.player.name === 'Xosé Roberto') {
      // Gallego prudente y calculador
      if (hasGoodPairs || hasGoodJuego) {
        return 'no-mus';
      }
      return Math.random() > 0.8 ? 'no-mus' : 'mus';
    }
    
    if (this.player.name === 'La Zaray') {
      // La Zaray es impredecible y farolera
      if (stats.faroleo >= 7) {
        return Math.random() > 0.5 ? 'no-mus' : 'mus';
      }
    }
    
    if (this.player.name === 'Chigga') {
      // Chigga es agresivo
      if (handStrength > 3) {
        return Math.random() > 0.6 ? 'no-mus' : 'mus';
      }
    }
    
    // Si tiene una mano muy buena, tendencia a cortar mus
    if (hasGoodPairs || hasGoodJuego || (hasGoodGrande && hasGoodChica)) {
      return Math.random() > 0.3 ? 'no-mus' : 'mus';
    }
    
    // Lógica general con variabilidad
    const cortarMusChance = stats.cortarMus / 10;
    const handQualityFactor = handStrength / 10;
    const finalChance = cortarMusChance + handQualityFactor + (Math.random() - 0.5) * 0.4;
    
    return finalChance > 0.6 ? 'no-mus' : 'mus';
  }

  decideBet(phase: string, currentBet: number, waitingForResponse: boolean): BetAction {
    const stats = this.player.stats!;
    
    // Si estamos esperando respuesta a una apuesta, decidir quiero/no quiero
    if (waitingForResponse && currentBet > 0) {
      return this.decideResponse(phase, currentBet);
    }
    
    // Evaluar la mano para esta fase
    let handValue = this.handEvaluator.evaluateHand(phase);
    
    // Aplicar modificadores de personalidad
    handValue = this.personalityModifiers.applyLuck(handValue);
    handValue = this.personalityModifiers.applyBluff(handValue);
    handValue = this.personalityModifiers.applyThinking(handValue);
    
    // Personalidades específicas con mayor variabilidad
    if (this.player.name === 'Pato') {
      // Pato es completamente aleatorio
      const randomChoice = Math.random();
      if (randomChoice < 0.4) return { type: 'paso', playerId: this.player.id };
      if (randomChoice < 0.7) return { type: 'envido', playerId: this.player.id, amount: 2 };
      return { type: 'ordago', playerId: this.player.id };
    }
    
    if (this.player.name === 'Vasco') {
      // Vasco ama el órdago pero no siempre
      if (stats.osadia >= 8 && handValue > 4 && Math.random() < 0.4) {
        return { type: 'ordago', playerId: this.player.id };
      }
      if (handValue > 5 && Math.random() < 0.6) {
        return { type: 'envido', playerId: this.player.id, amount: 2 };
      }
    }
    
    if (this.player.name === 'La Zaray') {
      // La Zaray farolea mucho
      if (stats.faroleo >= 7 && Math.random() < 0.4) {
        handValue += 3; // Faroleo boost
      }
      if (handValue > 6 && Math.random() < 0.3) {
        return { type: 'ordago', playerId: this.player.id };
      }
    }
    
    if (this.player.name === 'Judío') {
      // El Judío es calculador pero optimista
      if (handValue > 5 && Math.random() < 0.7) {
        return { type: 'envido', playerId: this.player.id, amount: 2 };
      }
      if (handValue > 7 && Math.random() < 0.3) {
        return { type: 'ordago', playerId: this.player.id };
      }
    }
    
    if (this.player.name === 'Chigga') {
      // Chigga es agresivo pero inconsistente
      if (handValue > 3 && Math.random() < 0.5) {
        const aggressive = Math.random() < 0.6;
        return aggressive 
          ? { type: 'ordago', playerId: this.player.id }
          : { type: 'envido', playerId: this.player.id, amount: 2 };
      }
    }
    
    if (this.player.name === 'Xosé Roberto') {
      // Xosé Roberto es muy prudente
      if (handValue < 4) {
        return { type: 'paso', playerId: this.player.id };
      }
      if (handValue > 7 && Math.random() < 0.8) {
        return { type: 'envido', playerId: this.player.id, amount: 2 };
      }
    }
    
    if (this.player.name === 'Duende Verde') {
      // Duende Verde es misterioso y cambiante
      const mood = Math.random();
      if (mood < 0.3) {
        // Conservador
        return handValue > 6 ? { type: 'envido', playerId: this.player.id, amount: 2 } : { type: 'paso', playerId: this.player.id };
      } else if (mood < 0.7) {
        // Normal
        if (handValue > 5) return { type: 'envido', playerId: this.player.id, amount: 2 };
      } else {
        // Agresivo
        if (handValue > 4) return { type: 'ordago', playerId: this.player.id };
      }
    }
    
    // Lógica general con más variabilidad
    const randomFactor = (Math.random() - 0.5) * 3; // ±1.5 points
    const adjustedValue = handValue + randomFactor;
    
    if (adjustedValue >= 9 && Math.random() < 0.7) {
      return { type: 'ordago', playerId: this.player.id };
    } else if (adjustedValue >= 6 && Math.random() < 0.8) {
      return { type: 'envido', playerId: this.player.id, amount: 2 };
    } else if (adjustedValue >= 3 && Math.random() < 0.5) {
      return { type: 'envido', playerId: this.player.id, amount: 2 };
    } else {
      return { type: 'paso', playerId: this.player.id };
    }
  }

  private decideResponse(phase: string, currentBet: number): BetAction {
    const handValue = this.handEvaluator.evaluateHand(phase);
    const stats = this.player.stats!;
    
    // Aplicar personalidad a la respuesta
    let adjustedValue = handValue;
    
    if (this.player.name === 'Vasco') {
      adjustedValue += stats.osadia / 5; // Vasco más valiente
    }
    
    if (this.player.name === 'La Zaray') {
      if (Math.random() < 0.3) adjustedValue += 2; // Faroleo ocasional
    }
    
    if (this.player.name === 'Xosé Roberto') {
      adjustedValue -= 1; // Más conservador
    }
    
    if (this.player.name === 'Pato') {
      adjustedValue = Math.random() * 10; // Completamente aleatorio
    }
    
    // Añadir factor aleatorio
    adjustedValue += (Math.random() - 0.5) * 2;
    
    if (currentBet >= 40) {
      // Es un órdago
      const acceptChance = Math.max(0, Math.min(1, (adjustedValue - 5) / 5));
      return Math.random() < acceptChance
        ? { type: 'quiero', playerId: this.player.id } 
        : { type: 'no-quiero', playerId: this.player.id };
    } else {
      // Es un envido
      if (adjustedValue >= 8 && Math.random() < 0.6) {
        return { type: 'echo-mas', playerId: this.player.id };
      } else if (adjustedValue >= 4 && Math.random() < 0.7) {
        return { type: 'quiero', playerId: this.player.id };
      } else {
        return { type: 'no-quiero', playerId: this.player.id };
      }
    }
  }

  selectCardsToDiscard(): number[] {
    return this.discardStrategy.selectCardsToDiscard();
  }

  getBotPhrase(action: string): string {
    return getBotPhrase(this.player.name, action);
  }
}

// Re-export for convenience
export { BOT_STATS } from './bot-stats';
export { BOT_CHARACTERS } from './bot-characters';
export { getBotPhrase } from './bot-phrases';
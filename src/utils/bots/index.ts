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
    const cortarMus = stats.cortarMus;
    
    // Personalidad específica
    if (this.player.name === 'Pato') {
      return Math.random() > 0.5 ? 'mus' : 'no-mus';
    }
    
    // Evaluar mano actual
    const handStrength = this.handEvaluator.evaluateGeneralStrength();
    const hasGoodPairs = this.handEvaluator.evaluatePares() > 3;
    const hasGoodJuego = this.handEvaluator.evaluateJuego() > 5;
    const hasGoodGrande = this.handEvaluator.evaluateHand('grande') > 8;
    const hasGoodChica = this.handEvaluator.evaluateHand('chica') > 8;
    
    // Si tiene una mano muy buena, cortar mus
    if (hasGoodPairs || hasGoodJuego || (hasGoodGrande && hasGoodChica)) {
      return 'no-mus';
    }
    
    // Lógica de cortar mus basada en estadísticas
    if (cortarMus >= 8) return 'no-mus';
    
    if (cortarMus >= 5 && handStrength > 6) return 'no-mus';
    
    // Personajes específicos
    if (this.player.name === 'Xosé Roberto' && cortarMus >= 7) {
      return 'no-mus'; // Gallego prudente
    }
    
    if (this.player.name === 'Vasco' && stats.osadia >= 8) {
      return Math.random() > 0.3 ? 'no-mus' : 'mus'; // Más propenso a cortar por osadía
    }
    
    return 'mus';
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
    
    // Personalidades específicas
    if (this.player.name === 'Pato') {
      const options = ['paso', 'envido', 'ordago'] as const;
      const choice = options[Math.floor(Math.random() * options.length)];
      return { type: choice, playerId: this.player.id, amount: choice === 'envido' ? 2 : undefined };
    }
    
    if (this.player.name === 'Vasco' && stats.osadia >= 8) {
      if (handValue > 3 && Math.random() < 0.7) {
        return { type: 'ordago', playerId: this.player.id };
      }
    }
    
    if (this.player.name === 'La Zaray' && stats.faroleo >= 7) {
      // La Zaray puede intentar hacer trampas o farolear
      if (Math.random() < 0.3) {
        handValue += 3; // Faroleo
      }
    }
    
    if (this.player.name === 'Judío' && stats.suerte >= 8) {
      // El Judío confía en la providencia
      if (handValue > 4) {
        return { type: 'envido', playerId: this.player.id, amount: 2 };
      }
    }
    
    // Chigga es agresivo pero impredecible
    if (this.player.name === 'Chigga' && stats.osadia >= 7) {
      if (handValue > 2 && Math.random() < 0.4) {
        return { type: 'ordago', playerId: this.player.id };
      }
    }
    
    // Xosé Roberto es más calculador
    if (this.player.name === 'Xosé Roberto' && stats.pensarAntes >= 8) {
      if (handValue < 5) {
        return { type: 'paso', playerId: this.player.id };
      }
    }
    
    // Lógica general de apuestas
    if (handValue >= 9) {
      return { type: 'ordago', playerId: this.player.id };
    } else if (handValue >= 6) {
      return { type: 'envido', playerId: this.player.id, amount: 2 };
    } else if (handValue >= 3) {
      return { type: 'envido', playerId: this.player.id, amount: 2 };
    } else {
      return { type: 'paso', playerId: this.player.id };
    }
  }

  private decideResponse(phase: string, currentBet: number): BetAction {
    const handValue = this.handEvaluator.evaluateHand(phase);
    const stats = this.player.stats!;
    
    // Aplicar osadía a la decisión
    const adjustedValue = handValue + (stats.osadia / 10) * 2;
    
    if (currentBet >= 40) {
      // Es un órdago
      return adjustedValue >= 7 ? 
        { type: 'quiero', playerId: this.player.id } : 
        { type: 'no-quiero', playerId: this.player.id };
    } else {
      // Es un envido
      if (adjustedValue >= 8) {
        return { type: 'echo-mas', playerId: this.player.id };
      } else if (adjustedValue >= 5) {
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
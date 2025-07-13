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
    
    // Sistema de probabilidades basado en estadísticas
    const faroleoLevel = stats.faroleo / 10; // 0-1
    const osadiaLevel = stats.osadia / 10; // 0-1
    const suerte = Math.random(); // Factor aleatorio
    
    // Personalidades específicas con probabilidades más realistas
    if (this.player.name === 'Pato') {
      // Pato: Muy aleatorio, 35% paso, 40% envido, 25% órdago
      const choice = Math.random();
      if (choice < 0.35) return { type: 'paso', playerId: this.player.id };
      if (choice < 0.75) return { type: 'envido', playerId: this.player.id, amount: 2 };
      return { type: 'ordago', playerId: this.player.id };
    }
    
    if (this.player.name === 'Vasco') {
      // Vasco: Alto faroleo (12% órdago, 36% envido, 52% paso)
      if (handValue > 6 && suerte < 0.12) {
        return { type: 'ordago', playerId: this.player.id };
      }
      if (handValue > 4 && suerte < 0.48) { // 36% adicional
        return { type: 'envido', playerId: this.player.id, amount: 2 };
      }
      return { type: 'paso', playerId: this.player.id };
    }
    
    if (this.player.name === 'La Zaray') {
      // La Zaray: Muy farolera (15% órdago, 45% envido, 40% paso)
      const bluffBoost = faroleoLevel > 0.7 ? 2 : 0;
      if ((handValue + bluffBoost) > 5 && suerte < 0.15) {
        return { type: 'ordago', playerId: this.player.id };
      }
      if ((handValue + bluffBoost) > 3 && suerte < 0.60) { // 45% adicional
        return { type: 'envido', playerId: this.player.id, amount: 2 };
      }
      return { type: 'paso', playerId: this.player.id };
    }
    
    if (this.player.name === 'Judío') {
      // Judío: Calculador (8% órdago, 42% envido, 50% paso)
      if (handValue > 7 && suerte < 0.08) {
        return { type: 'ordago', playerId: this.player.id };
      }
      if (handValue > 5 && suerte < 0.50) { // 42% adicional
        return { type: 'envido', playerId: this.player.id, amount: 2 };
      }
      return { type: 'paso', playerId: this.player.id };
    }
    
    if (this.player.name === 'Chigga') {
      // Chigga: Agresivo (18% órdago, 32% envido, 50% paso)
      if (handValue > 4 && suerte < 0.18) {
        return { type: 'ordago', playerId: this.player.id };
      }
      if (handValue > 3 && suerte < 0.50) { // 32% adicional
        return { type: 'envido', playerId: this.player.id, amount: 2 };
      }
      return { type: 'paso', playerId: this.player.id };
    }
    
    if (this.player.name === 'Xosé Roberto') {
      // Xosé Roberto: Muy prudente (5% órdago, 25% envido, 70% paso)
      if (handValue > 8 && suerte < 0.05) {
        return { type: 'ordago', playerId: this.player.id };
      }
      if (handValue > 6 && suerte < 0.30) { // 25% adicional
        return { type: 'envido', playerId: this.player.id, amount: 2 };
      }
      return { type: 'paso', playerId: this.player.id };
    }
    
    if (this.player.name === 'Duende Verde') {
      // Duende Verde: Variable según su "humor" (10% órdago, 35% envido, 55% paso)
      const mood = Math.random();
      let ordagoChance = 0.10;
      let envidoChance = 0.35;
      
      if (mood < 0.3) { // Humor conservador
        ordagoChance = 0.05;
        envidoChance = 0.20;
      } else if (mood > 0.7) { // Humor agresivo
        ordagoChance = 0.20;
        envidoChance = 0.50;
      }
      
      if (handValue > 5 && suerte < ordagoChance) {
        return { type: 'ordago', playerId: this.player.id };
      }
      if (handValue > 4 && suerte < (ordagoChance + envidoChance)) {
        return { type: 'envido', playerId: this.player.id, amount: 2 };
      }
      return { type: 'paso', playerId: this.player.id };
    }
    
    // Lógica general basada en estadísticas
    let ordagoChance = (osadiaLevel * 0.15) + (faroleoLevel * 0.10);
    let envidoChance = 0.35 + (osadiaLevel * 0.10);
    
    // Ajustar según calidad de la mano
    if (handValue < 3) {
      ordagoChance *= 0.2;
      envidoChance *= 0.3;
    } else if (handValue > 7) {
      ordagoChance *= 2;
      envidoChance *= 1.5;
    }
    
    if (suerte < ordagoChance && handValue > 4) {
      return { type: 'ordago', playerId: this.player.id };
    } else if (suerte < (ordagoChance + envidoChance) && handValue > 2) {
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
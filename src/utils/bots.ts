
import { BotStats, Card, Player } from '@/types/game';

export const BOT_STATS: Record<string, BotStats> = {
  'Chigga': {
    osadia: 8,
    faroleo: 6,
    suerte: 5,
    cortarMus: 3,
    cazarSenas: 2,
    pensarAntes: 2,
    limpieza: 3,
    juegaGPJ: 6,
    juegaChica: 4
  },
  'Xosé Roberto': {
    osadia: 5,
    faroleo: 3,
    suerte: 6,
    cortarMus: 9,
    cazarSenas: 8,
    pensarAntes: 9,
    limpieza: 9,
    juegaGPJ: 8,
    juegaChica: 3
  },
  'La Zaray': {
    osadia: 9,
    faroleo: 7,
    suerte: 6,
    cortarMus: 4,
    cazarSenas: 5,
    pensarAntes: 4,
    limpieza: 2,
    juegaGPJ: 7,
    juegaChica: 4
  },
  'Pato': {
    osadia: Math.floor(Math.random() * 10) + 1,
    faroleo: Math.floor(Math.random() * 10) + 1,
    suerte: Math.floor(Math.random() * 10) + 1,
    cortarMus: Math.floor(Math.random() * 10) + 1,
    cazarSenas: Math.floor(Math.random() * 10) + 1,
    pensarAntes: Math.floor(Math.random() * 10) + 1,
    limpieza: Math.floor(Math.random() * 10) + 1,
    juegaGPJ: Math.floor(Math.random() * 10) + 1,
    juegaChica: Math.floor(Math.random() * 10) + 1
  },
  'Duende Verde': {
    osadia: 6,
    faroleo: 3,
    suerte: 6,
    cortarMus: 6,
    cazarSenas: 5,
    pensarAntes: 6,
    limpieza: 7,
    juegaGPJ: 6,
    juegaChica: 5
  },
  'Judío': {
    osadia: 7,
    faroleo: 4,
    suerte: 9,
    cortarMus: 6,
    cazarSenas: 5,
    pensarAntes: 6,
    limpieza: 10,
    juegaGPJ: 8,
    juegaChica: 2
  },
  'Vasco': {
    osadia: 9,
    faroleo: 9,
    suerte: 7,
    cortarMus: 7,
    cazarSenas: 4,
    pensarAntes: 3,
    limpieza: 5,
    juegaGPJ: 9,
    juegaChica: 1
  },
  'Policía': {
    osadia: 4,
    faroleo: 2,
    suerte: 4,
    cortarMus: 8,
    cazarSenas: 7,
    pensarAntes: 8,
    limpieza: 10,
    juegaGPJ: 7,
    juegaChica: 3
  },
  'Evaristo': {
    osadia: 5,
    faroleo: 4,
    suerte: 5,
    cortarMus: 9,
    cazarSenas: 10,
    pensarAntes: 7,
    limpieza: 9,
    juegaGPJ: 8,
    juegaChica: 4
  }
};

export const BOT_CHARACTERS = [
  { id: 'chigga', name: 'Chigga', avatar: '🐵', phrase: '"Unga unga mus"' },
  { id: 'xose', name: 'Xosé Roberto', avatar: '🧓🏻', phrase: '"¡Caldereta pura!"' },
  { id: 'zaray', name: 'La Zaray', avatar: '💅', phrase: '"Yo gano siempre"' },
  { id: 'pato', name: 'Pato', avatar: '🦆', phrase: '"Quack quack"' },
  { id: 'duende', name: 'Duende Verde', avatar: '🍀', phrase: '"Hmm... Pares, quizás"' },
  { id: 'judio', name: 'Judío', avatar: '✡️', phrase: '"Estas cartas me las prometió Dios"' },
  { id: 'vasco', name: 'Vasco', avatar: '🧔', phrase: '"¡Órdago!"' },
  { id: 'policia', name: 'Policía', avatar: '👮‍♂️', phrase: '"¡Señor mono, está arrestado!"' },
  { id: 'evaristo', name: 'Evaristo', avatar: '👴', phrase: '"Llevo jugando desde Franco..."' }
];

export class MusBot {
  constructor(public player: Player) {}

  private evaluateHand(phase: string): number {
    const hand = this.player.hand;
    const stats = this.player.stats!;
    
    switch (phase) {
      case 'grande':
        return Math.max(...hand.map(c => c.musValue));
      case 'chica':
        return 11 - Math.min(...hand.map(c => c.musValue));
      case 'pares':
        return this.evaluatePares();
      case 'juego':
        return this.evaluateJuego();
      default:
        return 0;
    }
  }

  private evaluatePares(): number {
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

  private evaluateJuego(): number {
    const total = this.player.hand.reduce((sum, card) => sum + card.musValue, 0);
    if (total >= 31) return total - 30; // Juego
    if (total >= 30) return 0.5; // Punto alto
    return 0; // No tiene juego
  }

  decideMus(): 'mus' | 'no mus' {
    const stats = this.player.stats!;
    const cortarMus = stats.cortarMus;
    
    // Personalidad específica
    if (this.player.name === 'Pato') {
      return Math.random() > 0.5 ? 'mus' : 'no mus';
    }
    
    if (cortarMus >= 8) return 'no mus';
    
    const handStrength = this.evaluateGeneralStrength();
    if (cortarMus >= 5 && handStrength > 6) return 'no mus';
    
    return 'mus';
  }

  private evaluateGeneralStrength(): number {
    const grande = this.evaluateHand('grande');
    const chica = this.evaluateHand('chica');
    const pares = this.evaluateHand('pares');
    const juego = this.evaluateHand('juego');
    
    return (grande + chica + pares * 2 + juego * 3) / 4;
  }

  decideBet(phase: string): 'paso' | 'envido' | 'ordago' | 'quiero' | 'no quiero' {
    const stats = this.player.stats!;
    let handValue = this.evaluateHand(phase);
    
    // Aplicar modificadores de personalidad
    handValue = this.applyLuck(handValue);
    handValue = this.applyBluff(handValue);
    handValue = this.applyThinking(handValue);
    
    // Personalidades específicas
    if (this.player.name === 'Pato') {
      const options = ['paso', 'envido', 'ordago'] as const;
      return options[Math.floor(Math.random() * options.length)];
    }
    
    if (this.player.name === 'Vasco' && stats.osadia >= 8) {
      return handValue > 3 ? 'ordago' : 'envido';
    }
    
    if (this.player.name === 'La Zaray' && this.wantsToCheat()) {
      return handValue > 2 ? 'envido' : 'paso';
    }
    
    // Lógica general
    if (handValue >= 8) return 'ordago';
    if (handValue >= 5) return 'envido';
    return 'paso';
  }

  private applyLuck(value: number): number {
    const suerte = this.player.stats!.suerte;
    return value + (Math.random() * suerte) / 5;
  }

  private applyBluff(value: number): number {
    const faroleo = this.player.stats!.faroleo;
    const shouldBluff = Math.random() < (faroleo / 10);
    return shouldBluff ? value + Math.random() * 2 : value;
  }

  private applyThinking(value: number): number {
    const pensar = this.player.stats!.pensarAntes;
    const variability = (10 - pensar) / 10;
    return value + (Math.random() - 0.5) * variability;
  }

  private wantsToCheat(): boolean {
    const limpieza = this.player.stats!.limpieza;
    return Math.random() > (limpieza / 10);
  }

  selectCardsToDiscard(): number[] {
    const hand = this.player.hand;
    const toDiscard: number[] = [];
    
    // Estrategia simple: descartar cartas mediocres
    hand.forEach((card, index) => {
      if (card.musValue >= 4 && card.musValue <= 6 && toDiscard.length < 4) {
        toDiscard.push(index);
      }
    });
    
    return toDiscard;
  }

  getBotPhrase(action: string): string {
    const phrases: Record<string, Record<string, string[]>> = {
      'Chigga': {
        mus: ['Unga unga... mus', 'Unga unga mus'],
        bet: ['Unga unga... órdago', 'Unga unga envido'],
        win: ['Unga unga! ¡Gano!']
      },
      'Xosé Roberto': {
        mus: ['¡Esto es caldereta pura!', 'A la mano con un pimiento'],
        bet: ['¡Que venga el órdago!', 'Te lo firmo en Pascal'],
        win: ['¡Caldereta pura, rapaz!']
      },
      'La Zaray': {
        mus: ['¡Eso no lo he dicho!', 'Niño, yo no he querido mus'],
        bet: ['Yo gano aunque no gane', '¡Envido, shur!'],
        win: ['¡Ya te dije que gano siempre!']
      },
      'Pato': {
        mus: ['Quack quack', 'Quack... mus?'],
        bet: ['Quack quack... órdago', 'Quack'],
        win: ['Quack quack!']
      }
    };
    
    const playerPhrases = phrases[this.player.name];
    if (!playerPhrases) return '';
    
    const actionPhrases = playerPhrases[action];
    if (!actionPhrases) return '';
    
    return actionPhrases[Math.floor(Math.random() * actionPhrases.length)];
  }
}

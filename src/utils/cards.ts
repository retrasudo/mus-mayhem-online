
import { Card } from '@/types/game';

export const createDeck = (): Card[] => {
  const suits: Card['suit'][] = ['oros', 'copas', 'espadas', 'bastos'];
  const deck: Card[] = [];
  
  suits.forEach(suit => {
    // Cartas del 1 al 7 y del 10 al 12 (sin 8 ni 9)
    const values = [1, 2, 3, 4, 5, 6, 7, 10, 11, 12];
    
    values.forEach(value => {
      const musValue = getMusValue(value);
      deck.push({
        suit,
        value,
        name: getCardName(value),
        musValue
      });
    });
  });
  
  return shuffleDeck(deck);
};

export const getCardName = (value: number): string => {
  const names: Record<number, string> = {
    1: 'As',
    2: '2',
    3: '3',
    4: '4',
    5: '5',
    6: '6',
    7: '7',
    10: 'Sota',
    11: 'Caballo',
    12: 'Rey'
  };
  return names[value] || value.toString();
};

export const getMusValue = (value: number): number => {
  // En el mus: As=1, 2=1, 3=10, 4=4, 5=5, 6=6, 7=7, Sota=10, Caballo=10, Rey=10
  if (value === 1 || value === 2) return 1; // As y 2 valen 1
  if (value === 3) return 10; // Tres vale 10 (como rey)
  if (value >= 10) return 10; // Sota, Caballo, Rey valen 10
  return value; // 4,5,6,7 valen su número
};

export const shuffleDeck = (deck: Card[]): Card[] => {
  const shuffled = [...deck];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
};

export const dealCards = (deck: Card[], numPlayers: number = 4): { hands: Card[][], remainingDeck: Card[] } => {
  const hands: Card[][] = Array.from({ length: numPlayers }, () => []);
  const remainingDeck = [...deck];
  
  // Repartir 4 cartas a cada jugador
  for (let round = 0; round < 4; round++) {
    for (let player = 0; player < numPlayers; player++) {
      if (remainingDeck.length > 0) {
        hands[player].push(remainingDeck.pop()!);
      }
    }
  }
  
  return { hands, remainingDeck };
};

export const getSuitSymbol = (suit: string): string => {
  const symbols = {
    'oros': '🟡',
    'copas': '🏆',
    'espadas': '⚔️',
    'bastos': '🏒'
  };
  return symbols[suit as keyof typeof symbols] || '❓';
};

export const getSuitColor = (suit: string): string => {
  return suit === 'oros' || suit === 'copas' ? 'text-red-600' : 'text-black';
};

// Obtener valor de carta para orden (Grande/Chica)
export const getCardOrder = (value: number): number => {
  // Orden: Rey(12)=12, Tres(3)=11, Caballo(11)=10, Sota(10)=9, 7=7, 6=6, 5=5, 4=4, 2=2, As(1)=1
  if (value === 12) return 12; // Rey
  if (value === 3) return 11;  // Tres (igual que rey en valor pero menor en orden)
  if (value === 11) return 10; // Caballo
  if (value === 10) return 9;  // Sota
  return value; // 7,6,5,4,2,1 mantienen su orden natural
};

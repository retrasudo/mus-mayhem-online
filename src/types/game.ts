
export interface Card {
  suit: 'oros' | 'copas' | 'espadas' | 'bastos';
  value: number; // 1-12 (sin 8 ni 9)
  name: string;
  musValue: number; // Valor en el mus
}

export interface Player {
  id: string;
  name: string;
  avatar: string;
  isBot: boolean;
  team: 'A' | 'B';
  position: 'bottom' | 'left' | 'top' | 'right';
  hand: Card[];
  stats?: BotStats;
}

export interface BotStats {
  osadia: number;
  faroleo: number;
  suerte: number;
  cortarMus: number;
  cazarSenas: number;
  pensarAntes: number;
  limpieza: number;
  juegaGPJ: number;
  juegaChica: number;
}

export interface GameState {
  phase: 'mus' | 'grande' | 'chica' | 'pares' | 'juego' | 'finished';
  subPhase: 'dealing' | 'mus-decision' | 'discarding' | 'betting' | 'revealing' | 'scoring';
  currentPlayer: string;
  currentRound: number;
  currentBet: number;
  pot: number;
  teamAScore: number;
  teamBScore: number;
  players: Player[];
  deck: Card[];
  musCount: number;
  bets: Record<string, 'paso' | 'envido' | 'ordago' | 'quiero' | 'no quiero'>;
  roundResults: RoundResult[];
}

export interface RoundResult {
  phase: string;
  winner: 'A' | 'B' | 'tie';
  points: number;
  details: string;
}

export type GameAction = 
  | { type: 'DEAL_CARDS' }
  | { type: 'MUS_DECISION'; playerId: string; decision: 'mus' | 'no mus' }
  | { type: 'DISCARD_CARDS'; playerId: string; cardIndices: number[] }
  | { type: 'PLACE_BET'; playerId: string; bet: 'paso' | 'envido' | 'ordago' | 'quiero' | 'no quiero' }
  | { type: 'NEXT_PHASE' }
  | { type: 'RESET_GAME' };

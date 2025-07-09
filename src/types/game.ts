
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
  isMano?: boolean;
  hasPares?: boolean;
  hasJuego?: boolean;
  punto?: number;
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

export interface GameDialogue {
  playerId: string;
  playerName: string;
  message: string;
  action: string;
  timestamp: number;
}

export interface GameState {
  phase: 'mus' | 'grande' | 'chica' | 'pares' | 'juego' | 'punto' | 'scoring' | 'finished';
  subPhase: 'dealing' | 'mus-decision' | 'discarding' | 'betting' | 'revealing' | 'next-round';
  currentPlayer: string;
  currentRound: number;
  currentBet: number;
  currentBetType: 'envido' | 'ordago' | null;
  betHistory: BetAction[];
  teamAScore: number;
  teamBScore: number;
  teamAAmarracos: number;
  teamBAmarracos: number;
  players: Player[];
  deck: Card[];
  musCount: number;
  playersWantingMus: string[];
  bets: Record<string, BetAction>;
  roundResults: RoundResult[];
  dialogues: GameDialogue[];
  senasEnabled: boolean;
  companionSignal?: 'buenas' | 'malas' | 'regulares';
  waitingForResponse: boolean;
  lastBetPlayer?: string;
  phaseWinner?: string;
  adentro: boolean; // Cuando una pareja está cerca de ganar
}

export interface BetAction {
  type: 'paso' | 'envido' | 'ordago' | 'quiero' | 'no-quiero' | 'echo-mas';
  amount?: number;
  playerId: string;
}

export interface RoundResult {
  phase: string;
  winner: 'A' | 'B' | 'tie';
  points: number;
  details: string;
  isDeje?: boolean;
}

export type GameAction = 
  | { type: 'DEAL_CARDS' }
  | { type: 'MUS_DECISION'; playerId: string; decision: 'mus' | 'no-mus' }
  | { type: 'DISCARD_CARDS'; playerId: string; cardIndices: number[] }
  | { type: 'PLACE_BET'; playerId: string; bet: BetAction }
  | { type: 'SEND_SIGNAL'; playerId: string; signal: 'buenas' | 'malas' | 'regulares' }
  | { type: 'NEXT_PHASE' }
  | { type: 'RESET_GAME' };

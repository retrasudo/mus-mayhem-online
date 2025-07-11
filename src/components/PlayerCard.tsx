import React from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Crown, Bot } from 'lucide-react';
import { Player } from '@/types/game';

interface PlayerCardProps {
  player: Player;
  isCurrentPlayer: boolean;
  isUserPlayer: boolean;
  compact?: boolean;
}

const PlayerCard: React.FC<PlayerCardProps> = ({ player, isCurrentPlayer, isUserPlayer, compact = false }) => {
  const getTeamColor = () => {
    return player.team === 'A' ? 'bg-gradient-to-r from-blue-500 to-blue-600' : 'bg-gradient-to-r from-red-500 to-red-600';
  };

  const getBotPhrase = () => {
    const phrases: Record<string, string> = {
      'Chigga': '"Unga unga mus"',
      'Xosé Roberto': '"¡Caldereta pura!"',
      'La Zaray': '"Yo gano siempre"',
      'Pato': '"Quack quack"',
      'Duende Verde': '"Hmm... Pares, quizás"',
      'Judío': '"Estas cartas me las prometió Dios"',
      'Vasco': '"¡Órdago!"',
      'Policía': '"¡Señor mono, está arrestado!"',
      'Evaristo': '"Llevo jugando desde Franco..."'
    };
    return phrases[player.name] || '';
  };

  const avatarSize = compact ? 'text-2xl' : 'text-3xl';
  const cardSize = compact ? 'w-1.5 h-2' : 'w-2 h-3';
  const minWidth = compact ? 'min-w-[80px]' : 'min-w-[90px]';

  return (
    <Card className={`
      p-2 bg-white/95 backdrop-blur-sm border-2 transition-all duration-300 shadow-lg
      ${isCurrentPlayer ? 'border-yellow-400 shadow-lg shadow-yellow-400/50 scale-105' : 'border-gray-300'}
      ${isUserPlayer ? 'border-green-400 shadow-green-400/30' : ''}
    `}>
      <div className={`flex flex-col items-center gap-1 ${minWidth}`}>
        {/* Avatar */}
        <div className="relative">
          <div className={avatarSize}>{player.avatar}</div>
          {isCurrentPlayer && (
            <div className="absolute -top-1 -right-1">
              <Crown className="w-4 h-4 text-yellow-500 animate-pulse drop-shadow-lg" />
            </div>
          )}
          {player.isBot && (
            <div className="absolute -bottom-1 -right-1">
              <Bot className="w-3 h-3 text-gray-600" />
            </div>
          )}
        </div>
        
        {/* Name */}
        <div className="text-center">
          <div className={`font-semibold ${compact ? 'text-xs' : 'text-xs'}`}>{player.name}</div>
          <Badge 
            variant="secondary" 
            className={`text-xs text-white ${getTeamColor()} px-2 py-1 shadow-md`}
          >
            Equipo {player.team}
          </Badge>
        </div>
        
        {/* Cards indicator for other players */}
        {!isUserPlayer && (
          <div className="flex gap-1 mt-1">
            {player.hand.map((_, cardIndex) => (
              <div
                key={cardIndex}
                className={`${cardSize} bg-gradient-to-b from-blue-500 to-blue-700 rounded-sm border border-white shadow-sm`}
              />
            ))}
          </div>
        )}
        
        {/* Game Status */}
        {compact && (
          <div className="text-xs space-y-0.5 text-center">
            {player.hasPares && (
              <div className="bg-green-100 text-green-800 px-1 py-0.5 rounded text-xs">
                Pares
              </div>
            )}
            {player.hasJuego && (
              <div className="bg-blue-100 text-blue-800 px-1 py-0.5 rounded text-xs">
                Juego
              </div>
            )}
            {!player.hasJuego && player.punto && (
              <div className="bg-gray-100 text-gray-800 px-1 py-0.5 rounded text-xs">
                {player.punto}pts
              </div>
            )}
          </div>
        )}
        
        {/* Bot phrase for non-compact mode */}
        {player.isBot && !compact && (
          <div className="text-xs text-gray-600 text-center max-w-[100px] italic leading-tight">
            {getBotPhrase()}
          </div>
        )}
      </div>
    </Card>
  );
};

export { PlayerCard };
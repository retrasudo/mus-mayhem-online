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

  const avatarSize = compact ? 'text-2xl' : 'text-3xl';
  const cardSize = compact ? 'w-1.5 h-2' : 'w-2 h-3';
  const minWidth = compact ? 'min-w-[70px]' : 'min-w-[80px]';

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
      </div>
    </Card>
  );
};

export { PlayerCard };
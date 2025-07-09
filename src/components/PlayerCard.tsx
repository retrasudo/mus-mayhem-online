
import React from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Crown, Bot } from 'lucide-react';
import { Player } from '@/types/game';

interface PlayerCardProps {
  player: Player;
  isCurrentPlayer: boolean;
  isUserPlayer: boolean;
}

const PlayerCard: React.FC<PlayerCardProps> = ({ player, isCurrentPlayer, isUserPlayer }) => {
  const getPositionStyles = () => {
    switch (player.position) {
      case 'bottom':
        return 'bottom-32 left-1/2 transform -translate-x-1/2';
      case 'left':
        return 'left-8 top-1/2 transform -translate-y-1/2';
      case 'top':
        return 'top-20 left-1/2 transform -translate-x-1/2';
      case 'right':
        return 'right-8 top-1/2 transform -translate-y-1/2';
      default:
        return '';
    }
  };

  const getTeamColor = () => {
    return player.team === 'A' ? 'bg-blue-500' : 'bg-red-500';
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

  return (
    <div className={`absolute ${getPositionStyles()}`}>
      <Card className={`
        p-3 bg-white/90 backdrop-blur-sm border-2 transition-all duration-300
        ${isCurrentPlayer ? 'border-yellow-400 shadow-lg shadow-yellow-400/50' : 'border-gray-300'}
        ${isUserPlayer ? 'border-green-400' : ''}
      `}>
        <div className="flex flex-col items-center gap-2 min-w-[100px]">
          {/* Avatar */}
          <div className="relative">
            <div className="text-4xl">{player.avatar}</div>
            {isCurrentPlayer && (
              <div className="absolute -top-2 -right-2">
                <Crown className="w-6 h-6 text-yellow-500 animate-pulse" />
              </div>
            )}
            {player.isBot && (
              <div className="absolute -bottom-1 -right-1">
                <Bot className="w-4 h-4 text-gray-600" />
              </div>
            )}
          </div>
          
          {/* Name */}
          <div className="text-center">
            <div className="font-semibold text-sm">{player.name}</div>
            <Badge 
              variant="secondary" 
              className={`text-xs text-white ${getTeamColor()}`}
            >
              Equipo {player.team}
            </Badge>
          </div>
          
          {/* Cards indicator for other players */}
          {!isUserPlayer && (
            <div className="flex gap-1">
              {player.hand.map((_, cardIndex) => (
                <div
                  key={cardIndex}
                  className="w-3 h-4 bg-blue-600 rounded-sm border border-white"
                />
              ))}
            </div>
          )}
          
          {/* Bot status/phrase */}
          {player.isBot && (
            <div className="text-xs text-gray-600 text-center max-w-[120px] italic">
              {getBotPhrase()}
            </div>
          )}

          {/* Player stats for bots */}
          {player.isBot && player.stats && (
            <div className="text-xs text-gray-500 text-center">
              <div>Osadía: {player.stats.osadia}/10</div>
              <div>Faroleo: {player.stats.faroleo}/10</div>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
};

export { PlayerCard };

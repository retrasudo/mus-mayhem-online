
import React, { useEffect, useState } from 'react';
import { GameDialogue, Player } from '@/types/game';

interface DialogueBubbleProps {
  dialogue: GameDialogue;
  player: Player;
}

const DialogueBubble: React.FC<DialogueBubbleProps> = ({ dialogue, player }) => {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setVisible(false);
    }, 4000);

    return () => clearTimeout(timer);
  }, [dialogue.timestamp]);

  if (!visible) return null;

  const getPositionStyles = () => {
    switch (player.position) {
      case 'bottom':
        return 'bottom-20 left-1/2 transform -translate-x-1/2';
      case 'left':
        return 'left-20 top-1/2 transform -translate-y-1/2';
      case 'top':
        return 'top-20 left-1/2 transform -translate-x-1/2';
      case 'right':
        return 'right-20 top-1/2 transform -translate-y-1/2';
      default:
        return 'bottom-20 left-1/2 transform -translate-x-1/2';
    }
  };

  const getBubbleDirection = () => {
    switch (player.position) {
      case 'bottom':
        return 'after:top-full after:left-1/2 after:-translate-x-1/2 after:border-l-transparent after:border-r-transparent after:border-b-transparent after:border-t-white';
      case 'left':
        return 'after:left-full after:top-1/2 after:-translate-y-1/2 after:border-t-transparent after:border-b-transparent after:border-r-transparent after:border-l-white';
      case 'top':
        return 'after:bottom-full after:left-1/2 after:-translate-x-1/2 after:border-l-transparent after:border-r-transparent after:border-t-transparent after:border-b-white';
      case 'right':
        return 'after:right-full after:top-1/2 after:-translate-y-1/2 after:border-t-transparent after:border-b-transparent after:border-l-transparent after:border-r-white';
      default:
        return 'after:top-full after:left-1/2 after:-translate-x-1/2 after:border-l-transparent after:border-r-transparent after:border-b-transparent after:border-t-white';
    }
  };

  return (
    <div className={`absolute z-50 pointer-events-none ${getPositionStyles()}`}>
      <div className={`
        relative bg-white rounded-lg px-3 py-2 shadow-lg border-2 border-gray-300 max-w-xs
        after:content-[''] after:absolute after:w-0 after:h-0 after:border-8 after:border-solid
        ${getBubbleDirection()}
        animate-fade-in
      `}>
        <div className="text-sm font-semibold text-gray-800">
          {player.name}:
        </div>
        <div className="text-sm text-gray-700">
          {dialogue.message}
        </div>
      </div>
    </div>
  );
};

export { DialogueBubble };

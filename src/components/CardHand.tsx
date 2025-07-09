
import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Card as PlayingCard } from '@/types/game';
import { getSuitSymbol, getSuitColor } from '@/utils/cards';

interface CardHandProps {
  hand: PlayingCard[];
  onCardSelection?: (selectedIndices: number[]) => void;
  gamePhase?: string;
}

const CardHand: React.FC<CardHandProps> = ({ hand, onCardSelection, gamePhase }) => {
  const [selectedCards, setSelectedCards] = useState<number[]>([]);

  const toggleCardSelection = (index: number) => {
    if (gamePhase !== 'discarding') return;
    
    const newSelection = selectedCards.includes(index)
      ? selectedCards.filter(i => i !== index)
      : [...selectedCards, index];
    
    setSelectedCards(newSelection);
    onCardSelection?.(newSelection);
  };

  return (
    <div className="flex gap-2">
      {hand.map((card, index) => (
        <Card
          key={`${card.suit}-${card.value}`}
          className={`
            w-16 h-24 bg-white border-2 cursor-pointer transition-all duration-200
            hover:scale-105 hover:shadow-lg
            ${selectedCards.includes(index) 
              ? 'border-blue-500 bg-blue-50 transform -translate-y-2' 
              : 'border-gray-300 hover:border-gray-400'
            }
            ${gamePhase === 'discarding' ? 'cursor-pointer' : 'cursor-default'}
          `}
          onClick={() => toggleCardSelection(index)}
        >
          <div className="h-full flex flex-col items-center justify-between p-1">
            <div className={`text-xs font-bold ${getSuitColor(card.suit)}`}>
              {card.name}
            </div>
            <div className="text-lg">
              {getSuitSymbol(card.suit)}
            </div>
            <div className={`text-xs font-bold ${getSuitColor(card.suit)} transform rotate-180`}>
              {card.name}
            </div>
          </div>
        </Card>
      ))}
      
      {gamePhase === 'discarding' && selectedCards.length > 0 && (
        <div className="ml-4 flex items-center">
          <div className="bg-blue-600 text-white px-3 py-1 rounded text-sm">
            {selectedCards.length} carta{selectedCards.length !== 1 ? 's' : ''} seleccionada{selectedCards.length !== 1 ? 's' : ''}
          </div>
        </div>
      )}
    </div>
  );
};

export { CardHand };

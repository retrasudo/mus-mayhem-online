
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
    <div className="flex items-center gap-3">
      <div className="flex gap-2">
        {hand.map((card, index) => (
          <Card
            key={`${card.suit}-${card.value}`}
            className={`
              w-20 h-28 bg-white border-2 cursor-pointer transition-all duration-200 shadow-lg
              hover:scale-105 hover:shadow-xl relative
              ${selectedCards.includes(index) 
                ? 'border-blue-500 bg-blue-50 transform -translate-y-3 ring-2 ring-blue-300' 
                : 'border-gray-300 hover:border-gray-400'
              }
              ${gamePhase === 'discarding' ? 'cursor-pointer' : 'cursor-default'}
            `}
            onClick={() => toggleCardSelection(index)}
          >
            <div className="h-full flex flex-col justify-between p-2">
              {/* Esquina superior izquierda */}
              <div className="flex flex-col items-start">
                <div className={`text-sm font-bold leading-none ${getSuitColor(card.suit)}`}>
                  {card.name}
                </div>
                <div className="text-lg leading-none mt-1">
                  {getSuitSymbol(card.suit)}
                </div>
              </div>
              
              {/* Centro de la carta */}
              <div className="flex items-center justify-center flex-1">
                <div className="text-2xl">
                  {getSuitSymbol(card.suit)}
                </div>
              </div>
              
              {/* Esquina inferior derecha (invertida) */}
              <div className="flex flex-col items-end transform rotate-180">
                <div className={`text-sm font-bold leading-none ${getSuitColor(card.suit)}`}>
                  {card.name}
                </div>
                <div className="text-lg leading-none mt-1">
                  {getSuitSymbol(card.suit)}
                </div>
              </div>
            </div>
            
            {/* Indicador de selección */}
            {selectedCards.includes(index) && (
              <div className="absolute -top-1 -right-1 w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                <span className="text-white text-xs font-bold">✓</span>
              </div>
            )}
          </Card>
        ))}
      </div>
      
      {gamePhase === 'discarding' && selectedCards.length > 0 && (
        <div className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium shadow-lg">
          {selectedCards.length} carta{selectedCards.length !== 1 ? 's' : ''} seleccionada{selectedCards.length !== 1 ? 's' : ''}
        </div>
      )}
    </div>
  );
};

export { CardHand };

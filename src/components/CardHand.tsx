import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Card as PlayingCard } from '@/types/game';
import { getSuitSymbol, getSuitColor } from '@/utils/cards';

interface CardHandProps {
  hand: PlayingCard[];
  onCardSelection?: (selectedIndices: number[]) => void;
  gamePhase?: string;
  showCards?: boolean;
}

const CardHand: React.FC<CardHandProps> = ({ hand, onCardSelection, gamePhase, showCards = false }) => {
  const [selectedCards, setSelectedCards] = useState<number[]>([]);

  const toggleCardSelection = (index: number) => {
    if (gamePhase !== 'discarding') return;
    
    const newSelection = selectedCards.includes(index)
      ? selectedCards.filter(i => i !== index)
      : [...selectedCards, index];
    
    setSelectedCards(newSelection);
  };

  const handleConfirmSelection = () => {
    onCardSelection?.(selectedCards);
    setSelectedCards([]);
  };

  return (
    <div className="flex items-center gap-2">
      <div className="flex gap-1">
        {hand.map((card, index) => (
          <Card
            key={`${card.suit}-${card.value}`}
            className={`
              w-16 h-22 bg-white border-2 cursor-pointer transition-all duration-200 shadow-lg
              hover:scale-105 hover:shadow-xl relative
              ${selectedCards.includes(index) 
                ? 'border-blue-500 bg-blue-50 transform -translate-y-2 ring-2 ring-blue-300' 
                : showCards
                  ? 'border-yellow-500 bg-yellow-50'
                  : 'border-gray-300 hover:border-gray-400'
              }
              ${gamePhase === 'discarding' ? 'cursor-pointer' : 'cursor-default'}
            `}
            onClick={() => toggleCardSelection(index)}
          >
            <div className="h-full flex flex-col justify-between p-1">
              {/* Esquina superior izquierda */}
              <div className="flex flex-col items-start">
                <div className={`text-xs font-bold leading-none ${getSuitColor(card.suit)}`}>
                  {card.name}
                </div>
                <div className="text-sm leading-none mt-0.5">
                  {getSuitSymbol(card.suit)}
                </div>
              </div>
              
              {/* Centro de la carta */}
              <div className="flex items-center justify-center flex-1">
                <div className="text-lg">
                  {getSuitSymbol(card.suit)}
                </div>
              </div>
              
              {/* Esquina inferior derecha (invertida) */}
              <div className="flex flex-col items-end transform rotate-180">
                <div className={`text-xs font-bold leading-none ${getSuitColor(card.suit)}`}>
                  {card.name}
                </div>
                <div className="text-sm leading-none mt-0.5">
                  {getSuitSymbol(card.suit)}
                </div>
              </div>
            </div>
            
            {/* Indicador de selección */}
            {selectedCards.includes(index) && (
              <div className="absolute -top-1 -right-1 w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center">
                <span className="text-white text-xs font-bold">✓</span>
              </div>
            )}
          </Card>
        ))}
      </div>
      
      {gamePhase === 'discarding' && (
        <div className="flex flex-col gap-2">
          <Button
            size="sm"
            onClick={handleConfirmSelection}
            className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 text-xs"
          >
            {selectedCards.length === 0 ? 'No Descartar' : `Descartar ${selectedCards.length}`}
          </Button>
          {selectedCards.length > 0 && (
            <div className="text-xs text-gray-600 text-center">
              {selectedCards.length} carta{selectedCards.length !== 1 ? 's' : ''} seleccionada{selectedCards.length !== 1 ? 's' : ''}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export { CardHand };
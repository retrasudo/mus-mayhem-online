
import React, { useState } from 'react';
import { Card } from '@/components/ui/card';

interface PlayingCard {
  suit: 'oros' | 'copas' | 'espadas' | 'bastos';
  value: number;
  name: string;
  musValue: number;
}

const CardHand = () => {
  const [selectedCards, setSelectedCards] = useState<number[]>([]);
  
  // Mano inicial de ejemplo
  const [hand] = useState<PlayingCard[]>([
    { suit: 'oros', value: 1, name: 'As', musValue: 1 },
    { suit: 'copas', value: 3, name: '3', musValue: 10 },
    { suit: 'espadas', value: 12, name: 'Rey', musValue: 10 },
    { suit: 'bastos', value: 11, name: 'Caballo', musValue: 10 }
  ]);

  const getSuitSymbol = (suit: string) => {
    const symbols = {
      'oros': '🟡',
      'copas': '🏆',
      'espadas': '⚔️',
      'bastos': '🏒'
    };
    return symbols[suit as keyof typeof symbols] || '❓';
  };

  const getSuitColor = (suit: string) => {
    return suit === 'oros' || suit === 'copas' ? 'text-red-600' : 'text-black';
  };

  const toggleCardSelection = (index: number) => {
    setSelectedCards(prev => 
      prev.includes(index) 
        ? prev.filter(i => i !== index)
        : [...prev, index]
    );
  };

  return (
    <div className="flex gap-2">
      {hand.map((card, index) => (
        <Card
          key={index}
          className={`
            w-16 h-24 bg-white border-2 cursor-pointer transition-all duration-200
            hover:scale-105 hover:shadow-lg
            ${selectedCards.includes(index) 
              ? 'border-blue-500 bg-blue-50 transform -translate-y-2' 
              : 'border-gray-300 hover:border-gray-400'
            }
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
    </div>
  );
};

export { CardHand };


import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { BOT_CHARACTERS, BOT_STATS } from '@/utils/bots';
import { Player } from '@/types/game';

interface CharacterSelectionProps {
  onCharactersSelected: (players: Player[]) => void;
  userPlayer: { name: string; avatar: string };
}

const CharacterSelection: React.FC<CharacterSelectionProps> = ({ 
  onCharactersSelected, 
  userPlayer 
}) => {
  const [selectedBots, setSelectedBots] = useState<string[]>([]);

  const toggleBot = (botId: string) => {
    if (selectedBots.includes(botId)) {
      setSelectedBots(selectedBots.filter(id => id !== botId));
    } else if (selectedBots.length < 3) {
      setSelectedBots([...selectedBots, botId]);
    }
  };

  const startGame = () => {
    if (selectedBots.length !== 3) return;

    const players: Player[] = [
      {
        id: 'user',
        name: userPlayer.name,
        avatar: userPlayer.avatar,
        isBot: false,
        team: 'A',
        position: 'bottom',
        hand: []
      },
      {
        id: 'bot1',
        name: BOT_CHARACTERS.find(b => b.id === selectedBots[0])!.name,
        avatar: BOT_CHARACTERS.find(b => b.id === selectedBots[0])!.avatar,
        isBot: true,
        team: 'B',
        position: 'left',
        hand: [],
        stats: BOT_STATS[BOT_CHARACTERS.find(b => b.id === selectedBots[0])!.name]
      },
      {
        id: 'bot2',
        name: BOT_CHARACTERS.find(b => b.id === selectedBots[1])!.name,
        avatar: BOT_CHARACTERS.find(b => b.id === selectedBots[1])!.avatar,
        isBot: true,
        team: 'A',
        position: 'top',
        hand: [],
        stats: BOT_STATS[BOT_CHARACTERS.find(b => b.id === selectedBots[1])!.name]
      },
      {
        id: 'bot3',
        name: BOT_CHARACTERS.find(b => b.id === selectedBots[2])!.name,
        avatar: BOT_CHARACTERS.find(b => b.id === selectedBots[2])!.avatar,
        isBot: true,
        team: 'B',
        position: 'right',
        hand: [],
        stats: BOT_STATS[BOT_CHARACTERS.find(b => b.id === selectedBots[2])!.name]
      }
    ];

    onCharactersSelected(players);
  };

  const getStatBar = (value: number) => (
    <div className="flex items-center gap-1">
      {Array.from({ length: 10 }, (_, i) => (
        <div
          key={i}
          className={`w-2 h-2 rounded ${
            i < value ? 'bg-green-500' : 'bg-gray-300'
          }`}
        />
      ))}
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-800 via-green-700 to-green-900 p-4">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-4">
            🃏 Selecciona tus Rivales
          </h1>
          <p className="text-xl text-green-100">
            Elige 3 personajes para completar la mesa ({selectedBots.length}/3)
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {BOT_CHARACTERS.map((character) => {
            const stats = BOT_STATS[character.name];
            const isSelected = selectedBots.includes(character.id);
            const isDisabled = !isSelected && selectedBots.length >= 3;

            return (
              <Card
                key={character.id}
                className={`
                  cursor-pointer transition-all duration-300 hover:scale-105
                  ${isSelected 
                    ? 'border-4 border-yellow-400 bg-yellow-50' 
                    : isDisabled 
                      ? 'opacity-50 cursor-not-allowed' 
                      : 'hover:border-green-400 bg-white'
                  }
                `}
                onClick={() => !isDisabled && toggleBot(character.id)}
              >
                <CardHeader className="text-center">
                  <div className="text-6xl mb-2">{character.avatar}</div>
                  <CardTitle className="text-xl">{character.name}</CardTitle>
                  <p className="text-sm text-gray-600 italic">
                    {character.phrase}
                  </p>
                  {isSelected && (
                    <Badge className="bg-yellow-500 text-white">
                      ¡Seleccionado!
                    </Badge>
                  )}
                </CardHeader>
                
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <span className="font-semibold">Osadía:</span>
                      {getStatBar(stats.osadia)}
                    </div>
                    <div>
                      <span className="font-semibold">Faroleo:</span>
                      {getStatBar(stats.faroleo)}
                    </div>
                    <div>
                      <span className="font-semibold">Suerte:</span>
                      {getStatBar(stats.suerte)}
                    </div>
                    <div>
                      <span className="font-semibold">Cortar Mus:</span>
                      {getStatBar(stats.cortarMus)}
                    </div>
                    <div>
                      <span className="font-semibold">Cazar Señas:</span>
                      {getStatBar(stats.cazarSenas)}
                    </div>
                    <div>
                      <span className="font-semibold">Pensar:</span>
                      {getStatBar(stats.pensarAntes)}
                    </div>
                  </div>
                  
                  <div className="pt-2 border-t border-gray-200">
                    <div className="text-xs text-gray-600">
                      <strong>Estilo:</strong> {' '}
                      {stats.juegaGPJ >= 8 ? 'Agresivo' : 
                       stats.juegaGPJ >= 6 ? 'Equilibrado' : 'Defensivo'} | {' '}
                      {stats.limpieza >= 8 ? 'Limpio' : 'Tramposo'}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {selectedBots.length === 3 && (
          <div className="text-center">
            <Card className="inline-block bg-white/95 backdrop-blur-sm">
              <CardContent className="p-6">
                <h3 className="text-xl font-bold mb-4">Mesa Completa</h3>
                <div className="flex justify-center gap-4 mb-4">
                  <div className="text-center">
                    <div className="text-3xl">{userPlayer.avatar}</div>
                    <div className="text-sm font-semibold">{userPlayer.name}</div>
                    <Badge className="bg-blue-500 text-white text-xs">Equipo A</Badge>
                  </div>
                  {selectedBots.map((botId, index) => {
                    const character = BOT_CHARACTERS.find(c => c.id === botId)!;
                    const team = index === 1 ? 'A' : 'B';
                    return (
                      <div key={botId} className="text-center">
                        <div className="text-3xl">{character.avatar}</div>
                        <div className="text-sm font-semibold">{character.name}</div>
                        <Badge className={`text-white text-xs ${
                          team === 'A' ? 'bg-blue-500' : 'bg-red-500'
                        }`}>
                          Equipo {team}
                        </Badge>
                      </div>
                    );
                  })}
                </div>
                <Button
                  onClick={startGame}
                  className="bg-green-600 hover:bg-green-700 text-white px-8 py-3 text-lg"
                >
                  🃏 ¡Empezar Partida!
                </Button>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
};

export { CharacterSelection };


import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, Bot, Crown, Gamepad2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const Index = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-800 via-green-700 to-green-900 flex items-center justify-center p-4">
      <div className="max-w-6xl w-full">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-6xl font-bold text-white mb-4 drop-shadow-lg">
            🃏 EL MUS
          </h1>
          <p className="text-xl text-green-100 max-w-2xl mx-auto">
            El tradicional juego de cartas español ahora en tu navegador. 
            Juega con amigos, contra bots legendarios o compite online.
          </p>
        </div>

        {/* Game Mode Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {/* Jugar con Amigos */}
          <Card className="bg-white/95 backdrop-blur-sm border-2 border-yellow-400 hover:scale-105 transition-transform cursor-pointer">
            <CardHeader className="text-center">
              <Users className="w-12 h-12 mx-auto text-blue-600 mb-2" />
              <CardTitle className="text-xl">Con Amigos</CardTitle>
              <CardDescription>Crea una sala privada y juega con tus amigos</CardDescription>
            </CardHeader>
            <CardContent>
              <Button 
                className="w-full bg-blue-600 hover:bg-blue-700"
                onClick={() => navigate('/crear-sala')}
              >
                Crear Sala
              </Button>
            </CardContent>
          </Card>

          {/* Jugar contra Bots */}
          <Card className="bg-white/95 backdrop-blur-sm border-2 border-green-400 hover:scale-105 transition-transform cursor-pointer">
            <CardHeader className="text-center">
              <Bot className="w-12 h-12 mx-auto text-green-600 mb-2" />
              <CardTitle className="text-xl">Contra Bots</CardTitle>
              <CardDescription>Practica con nuestros personajes únicos</CardDescription>
            </CardHeader>
            <CardContent>
              <Button 
                className="w-full bg-green-600 hover:bg-green-700"
                onClick={() => navigate('/juego-bots')}
              >
                Jugar Ahora
              </Button>
            </CardContent>
          </Card>

          {/* Jugar Online */}
          <Card className="bg-white/95 backdrop-blur-sm border-2 border-purple-400 hover:scale-105 transition-transform cursor-pointer">
            <CardHeader className="text-center">
              <Crown className="w-12 h-12 mx-auto text-purple-600 mb-2" />
              <CardTitle className="text-xl">Multijugador</CardTitle>
              <CardDescription>Compite contra jugadores de todo el mundo</CardDescription>
            </CardHeader>
            <CardContent>
              <Button 
                className="w-full bg-purple-600 hover:bg-purple-700"
                onClick={() => navigate('/multijugador')}
              >
                Buscar Partida
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Featured Bots Section */}
        <Card className="bg-white/90 backdrop-blur-sm mb-8">
          <CardHeader>
            <CardTitle className="text-2xl text-center flex items-center justify-center gap-2">
              <Gamepad2 className="w-8 h-8" />
              Conoce a Nuestros Personajes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              {[
                { name: 'Chigga', emoji: '🐵', desc: 'El mono salvaje' },
                { name: 'Xosé Roberto', emoji: '🧓🏻', desc: 'El profesor gallego' },
                { name: 'La Zaray', emoji: '💅', desc: 'La reina del drama' },
                { name: 'Pato', emoji: '🦆', desc: 'Quack quack' },
                { name: 'Duende Verde', emoji: '🍀', desc: 'El misterioso' }
              ].map((bot) => (
                <div key={bot.name} className="text-center p-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors">
                  <div className="text-4xl mb-2">{bot.emoji}</div>
                  <div className="font-semibold text-sm">{bot.name}</div>
                  <div className="text-xs text-gray-600">{bot.desc}</div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center text-green-100">
          <p className="mb-2">✨ Juego desarrollado con amor para los amantes del Mus ✨</p>
          <p className="text-sm opacity-75">
            Reglas oficiales • Chat en vivo • Órdagos incluidos • Diversión garantizada
          </p>
        </div>
      </div>
    </div>
  );
};

export default Index;

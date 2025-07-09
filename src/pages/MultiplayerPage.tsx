
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Search, Users, Clock, ArrowLeft, Gamepad2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const MultiplayerPage = () => {
  const navigate = useNavigate();
  const [searchCode, setSearchCode] = useState('');
  const [isSearching, setIsSearching] = useState(false);

  const publicRooms = [
    { id: '1', name: 'Sala de Veteranos', players: 3, maxPlayers: 4, skill: 'Experto', host: 'Maestro José' },
    { id: '2', name: 'Partida Rápida', players: 2, maxPlayers: 4, skill: 'Intermedio', host: 'Jugador123' },
    { id: '3', name: 'Principiantes Bienvenidos', players: 1, maxPlayers: 4, skill: 'Principiante', host: 'Profesor_Mus' },
    { id: '4', name: 'Órdagos y Más Órdagos', players: 4, maxPlayers: 4, skill: 'Experto', host: 'ElOrdagador' },
  ];

  const handleQuickMatch = () => {
    setIsSearching(true);
    // Simular búsqueda
    setTimeout(() => {
      navigate('/juego-bots');
    }, 2000);
  };

  const joinRoom = (roomId: string) => {
    navigate('/juego-bots');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-800 via-green-700 to-green-900 p-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Button
            variant="ghost"
            onClick={() => navigate('/')}
            className="text-white hover:bg-white/20"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            Volver
          </Button>
          <h1 className="text-3xl font-bold text-white">Multijugador</h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Actions */}
          <div className="space-y-6">
            {/* Quick Match */}
            <Card className="bg-white/95 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-green-700">Partida Rápida</CardTitle>
                <CardDescription>Encuentra oponentes automáticamente</CardDescription>
              </CardHeader>
              <CardContent>
                <Button
                  className="w-full bg-green-600 hover:bg-green-700"
                  onClick={handleQuickMatch}
                  disabled={isSearching}
                >
                  {isSearching ? (
                    <>
                      <Clock className="w-4 h-4 mr-2 animate-spin" />
                      Buscando...
                    </>
                  ) : (
                    <>
                      <Gamepad2 className="w-4 h-4 mr-2" />
                      Buscar Partida
                    </>
                  )}
                </Button>
                {isSearching && (
                  <div className="mt-4 text-center text-sm text-gray-600">
                    <div className="animate-pulse">Buscando jugadores con tu nivel...</div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Join by Code */}
            <Card className="bg-white/95 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-blue-700">Unirse con Código</CardTitle>
                <CardDescription>Introduce el código de la sala</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Input
                  value={searchCode}
                  onChange={(e) => setSearchCode(e.target.value.toUpperCase())}
                  placeholder="Ej: MUS-ABC123"
                  className="w-full font-mono"
                />
                <Button
                  className="w-full bg-blue-600 hover:bg-blue-700"
                  disabled={!searchCode}
                  onClick={() => joinRoom(searchCode)}
                >
                  <Search className="w-4 h-4 mr-2" />
                  Buscar Sala
                </Button>
              </CardContent>
            </Card>

            {/* Player Stats */}
            <Card className="bg-white/95 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-purple-700">Tu Estadísticas</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between">
                  <span>Partidas Jugadas:</span>
                  <span className="font-semibold">42</span>
                </div>
                <div className="flex justify-between">
                  <span>Victorias:</span>
                  <span className="font-semibold text-green-600">28</span>
                </div>
                <div className="flex justify-between">
                  <span>Derrotas:</span>
                  <span className="font-semibold text-red-600">14</span>
                </div>
                <div className="flex justify-between">
                  <span>Ratio Victoria:</span>
                  <span className="font-semibold">66.7%</span>
                </div>
                <div className="flex justify-between">
                  <span>Nivel:</span>
                  <Badge className="bg-yellow-500 text-white">Intermedio</Badge>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Public Rooms */}
          <div className="lg:col-span-2">
            <Card className="bg-white/95 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  Salas Públicas Disponibles
                </CardTitle>
                <CardDescription>Únete a una partida en curso</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {publicRooms.map((room) => (
                    <div
                      key={room.id}
                      className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="font-semibold">{room.name}</h3>
                          <Badge
                            variant={room.skill === 'Principiante' ? 'secondary' : 
                                   room.skill === 'Intermedio' ? 'default' : 'destructive'}
                          >
                            {room.skill}
                          </Badge>
                          {room.players === room.maxPlayers && (
                            <Badge variant="outline" className="text-red-600">
                              Llena
                            </Badge>
                          )}
                        </div>
                        <div className="text-sm text-gray-600">
                          <div>Anfitrión: {room.host}</div>
                          <div>Jugadores: {room.players}/{room.maxPlayers}</div>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <div className="flex gap-1">
                          {Array.from({ length: room.maxPlayers }, (_, i) => (
                            <div
                              key={i}
                              className={`w-3 h-3 rounded-full ${
                                i < room.players ? 'bg-green-500' : 'bg-gray-300'
                              }`}
                            />
                          ))}
                        </div>
                        <Button
                          size="sm"
                          onClick={() => joinRoom(room.id)}
                          disabled={room.players === room.maxPlayers}
                          className="ml-4"
                        >
                          {room.players === room.maxPlayers ? 'Llena' : 'Unirse'}
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
                
                {publicRooms.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    <Users className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>No hay salas públicas disponibles</p>
                    <p className="text-sm">¡Crea tu propia sala o busca una partida rápida!</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MultiplayerPage;

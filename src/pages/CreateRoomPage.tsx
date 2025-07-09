
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Copy, Users, ArrowLeft, Share2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';

const CreateRoomPage = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [roomCode] = useState('MUS-' + Math.random().toString(36).substr(2, 6).toUpperCase());
  const [playerName, setPlayerName] = useState('');
  const [maxScore, setMaxScore] = useState(30);
  const [isPrivate, setIsPrivate] = useState(true);

  const copyRoomCode = () => {
    navigator.clipboard.writeText(roomCode);
    toast({
      title: "¡Código copiado!",
      description: "El código de la sala se ha copiado al portapapeles",
    });
  };

  const shareRoom = () => {
    const shareUrl = `${window.location.origin}/sala/${roomCode}`;
    if (navigator.share) {
      navigator.share({
        title: 'Únete a mi partida de Mus',
        text: `¡Ven a jugar al Mus conmigo! Código de sala: ${roomCode}`,
        url: shareUrl,
      });
    } else {
      navigator.clipboard.writeText(shareUrl);
      toast({
        title: "¡Enlace copiado!",
        description: "El enlace de la sala se ha copiado al portapapeles",
      });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-800 via-green-700 to-green-900 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full">
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
          <h1 className="text-3xl font-bold text-white">Crear Sala Privada</h1>
        </div>

        <div className="grid gap-6">
          {/* Room Code Card */}
          <Card className="bg-white/95 backdrop-blur-sm">
            <CardHeader className="text-center">
              <CardTitle className="text-2xl text-green-700">Tu Código de Sala</CardTitle>
              <CardDescription>Comparte este código con tus amigos para que se unan</CardDescription>
            </CardHeader>
            <CardContent className="text-center space-y-4">
              <div className="text-4xl font-mono font-bold text-blue-600 bg-blue-50 p-4 rounded-lg border-2 border-blue-200">
                {roomCode}
              </div>
              <div className="flex justify-center gap-3">
                <Button onClick={copyRoomCode} className="bg-blue-600 hover:bg-blue-700">
                  <Copy className="w-4 h-4 mr-2" />
                  Copiar Código
                </Button>
                <Button onClick={shareRoom} variant="outline">
                  <Share2 className="w-4 h-4 mr-2" />
                  Compartir
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Room Settings */}
          <Card className="bg-white/95 backdrop-blur-sm">
            <CardHeader>
              <CardTitle>Configuración de la Sala</CardTitle>
              <CardDescription>Personaliza tu partida</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <label className="block text-sm font-medium mb-2">Tu Nombre</label>
                <Input
                  value={playerName}
                  onChange={(e) => setPlayerName(e.target.value)}
                  placeholder="Introduce tu nombre"
                  className="w-full"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Puntos para Ganar</label>
                <div className="flex gap-2">
                  {[30, 40].map((score) => (
                    <Button
                      key={score}
                      variant={maxScore === score ? "default" : "outline"}
                      onClick={() => setMaxScore(score)}
                      className="flex-1"
                    >
                      {score} piedras
                    </Button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Privacidad</label>
                <div className="flex gap-2">
                  <Button
                    variant={isPrivate ? "default" : "outline"}
                    onClick={() => setIsPrivate(true)}
                    className="flex-1"
                  >
                    Sala Privada
                  </Button>
                  <Button
                    variant={!isPrivate ? "default" : "outline"}
                    onClick={() => setIsPrivate(false)}
                    className="flex-1"
                  >
                    Sala Pública
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Waiting Room */}
          <Card className="bg-white/95 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5" />
                Sala de Espera (1/4)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-green-50 rounded-lg border-2 border-green-200">
                  <div className="text-center">
                    <div className="text-2xl mb-2">🧑‍💻</div>
                    <div className="font-semibold">{playerName || 'Tú'}</div>
                    <Badge className="bg-green-600 text-white">Anfitrión</Badge>
                  </div>
                </div>
                
                {[2, 3, 4].map((slot) => (
                  <div key={slot} className="p-4 bg-gray-50 rounded-lg border-2 border-gray-200 border-dashed">
                    <div className="text-center">
                      <div className="text-2xl mb-2">👤</div>
                      <div className="text-gray-500">Esperando...</div>
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="mt-6 text-center">
                <Button
                  className="bg-green-600 hover:bg-green-700"
                  disabled={!playerName}
                  onClick={() => navigate('/juego-bots')}
                >
                  Empezar Partida
                </Button>
                <p className="text-sm text-gray-600 mt-2">
                  Necesitas al menos 4 jugadores para empezar
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default CreateRoomPage;


import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Send, Smile, Users, MessageSquare } from 'lucide-react';

interface ChatMessage {
  id: string;
  player: string;
  message: string;
  timestamp: Date;
  type: 'general' | 'team' | 'system';
  avatar: string;
}

const GameChat = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      player: 'Chigga',
      message: 'Unga unga... ¡Órdago!',
      timestamp: new Date(),
      type: 'general',
      avatar: '🐵'
    },
    {
      id: '2',
      player: 'Xosé Roberto',
      message: '¡Esto es caldereta pura, chavales!',
      timestamp: new Date(),
      type: 'general',
      avatar: '🧓🏻'
    },
    {
      id: '3',
      player: 'Sistema',
      message: 'Xosé Roberto ha enviado 2 piedras',
      timestamp: new Date(),
      type: 'system',
      avatar: '⚙️'
    }
  ]);
  
  const [newMessage, setNewMessage] = useState('');
  const [chatMode, setChatMode] = useState<'general' | 'team'>('general');

  const handleSendMessage = () => {
    if (newMessage.trim()) {
      const message: ChatMessage = {
        id: Date.now().toString(),
        player: 'Tú',
        message: newMessage,
        timestamp: new Date(),
        type: chatMode,
        avatar: '🧑‍💻'
      };
      setMessages(prev => [...prev, message]);
      setNewMessage('');
    }
  };

  const quickEmojis = ['👍', '👎', '😄', '😮', '🤔', '🙄', '😎', '🤐'];

  return (
    <div className="h-full flex flex-col p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-white font-semibold">Chat</h3>
        <div className="flex gap-1">
          <Button
            variant={chatMode === 'general' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setChatMode('general')}
            className="text-xs"
          >
            <MessageSquare className="w-3 h-3 mr-1" />
            General
          </Button>
          <Button
            variant={chatMode === 'team' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setChatMode('team')}
            className="text-xs"
          >
            <Users className="w-3 h-3 mr-1" />
            Equipo
          </Button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto space-y-2 mb-4">
        {messages
          .filter(msg => msg.type === chatMode || msg.type === 'system')
          .map((msg) => (
            <div key={msg.id} className="flex gap-2">
              <div className="text-lg flex-shrink-0">{msg.avatar}</div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-white text-sm font-medium truncate">
                    {msg.player}
                  </span>
                  {msg.type === 'team' && (
                    <Badge variant="secondary" className="text-xs">
                      Equipo
                    </Badge>
                  )}
                  {msg.type === 'system' && (
                    <Badge variant="outline" className="text-xs">
                      Sistema
                    </Badge>
                  )}
                </div>
                <p className={`text-sm ${
                  msg.type === 'system' 
                    ? 'text-yellow-300 italic' 
                    : 'text-gray-200'
                }`}>
                  {msg.message}
                </p>
              </div>
            </div>
          ))}
      </div>

      {/* Quick Emojis */}
      <div className="flex flex-wrap gap-1 mb-3">
        {quickEmojis.map((emoji) => (
          <Button
            key={emoji}
            variant="ghost"
            size="sm"
            className="text-lg p-1 h-8 w-8 hover:bg-white/20"
            onClick={() => setNewMessage(prev => prev + emoji)}
          >
            {emoji}
          </Button>
        ))}
      </div>

      {/* Message Input */}
      <div className="flex gap-2">
        <Input
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder={`Mensaje ${chatMode === 'team' ? 'al equipo' : 'general'}...`}
          className="bg-white/10 border-white/20 text-white placeholder:text-gray-400"
          onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
        />
        <Button
          onClick={handleSendMessage}
          size="icon"
          className="bg-blue-600 hover:bg-blue-700"
        >
          <Send className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
};

export { GameChat };

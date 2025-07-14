
import React from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Trophy } from 'lucide-react';

interface ScoreBoardProps {
  teamAScore: number;
  teamBScore: number;
  pot: number;
}

const ScoreBoard: React.FC<ScoreBoardProps> = ({ teamAScore, teamBScore, pot }) => {
  const maxScore = 40;
  
  const getScoreColor = (score: number) => {
    if (score >= 35) return 'text-red-600';
    if (score >= 25) return 'text-yellow-600';
    return 'text-green-600';
  };

  return (
    <Card className="bg-white/95 backdrop-blur-sm border-2 border-yellow-400 p-4 shadow-lg">
      <div className="flex items-center justify-between gap-8 min-w-[300px]">
        {/* Team A */}
        <div className="text-center">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-4 h-4 bg-blue-500 rounded-full"></div>
            <span className="font-semibold text-blue-700">Equipo A</span>
          </div>
          <div className={`text-3xl font-bold ${getScoreColor(teamAScore)}`}>
            {teamAScore}
          </div>
          <div className="text-xs text-gray-600">puntos</div>
        </div>

        {/* Center Pot */}
        <div className="text-center">
          <Trophy className="w-6 h-6 mx-auto text-yellow-600 mb-1" />
          <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
            Bote: {pot}
          </Badge>
        </div>

        {/* Team B */}
        <div className="text-center">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-4 h-4 bg-red-500 rounded-full"></div>
            <span className="font-semibold text-red-700">Equipo B</span>
          </div>
          <div className={`text-3xl font-bold ${getScoreColor(teamBScore)}`}>
            {teamBScore}
          </div>
          <div className="text-xs text-gray-600">puntos</div>
        </div>
      </div>
      
      {/* Score Progress Bar */}
      <div className="mt-4 flex gap-2">
        <div className="flex-1 bg-gray-200 rounded-full h-2">
          <div 
            className="bg-blue-500 h-2 rounded-full transition-all duration-300"
            style={{ width: `${(teamAScore / maxScore) * 100}%` }}
          />
        </div>
        <div className="flex-1 bg-gray-200 rounded-full h-2">
          <div 
            className="bg-red-500 h-2 rounded-full transition-all duration-300"
            style={{ width: `${(teamBScore / maxScore) * 100}%` }}
          />
        </div>
      </div>
    </Card>
  );
};

export { ScoreBoard };

"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

type Winner = { _id: string; name: string; score: number; isEliminated?: boolean; };
type RoundHistory = {
  roundNumber: number;
  questionText: string;
  survivors: string[];
  eliminated: string[];
};
type WinnerScreenProps = {
  winners: Winner[];
  pin?: string;
};

export function WinnerScreen({ winners, pin }: WinnerScreenProps) {
  const [roundHistory, setRoundHistory] = useState<RoundHistory[]>([]);
  const [selectedRound, setSelectedRound] = useState<RoundHistory | null>(null);
  const [isHost, setIsHost] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setIsHost(new URLSearchParams(window.location.search).get('host') === 'true');
    }
  }, []);

  useEffect(() => {
    // Simple confetti effect
    const confetti = () => {
      for (let i = 0; i < 50; i++) {
        const confettiPiece = document.createElement('div');
        confettiPiece.style.position = 'fixed';
        confettiPiece.style.width = '10px';
        confettiPiece.style.height = '10px';
        confettiPiece.style.backgroundColor = ['#ff0000', '#00ff00', '#0000ff', '#ffff00', '#ff00ff'][Math.floor(Math.random() * 5)];
        confettiPiece.style.left = Math.random() * 100 + '%';
        confettiPiece.style.top = '-10px';
        confettiPiece.style.zIndex = '9999';
        confettiPiece.style.pointerEvents = 'none';
        document.body.appendChild(confettiPiece);

        const animation = confettiPiece.animate([
          { transform: 'translateY(0px) rotate(0deg)', opacity: 1 },
          { transform: `translateY(${window.innerHeight + 20}px) rotate(360deg)`, opacity: 0 }
        ], {
          duration: 3000 + Math.random() * 2000,
          easing: 'linear'
        });

        animation.onfinish = () => {
          document.body.removeChild(confettiPiece);
        };
      }
    };

    const fetchRoundHistory = async () => {
      try {
        const response = await fetch(`/api/game/${pin}`);
        if (response.ok) {
          const gameData = await response.json();
          setRoundHistory(gameData.roundHistory || []);
        }
      } catch (error) {
        console.error('Failed to fetch round history:', error);
      }
    };

    confetti();
    const interval = setInterval(confetti, 2000);

    // Fetch round history if host
    if (isHost && pin) {
      fetchRoundHistory();
    }

    return () => clearInterval(interval);
  }, [isHost, pin]);

  const topWinner = winners[0];

  if (!isHost) {
    // Player view - hide results
    return (
      <div className="w-full max-w-2xl space-y-8 text-center">
        <div>
          <h1 className="text-6xl font-bold text-yellow-600 mb-4">🏆 Game Over! 🏆</h1>
          <p className="text-2xl text-gray-700">Thank you for playing!</p>
        </div>
        
        <Card className="bg-gradient-to-r from-blue-400 to-purple-600 text-white shadow-2xl">
          <CardHeader className="text-center">
            <CardTitle className="text-3xl">🎉 Results Coming Soon 🎉</CardTitle>
          </CardHeader>
          <CardContent className="text-center py-8">
            <h2 className="text-2xl font-bold mb-4">The champion and final leaderboard</h2>
            <p className="text-xl">will be revealed at the end of the townhall!</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Host view - show full results
  return (
    <div className="w-full max-w-6xl space-y-8">
      <div className="text-center">
        <h1 className="text-6xl font-bold text-yellow-600 mb-4">🏆 Game Over! 🏆</h1>
        <p className="text-2xl text-gray-700">Host View - Full Results</p>
      </div>

      {/* Winner Podium */}
      <Card className="bg-gradient-to-r from-yellow-400 to-yellow-600 text-white shadow-2xl">
        <CardHeader className="text-center">
          <CardTitle className="text-4xl">👑 Champion 👑</CardTitle>
        </CardHeader>
        <CardContent className="text-center">
          <h2 className="text-5xl font-bold mb-2">{topWinner?.name || 'No Winner'}</h2>
          <Badge variant="secondary" className="text-2xl py-2 px-4 bg-white text-yellow-600">
            {topWinner?.score || 0} points
          </Badge>
        </CardContent>
      </Card>



      {/* Round History - Only for Host */}
      {isHost && roundHistory.length > 0 && (
        <Card className="bg-white/90 backdrop-blur-sm shadow-xl">
          <CardHeader>
            <CardTitle className="text-2xl text-center text-gray-800">Round by Round Results</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {roundHistory.map((round) => (
                <Card 
                  key={round.roundNumber}
                  className="cursor-pointer hover:shadow-md transition-shadow border-2"
                  onClick={() => setSelectedRound(round)}
                >
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg">Round {round.roundNumber}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-gray-600 mb-2 truncate">{round.questionText}</p>
                    <div className="flex justify-between text-sm">
                      <span className="text-green-600">✅ {round.survivors.length}</span>
                      <span className="text-red-600">❌ {round.eliminated.length}</span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Final Survivors - Host Only */}
      <Card className="bg-white/90 backdrop-blur-sm shadow-xl">
        <CardHeader>
          <CardTitle className="text-2xl text-center text-gray-800">Final Survivors</CardTitle>
          <p className="text-center text-gray-600">Players who made it to the final round</p>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {winners.filter(w => !w.isEliminated).map((winner, index) => (
              <div key={winner._id} className="flex items-center justify-between p-4 bg-green-50 rounded-lg border-2 border-green-200">
                <div className="flex items-center space-x-4">
                  <div className="text-2xl font-bold text-green-600">#{index + 1}</div>
                  <div className="text-xl font-semibold">{winner.name}</div>
                  <Badge variant="secondary" className="bg-green-100 text-green-800">Final Survivor</Badge>
                </div>
                <Badge variant="outline" className="text-lg py-1 px-3 border-green-500">
                  {winner.score} points
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Full Leaderboard - Host Only */}
      <Card className="bg-white/90 backdrop-blur-sm shadow-xl">
        <CardHeader>
          <CardTitle className="text-2xl text-center text-gray-800">Complete Leaderboard</CardTitle>
          <p className="text-center text-gray-600">All players ranked by performance</p>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {winners.map((winner, index) => (
              <div key={winner._id} className={`flex items-center justify-between p-4 rounded-lg ${
                winner.score > 0 ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'
              } border-2`}>
                <div className="flex items-center space-x-4">
                  <div className="text-2xl font-bold text-gray-600">#{index + 1}</div>
                  <div className="text-xl font-semibold">{winner.name}</div>
                  <Badge variant="secondary" className={winner.score > 0 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                    {winner.score > 0 ? 'Survivor' : 'Eliminated'}
                  </Badge>
                </div>
                <Badge variant="outline" className="text-lg py-1 px-3">
                  {winner.score} points
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Round Details Dialog */}
      <Dialog open={!!selectedRound} onOpenChange={() => setSelectedRound(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {selectedRound?.roundNumber === 0 ? selectedRound.questionText : `Round ${selectedRound?.roundNumber} Results`}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {selectedRound?.roundNumber !== 0 && (
              <div className="p-4 bg-gray-50 rounded-lg">
                <h4 className="font-semibold mb-2">Question:</h4>
                <p>{selectedRound?.questionText}</p>
              </div>
            )}
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 bg-green-50 rounded-lg">
                <h4 className="font-semibold text-green-600 mb-2">Survivors ({selectedRound?.survivors.length || 0}):</h4>
                <div className="space-y-1">
                  {selectedRound?.survivors.map((name, index) => (
                    <div key={index} className="text-sm">{name}</div>
                  )) || <div className="text-sm text-gray-500">None</div>}
                </div>
              </div>
              
              <div className="p-4 bg-red-50 rounded-lg">
                <h4 className="font-semibold text-red-600 mb-2">Eliminated ({selectedRound?.eliminated.length || 0}):</h4>
                <div className="space-y-1">
                  {selectedRound?.eliminated.map((name, index) => (
                    <div key={index} className="text-sm">{name}</div>
                  )) || <div className="text-sm text-gray-500">None</div>}
                </div>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
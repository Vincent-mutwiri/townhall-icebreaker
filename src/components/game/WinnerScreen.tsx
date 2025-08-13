"use client";

import { useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type Winner = { _id: string; name: string; score: number; };
type WinnerScreenProps = {
  winners: Winner[];
};

export function WinnerScreen({ winners }: WinnerScreenProps) {
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

    confetti();
    const interval = setInterval(confetti, 2000);

    return () => clearInterval(interval);
  }, []);

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader className="text-center">
        <CardTitle className="text-3xl font-bold text-primary">🎉 Game Over! 🎉</CardTitle>
      </CardHeader>
      <CardContent className="text-center space-y-6">
        <div>
          <h2 className="text-2xl font-bold mb-4">Final Rankings</h2>
          <div className="space-y-3">
            {winners.map((winner, index) => (
              <div key={winner._id} className={`p-4 rounded-lg ${index === 0 ? 'bg-yellow-100 border-2 border-yellow-400' : 'bg-secondary'}`}>
                <div className="flex justify-between items-center">
                  <span className="text-lg font-semibold">
                    #{index + 1} {winner.name}
                    {index === 0 && ' 👑'}
                  </span>
                  <span className="text-lg font-bold">{winner.score} points</span>
                </div>
              </div>
            ))}
          </div>
        </div>
        <p className="text-lg text-muted-foreground">
          Congratulations to all players!
        </p>
      </CardContent>
    </Card>
  );
}
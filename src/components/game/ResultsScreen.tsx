"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type ResultsScreenProps = {
  survivors: string[];
  eliminated: string[];
  onTimeUp: () => void;
};

export function ResultsScreen({ survivors, eliminated, onTimeUp }: ResultsScreenProps) {
  const [timeLeft, setTimeLeft] = useState(5);

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          setTimeout(() => onTimeUp(), 0);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [onTimeUp]);

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="w-full max-w-4xl">
        <div className="text-center mb-6">
          <h1 className="text-4xl font-bold text-white mb-2">Round Results!</h1>
          <p className="text-xl text-white/80">Next round starts in {timeLeft}s</p>
        </div>
        
        <div className="grid md:grid-cols-2 gap-6">
          {/* Survivors Card */}
          <Card className="border-green-500 bg-green-50">
            <CardHeader className="bg-green-500 text-white">
              <CardTitle className="text-2xl text-center">
                ✅ Survivors ({survivors.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              {survivors.length > 0 ? (
                <div className="space-y-3">
                  {survivors.map((name, index) => (
                    <div key={index} className="bg-white p-3 rounded-lg border border-green-200 text-center font-medium text-green-800">
                      {name}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center text-green-600 font-medium">No survivors this round</p>
              )}
            </CardContent>
          </Card>

          {/* Eliminated Card */}
          <Card className="border-red-500 bg-red-50">
            <CardHeader className="bg-red-500 text-white">
              <CardTitle className="text-2xl text-center">
                ❌ Eliminated ({eliminated.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              {eliminated.length > 0 ? (
                <div className="space-y-3">
                  {eliminated.map((name, index) => (
                    <div key={index} className="bg-white p-3 rounded-lg border border-red-200 text-center font-medium text-red-800">
                      {name}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center text-red-600 font-medium">No eliminations this round</p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
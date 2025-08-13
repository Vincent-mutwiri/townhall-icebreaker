"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

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
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <Card className="w-full max-w-2xl mx-4">
        <CardHeader className="text-center">
          <CardTitle className="text-3xl font-bold">Round Results!</CardTitle>
          <p className="text-lg text-muted-foreground">Next round starts in {timeLeft}s</p>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid md:grid-cols-2 gap-6">
            <div className="text-center">
              <h3 className="text-xl font-semibold text-green-600 mb-3">✅ Survivors</h3>
              <div className="space-y-2">
                {survivors.length > 0 ? (
                  survivors.map((name, index) => (
                    <Badge key={index} variant="outline" className="text-green-700 border-green-300 bg-green-50 block">
                      {name}
                    </Badge>
                  ))
                ) : (
                  <p className="text-muted-foreground">None</p>
                )}
              </div>
            </div>
            
            <div className="text-center">
              <h3 className="text-xl font-semibold text-red-600 mb-3">❌ Eliminated</h3>
              <div className="space-y-2">
                {eliminated.length > 0 ? (
                  eliminated.map((name, index) => (
                    <Badge key={index} variant="outline" className="text-red-700 border-red-300 bg-red-50 block">
                      {name}
                    </Badge>
                  ))
                ) : (
                  <p className="text-muted-foreground">None</p>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
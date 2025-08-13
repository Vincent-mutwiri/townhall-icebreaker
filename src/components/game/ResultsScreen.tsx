"use client";

import { useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type ResultsScreenProps = {
  survivors: string[];
  eliminated: string[];
};

export function ResultsScreen({ survivors, eliminated }: ResultsScreenProps) {
  useEffect(() => {
    // Auto-progress to voting after 5 seconds
    const timer = setTimeout(() => {
      // This will be handled by the parent component
    }, 5000);

    return () => clearTimeout(timer);
  }, []);

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader className="text-center">
        <CardTitle className="text-2xl font-bold">Round Over!</CardTitle>
      </CardHeader>
      <CardContent className="text-center space-y-4">
        <div>
          <h3 className="text-lg font-semibold text-green-600">Survivors:</h3>
          <p>{survivors.length > 0 ? survivors.join(', ') : 'None'}</p>
        </div>
        <div>
          <h3 className="text-lg font-semibold text-red-600">Eliminated:</h3>
          <p>{eliminated.length > 0 ? eliminated.join(', ') : 'None'}</p>
        </div>
        <p className="text-sm text-muted-foreground">Starting voting in 5 seconds...</p>
      </CardContent>
    </Card>
  );
}
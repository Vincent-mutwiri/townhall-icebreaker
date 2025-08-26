// src/components/games/GameTemplateCard.tsx
"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Edit, Users, Clock, Trophy } from "lucide-react";
import { HostGameButton } from "./HostGameButton";

interface GameTemplateCardProps {
  template: any;
}

export function GameTemplateCard({ template }: GameTemplateCardProps) {
  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="line-clamp-2 mb-2">{template.title}</CardTitle>
            <div className="flex items-center gap-2 mb-2">
              <Badge variant="outline" className="capitalize">
                {template.mechanics || 'quiz'}
              </Badge>
              <Badge variant="secondary">
                {template.questions?.length || 0} questions
              </Badge>
            </div>
          </div>
        </div>
        <CardDescription className="line-clamp-3">
          {template.description || "No description provided"}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {/* Game Rules Summary */}
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="flex items-center gap-2">
              <Trophy className="h-4 w-4 text-blue-500" />
              <span>{template.rules?.basePoints || 100} base pts</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-green-500" />
              <span>{template.rules?.timeLimit || 30}s per Q</span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2 pt-2">
            <HostGameButton template={template} />
            <Button size="sm" variant="outline" asChild>
              <Link href={`/games/manage/${template._id}/edit`}>
                <Edit className="h-4 w-4" />
              </Link>
            </Button>
          </div>

          {/* Template Stats */}
          <div className="pt-2 border-t text-xs text-muted-foreground">
            <div className="flex justify-between">
              <span>Created {new Date(template.createdAt).toLocaleDateString()}</span>
              <span>Updated {new Date(template.updatedAt).toLocaleDateString()}</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// src/app/games/manage/page.tsx
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { redirect } from "next/navigation";
import connectToDatabase from "@/lib/database";
import { GameTemplate } from "@/models/GameTemplate";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, Play, Edit, Trash2, Users, Clock, Trophy } from "lucide-react";
import { HostGameButton } from "@/components/games/HostGameButton";

async function getUserGameTemplates(userId: string) {
  await connectToDatabase();
  const templates = await GameTemplate.find({ createdBy: userId }).sort({ createdAt: -1 });
  return JSON.parse(JSON.stringify(templates));
}

export default async function ManageGamesPage() {
  const session = await getServerSession(authOptions);
  
  if (!session?.user) {
    redirect('/login');
  }

  const userId = (session.user as any).id;
  const gameTemplates = await getUserGameTemplates(userId);

  return (
    <div className="container mx-auto p-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold mb-2">Manage Game Templates</h1>
          <p className="text-muted-foreground">
            Create and manage reusable game templates for live multiplayer sessions
          </p>
        </div>
        <Button asChild>
          <Link href="/games/manage/new/edit">
            <Plus className="mr-2 h-4 w-4" />
            Create New Game Template
          </Link>
        </Button>
      </div>

      {gameTemplates.length === 0 ? (
        <Card className="text-center py-12">
          <CardContent>
            <div className="mx-auto mb-4 h-12 w-12 rounded-full bg-muted flex items-center justify-center">
              <Trophy className="h-6 w-6 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold mb-2">No Game Templates Yet</h3>
            <p className="text-muted-foreground mb-4">
              Create your first game template to start hosting live multiplayer games
            </p>
            <Button asChild>
              <Link href="/games/manage/new/edit">
                <Plus className="mr-2 h-4 w-4" />
                Create Your First Game Template
              </Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {gameTemplates.map((template: any) => (
            <Card key={template._id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="line-clamp-2 mb-2">{template.title}</CardTitle>
                    <div className="flex items-center gap-2 mb-2">
                      <Badge variant="outline" className="capitalize">
                        {template.mechanics}
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
          ))}
        </div>
      )}

      {/* Quick Stats */}
      {gameTemplates.length > 0 && (
        <div className="mt-12 grid gap-4 md:grid-cols-3">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-2">
                <Trophy className="h-5 w-5 text-blue-500" />
                <div>
                  <p className="text-2xl font-bold">{gameTemplates.length}</p>
                  <p className="text-sm text-muted-foreground">Game Templates</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-2">
                <Users className="h-5 w-5 text-green-500" />
                <div>
                  <p className="text-2xl font-bold">
                    {gameTemplates.reduce((sum: number, t: any) => sum + (t.questions?.length || 0), 0)}
                  </p>
                  <p className="text-sm text-muted-foreground">Total Questions</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-2">
                <Play className="h-5 w-5 text-purple-500" />
                <div>
                  <p className="text-2xl font-bold">0</p>
                  <p className="text-sm text-muted-foreground">Games Hosted</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}

"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSocket } from "@/context/SocketProvider";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { toast, Toaster } from "sonner";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PlusCircle, Import, Edit, Trash2, Search, ChevronUp, ChevronDown, CheckSquare } from "lucide-react";

type Question = {
  _id: string;
  text: string;
  options: string[];
  correctAnswer: string;
};

interface SetupClientComponentProps {
  pin: string;
}

export function SetupClientComponent({ pin }: SetupClientComponentProps) {
  const router = useRouter();
  const { socket } = useSocket();
  const [gameQuestions, setGameQuestions] = useState<Question[]>([]);
  const [globalQuestions, setGlobalQuestions] = useState<Question[]>([]);
  const [newQuestion, setNewQuestion] = useState({ text: "", options: ["", "", "", ""], correctAnswer: "", isGlobal: false });
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedGlobalQuestions, setSelectedGlobalQuestions] = useState<string[]>([]);
  const [players, setPlayers] = useState<Array<{_id: string, name: string}>>([]);
  const [currentView, setCurrentView] = useState<'overview' | 'players' | 'questions'>('overview');
  
  const filteredGlobalQuestions = globalQuestions.filter(q => 
    q.text.toLowerCase().includes(searchTerm.toLowerCase())
  );

  useEffect(() => {
    const fetchData = async () => {
      const [globalRes, gameRes, playersRes] = await Promise.all([
        fetch('/api/questions'),
        fetch(`/api/game/${pin}/questions`),
        fetch(`/api/game/${pin}`)
      ]);
      
      if (globalRes.ok) {
        const globalData = await globalRes.json();
        setGlobalQuestions(globalData);
      }
      
      if (gameRes.ok) {
        const gameData = await gameRes.json();
        setGameQuestions(gameData);
      }
      
      if (playersRes.ok) {
        const gameData = await playersRes.json();
        setPlayers(gameData.players || []);
      }
    };

    fetchData();
  }, [pin]);

  // Socket event listeners
  useEffect(() => {
    if (!socket) return;

    const handlePlayerJoined = () => {
      // Refresh players list
      fetch(`/api/game/${pin}`)
        .then(res => res.json())
        .then(data => setPlayers(data.players || []))
        .catch(console.error);
    };

    socket.on('player-joined', handlePlayerJoined);
    socket.on('player-left', handlePlayerJoined);

    return () => {
      socket.off('player-joined', handlePlayerJoined);
      socket.off('player-left', handlePlayerJoined);
    };
  }, [socket, pin]);

  const handleAddQuestion = async () => {
    if (!newQuestion.text || newQuestion.options.some(opt => !opt) || !newQuestion.correctAnswer) {
      toast.error("Please fill in all fields");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/questions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newQuestion),
      });

      if (response.ok) {
        const question = await response.json();
        if (newQuestion.isGlobal) {
          setGlobalQuestions(prev => [...prev, question]);
        } else {
          setGameQuestions(prev => [...prev, question]);
        }
        setNewQuestion({ text: "", options: ["", "", "", ""], correctAnswer: "", isGlobal: false });
        toast.success("Question added successfully!");
      } else {
        toast.error("Failed to add question");
      }
    } catch (error) {
      toast.error("Error adding question");
    } finally {
      setLoading(false);
    }
  };

  const handleStartGame = async () => {
    if (gameQuestions.length === 0) {
      toast.error("Please add at least one question before starting the game.");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`/api/game/start`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pin }),
      });

      if (response.ok) {
        toast.success("Game started successfully!");
        router.push(`/game/${pin}`);
      } else {
        const data = await response.json();
        toast.error(data.message || "Failed to start game");
      }
    } catch (error) {
      toast.error("Error starting game");
    } finally {
      setLoading(false);
    }
  };

  const handleImportQuestions = async () => {
    if (selectedGlobalQuestions.length === 0) {
      toast.error("Please select at least one question to import");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`/api/game/${pin}/questions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ questionIds: selectedGlobalQuestions }),
      });

      if (response.ok) {
        const importedQuestions = await response.json();
        setGameQuestions(prev => [...prev, ...importedQuestions]);
        setSelectedGlobalQuestions([]);
        toast.success(`Imported ${importedQuestions.length} questions!`);
      } else {
        toast.error("Failed to import questions");
      }
    } catch (error) {
      toast.error("Error importing questions");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <Toaster />
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold">Game Setup</h1>
            <p className="text-muted-foreground">PIN: {pin}</p>
          </div>
          <div className="flex gap-2">
            <Button
              onClick={() => setCurrentView('overview')}
              variant={currentView === 'overview' ? 'default' : 'outline'}
            >
              Overview
            </Button>
            <Button
              onClick={() => setCurrentView('players')}
              variant={currentView === 'players' ? 'default' : 'outline'}
            >
              Players ({players.length})
            </Button>
            <Button
              onClick={() => setCurrentView('questions')}
              variant={currentView === 'questions' ? 'default' : 'outline'}
            >
              Questions ({gameQuestions.length})
            </Button>
          </div>
        </div>

        {currentView === 'overview' && (
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Game Status</CardTitle>
                <CardDescription>Current game information</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between">
                  <span>Players:</span>
                  <span className="font-semibold">{players.length}</span>
                </div>
                <div className="flex justify-between">
                  <span>Questions:</span>
                  <span className="font-semibold">{gameQuestions.length}</span>
                </div>
                <Button 
                  onClick={handleStartGame} 
                  className="w-full" 
                  disabled={loading || gameQuestions.length === 0}
                >
                  {loading ? 'Starting...' : 'Start Game'}
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
                <CardDescription>Manage your game</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button 
                  onClick={() => setCurrentView('questions')} 
                  className="w-full"
                  variant="outline"
                >
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Add Questions
                </Button>
                <Button 
                  onClick={() => setCurrentView('players')} 
                  className="w-full"
                  variant="outline"
                >
                  View Players
                </Button>
              </CardContent>
            </Card>
          </div>
        )}

        {currentView === 'players' && (
          <Card>
            <CardHeader>
              <CardTitle>Players ({players.length})</CardTitle>
              <CardDescription>Players who have joined your game</CardDescription>
            </CardHeader>
            <CardContent>
              {players.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  No players have joined yet. Share the game PIN: <strong>{pin}</strong>
                </p>
              ) : (
                <div className="grid gap-2">
                  {players.map((player, index) => (
                    <div key={player._id} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                      <span className="font-medium">{player.name}</span>
                      <span className="text-sm text-muted-foreground">Player #{index + 1}</span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {currentView === 'questions' && (
          <div className="space-y-6">
            {/* Add Question Form */}
            <Card>
              <CardHeader>
                <CardTitle>Add New Question</CardTitle>
                <CardDescription>Create a custom question for your game</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="question-text">Question</Label>
                  <Textarea
                    id="question-text"
                    placeholder="Enter your question..."
                    value={newQuestion.text}
                    onChange={(e) => setNewQuestion(prev => ({ ...prev, text: e.target.value }))}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  {newQuestion.options.map((option, index) => (
                    <div key={index}>
                      <Label htmlFor={`option-${index}`}>Option {index + 1}</Label>
                      <Input
                        id={`option-${index}`}
                        placeholder={`Option ${index + 1}`}
                        value={option}
                        onChange={(e) => {
                          const newOptions = [...newQuestion.options];
                          newOptions[index] = e.target.value;
                          setNewQuestion(prev => ({ ...prev, options: newOptions }));
                        }}
                      />
                    </div>
                  ))}
                </div>
                <div>
                  <Label htmlFor="correct-answer">Correct Answer</Label>
                  <Select
                    value={newQuestion.correctAnswer}
                    onValueChange={(value) => setNewQuestion(prev => ({ ...prev, correctAnswer: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select the correct answer" />
                    </SelectTrigger>
                    <SelectContent>
                      {newQuestion.options.map((option, index) => (
                        <SelectItem key={index} value={option} disabled={!option}>
                          Option {index + 1}: {option || 'Empty'}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="is-global"
                    checked={newQuestion.isGlobal}
                    onCheckedChange={(checked) => setNewQuestion(prev => ({ ...prev, isGlobal: checked }))}
                  />
                  <Label htmlFor="is-global">Save as global question (reusable)</Label>
                </div>
                <Button onClick={handleAddQuestion} disabled={loading}>
                  {loading ? 'Adding...' : 'Add Question'}
                </Button>
              </CardContent>
            </Card>

            {/* Game Questions */}
            <Card>
              <CardHeader>
                <CardTitle>Game Questions ({gameQuestions.length})</CardTitle>
                <CardDescription>Questions that will be used in this game</CardDescription>
              </CardHeader>
              <CardContent>
                {gameQuestions.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">
                    No questions added yet. Add some questions to start the game.
                  </p>
                ) : (
                  <div className="space-y-2">
                    {gameQuestions.map((question, index) => (
                      <div key={question._id} className="p-4 border rounded-lg">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <h4 className="font-medium">{index + 1}. {question.text}</h4>
                            <div className="mt-2 grid grid-cols-2 gap-2 text-sm">
                              {question.options.map((option, optIndex) => (
                                <span 
                                  key={optIndex} 
                                  className={`p-2 rounded ${option === question.correctAnswer ? 'bg-green-100 text-green-800' : 'bg-gray-100'}`}
                                >
                                  {option}
                                </span>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}

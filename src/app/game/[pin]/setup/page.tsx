import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { notFound } from 'next/navigation';
import connectToDatabase from '@/lib/database';
import { Game } from '@/models/Game';
import { SetupClientComponent } from './SetupClientComponent';
export default async function GameSetupPage({ params }: { params: Promise<{ pin: string }> }) {
  const { pin } = await params;
  const session = await getServerSession(authOptions);

  // Check authentication
  if (!session) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 to-red-100 p-4">
        <div className="text-center bg-white p-8 rounded-lg shadow-lg">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Access Denied</h1>
          <p className="text-gray-600 mb-4">You must be signed in to access the game setup page.</p>
          <a href="/login" className="text-blue-600 hover:underline font-medium">
            Sign in to continue
          </a>
        </div>
      </div>
    );
  }

  try {
    await connectToDatabase();
    const game = await Game.findOne({ pin });

    if (!game) {
      notFound();
    }

    // Security Check: Verify user is the host
    if ((session.user as any).id.toString() !== game.host.toString()) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 to-red-100 p-4">
          <div className="text-center bg-white p-8 rounded-lg shadow-lg">
            <h1 className="text-2xl font-bold text-red-600 mb-4">Access Denied</h1>
            <p className="text-gray-600 mb-4">You are not the host of this game.</p>
            <a href="/dashboard" className="text-blue-600 hover:underline font-medium">
              Return to Dashboard
            </a>
          </div>
        </div>
      );
    }

    // If authentication passes, render the client component
    return <SetupClientComponent pin={pin} />;

  } catch (error) {
    console.error('Error checking game access:', error);
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 to-red-100 p-4">
        <div className="text-center bg-white p-8 rounded-lg shadow-lg">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Error</h1>
          <p className="text-gray-600 mb-4">An error occurred while checking game access.</p>
          <a href="/dashboard" className="text-blue-600 hover:underline font-medium">
            Return to Dashboard
          </a>
        </div>
      </div>
    );
  }
}


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
  
  // Real-time player updates
  useEffect(() => {
    if (!socket) return;
    
    socket.emit('join-room', pin);
    
    const handlePlayerUpdate = async () => {
      try {
        const response = await fetch(`/api/game/${pin}`);
        if (response.ok) {
          const gameData = await response.json();
          setPlayers(gameData.players || []);
          console.log('Updated players:', gameData.players?.length || 0);
        }
      } catch (error) {
        console.error('Failed to update players:', error);
      }
    };
    
    socket.on('player-update', handlePlayerUpdate);
    socket.on('player-joined', handlePlayerUpdate);
    
    // Also listen for generic game state updates
    socket.on('game-state-update', handlePlayerUpdate);
    
    return () => {
      socket.off('player-update', handlePlayerUpdate);
      socket.off('player-joined', handlePlayerUpdate);
      socket.off('game-state-update', handlePlayerUpdate);
    };
  }, [socket, pin]);
  
  // Periodic refresh as backup
  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const response = await fetch(`/api/game/${pin}`);
        if (response.ok) {
          const gameData = await response.json();
          setPlayers(prev => {
            if (prev.length !== gameData.players?.length) {
              console.log('Player count changed via polling:', prev.length, '->', gameData.players?.length || 0);
              return gameData.players || [];
            }
            return prev;
          });
        }
      } catch (error) {
        console.error('Failed to poll for players:', error);
      }
    }, 3000); // Poll every 3 seconds as backup
    
    return () => clearInterval(interval);
  }, [pin]);

  const handleAddQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newQuestion.text.trim() || newQuestion.options.some(opt => !opt.trim()) || !newQuestion.correctAnswer) {
      toast.error("Please fill out all fields for the new question.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/questions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newQuestion),
      });
      const createdQuestion = await res.json();

      if (res.ok) {
        const addRes = await fetch(`/api/game/${pin}/questions`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ questionId: createdQuestion._id }),
        });
        
        if (addRes.ok) {
          setGameQuestions(prev => [...prev, createdQuestion]);
          if (createdQuestion.isGlobal) {
            setGlobalQuestions(prev => [...prev, createdQuestion]);
          }
          toast.success("Question added to your game!");
          setNewQuestion({ text: "", options: ["", "", "", ""], correctAnswer: "", isGlobal: false });
        } else {
          toast.error("Failed to add question to game.");
        }
      } else {
        toast.error(createdQuestion.message || "Failed to add question.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteQuestion = async (questionId: string) => {
    const res = await fetch(`/api/game/${pin}/questions`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ questionId }),
    });
    
    if (res.ok) {
      setGameQuestions(prev => prev.filter(q => q._id !== questionId));
      toast.success("Question removed from game.");
    } else {
      toast.error("Failed to remove question.");
    }
  };

  const handleUpdateQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingQuestion || !editingQuestion.text || editingQuestion.options.some(opt => !opt) || !editingQuestion.correctAnswer) {
      toast.error("Please fill out all fields.");
      return;
    }

    const res = await fetch('/api/questions', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(editingQuestion),
    });
    
    if (res.ok) {
      const updatedQuestion = await res.json();
      setGameQuestions(prev => prev.map(q => q._id === updatedQuestion._id ? updatedQuestion : q));
      setEditingQuestion(null);
      toast.success("Question updated!");
    } else {
      toast.error("Failed to update question.");
    }
  };

  const handleImportQuestion = async (question: Question) => {
    if (gameQuestions.some(q => q._id === question._id)) {
      toast.info("This question is already in your game.");
      return;
    }
    
    const res = await fetch(`/api/game/${pin}/questions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ questionId: question._id }),
    });
    
    if (res.ok) {
      setGameQuestions(prev => [...prev, question]);
      toast.success(`Imported "${question.text.substring(0, 20)}..."`);
    } else {
      toast.error("Failed to import question.");
    }
  };

  const handleBulkImport = async () => {
    if (selectedGlobalQuestions.length === 0) {
      toast.error("Please select questions to import.");
      return;
    }

    setLoading(true);
    try {
      const promises = selectedGlobalQuestions.map(questionId => 
        fetch(`/api/game/${pin}/questions`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ questionId }),
        })
      );
      
      await Promise.all(promises);
      
      const newQuestions = globalQuestions.filter(q => 
        selectedGlobalQuestions.includes(q._id) && 
        !gameQuestions.some(gq => gq._id === q._id)
      );
      
      setGameQuestions(prev => [...prev, ...newQuestions]);
      setSelectedGlobalQuestions([]);
      toast.success(`Imported ${newQuestions.length} questions!`);
    } catch {
      toast.error("Failed to import some questions.");
    } finally {
      setLoading(false);
    }
  };

  const moveQuestion = (index: number, direction: 'up' | 'down') => {
    const newQuestions = [...gameQuestions];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    
    if (targetIndex >= 0 && targetIndex < newQuestions.length) {
      [newQuestions[index], newQuestions[targetIndex]] = [newQuestions[targetIndex], newQuestions[index]];
      setGameQuestions(newQuestions);
    }
  };

  const handleStartGame = async () => {
    if (gameQuestions.length === 0) {
      toast.error("Please add at least one question to start the game.");
      return;
    }
    
    setLoading(true);
    try {
      // Use a fallback hostSocketId if socket is not connected
      const hostSocketId = socket?.id || `host-${pin}-${Date.now()}`;
      
      console.log('Starting game with:', { pin, hostSocketId, questionCount: gameQuestions.length });
      
      const response = await fetch('/api/game/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pin,
          hostSocketId,
          questionIds: gameQuestions.map(q => q._id),
        }),
      });
      
      const data = await response.json();
      console.log('Start game response:', data);

      if (response.ok) {
        // Emit socket event if connected, otherwise use gameController directly
        if (socket?.connected) {
          socket.emit('start-game', pin);
        } else {
          // Fallback: start game via gameController
          try {
            const { gameController } = await import('@/lib/gameController');
            await gameController.startGame(pin);
          } catch (error) {
            console.error('Failed to start game via gameController:', error);
          }
        }
        toast.success("Game started successfully!");
        router.push(`/game/${pin}?host=true`);
      } else {
        console.error('Start game error:', data);
        toast.error(data.message || "Failed to start game.");
      }
    } catch (error) {
      console.error('Start game error:', error);
      toast.error("Failed to start game. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Toaster richColors />
      <div className="container mx-auto p-4 md:p-8">
        <Card className="bg-white/95 backdrop-blur-sm shadow-xl">
          <CardHeader>
            <CardTitle className="text-3xl">Setup Your Game</CardTitle>
            <CardDescription>Game PIN: <span className="font-bold text-primary">{pin}</span></CardDescription>
            <p>Add questions for this session or import from the global bank. Players can join in the meantime.</p>
          </CardHeader>
          <CardContent className="space-y-8">
            {currentView === 'overview' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Players Summary Card */}
                <Card 
                  className="cursor-pointer hover:shadow-lg transition-shadow bg-blue-50 border-blue-200 hover:bg-blue-100"
                  onClick={() => setCurrentView('players')}
                >
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center justify-between">
                      <span>👥 Players in Lobby</span>
                      <span className="text-2xl font-bold text-blue-600">{players.length}</span>
                    </CardTitle>
                    <CardDescription>
                      {players.length === 0 
                        ? 'No players joined yet' 
                        : `${players.length} player${players.length !== 1 ? 's' : ''} ready to play`
                      }
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">
                      Click to view all players →
                    </p>
                  </CardContent>
                </Card>

                {/* Questions Summary Card */}
                <Card 
                  className="cursor-pointer hover:shadow-lg transition-shadow bg-green-50 border-green-200 hover:bg-green-100"
                  onClick={() => setCurrentView('questions')}
                >
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center justify-between">
                      <span>❓ Game Questions</span>
                      <span className="text-2xl font-bold text-green-600">{gameQuestions.length}</span>
                    </CardTitle>
                    <CardDescription>
                      {gameQuestions.length === 0 
                        ? 'No questions added yet' 
                        : `${gameQuestions.length} question${gameQuestions.length !== 1 ? 's' : ''} ready for game`
                      }
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">
                      Click to manage questions →
                    </p>
                  </CardContent>
                </Card>
              </div>
            )}

            {currentView === 'players' && (
              <>
                <Button variant="outline" onClick={() => setCurrentView('overview')} className="mb-4">
                  ← Back to Overview
                </Button>
                
                <Card className="bg-blue-50 border-blue-200">
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center justify-between">
                      <span>👥 Players in Lobby</span>
                      <span className="text-sm font-normal bg-blue-100 px-2 py-1 rounded">
                        {players.length} joined
                      </span>
                    </CardTitle>
                    <CardDescription>
                      Players can join using PIN: <span className="font-bold">{pin}</span>
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {players.length === 0 ? (
                      <p className="text-muted-foreground text-center py-4">
                        No players have joined yet. Share the PIN <span className="font-mono font-bold">{pin}</span> with your players.
                      </p>
                    ) : (
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                        {players.map((player, index) => (
                          <div key={player._id} className="bg-white p-2 rounded border text-center text-sm">
                            <span className="text-blue-600 font-bold">#{index + 1}</span> {player.name}
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </>
            )}

            {currentView === 'questions' && (
              <>
                <Button variant="outline" onClick={() => setCurrentView('overview')} className="mb-4">
                  ← Back to Overview
                </Button>
                <div>
                  <h3 className="text-xl font-semibold mb-2">Your Game&apos;s Questions ({gameQuestions.length})</h3>
                  <div className="border rounded-lg p-4 min-h-[100px]">
                    {gameQuestions.length > 0 ? (
                      <div className="space-y-2">
                        {gameQuestions.map((q, index) => (
                          <div key={q._id} className="flex items-center justify-between p-3 border rounded bg-card">
                            <div className="flex-1">
                              <p className="font-medium">{q.text}</p>
                              <p className="text-sm text-muted-foreground mt-1">
                                Correct: {q.correctAnswer}
                              </p>
                            </div>
                            <div className="flex gap-1">
                              <Button size="sm" variant="ghost" onClick={() => moveQuestion(index, 'up')} disabled={index === 0}>
                                <ChevronUp className="h-4 w-4" />
                              </Button>
                              <Button size="sm" variant="ghost" onClick={() => moveQuestion(index, 'down')} disabled={index === gameQuestions.length - 1}>
                                <ChevronDown className="h-4 w-4" />
                              </Button>
                              <Button size="sm" variant="outline" onClick={() => setEditingQuestion(q)}>
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button size="sm" variant="outline" onClick={() => handleDeleteQuestion(q._id)}>
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-muted-foreground">No questions added yet.</p>
                    )}
                  </div>
                </div>

                <Card className="bg-white/90 backdrop-blur-sm">
                  <CardHeader>
                    <h3 className="text-xl font-semibold flex items-center"><PlusCircle className="mr-2" /> Add a New Question</h3>
                  </CardHeader>
                  <CardContent>
                    <form onSubmit={handleAddQuestion} className="space-y-4">
                      <Textarea placeholder="Question text..." value={newQuestion.text} onChange={e => setNewQuestion(p => ({ ...p, text: e.target.value }))} />
                      <div className="grid grid-cols-2 gap-4">
                        {newQuestion.options.map((opt, i) => (
                          <Input key={i} placeholder={`Option ${i + 1}`} value={opt} onChange={e => {
                            const newOpts = [...newQuestion.options];
                            newOpts[i] = e.target.value;
                            setNewQuestion(p => ({ ...p, options: newOpts }));
                          }} />
                        ))}
                      </div>
                      <Select value={newQuestion.correctAnswer} onValueChange={value => setNewQuestion(p => ({ ...p, correctAnswer: value }))}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select correct answer" />
                        </SelectTrigger>
                        <SelectContent>
                          {newQuestion.options.filter(opt => opt.trim()).map((option, i) => (
                            <SelectItem key={i} value={option}>{option}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <div className="flex items-center space-x-2">
                        <Switch id="is-global" checked={newQuestion.isGlobal} onCheckedChange={checked => setNewQuestion(p => ({ ...p, isGlobal: checked }))} />
                        <Label htmlFor="is-global">Contribute this question to the global bank</Label>
                      </div>
                      <Button type="submit" disabled={loading}>
                        {loading ? "Adding..." : "Add Question to Game"}
                      </Button>
                    </form>
                  </CardContent>
                </Card>

                <Dialog>
                  <DialogTrigger asChild>
                    <Button variant="outline" className="w-full"><Import className="mr-2" /> Import from Global Bank</Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-4xl bg-white/95 backdrop-blur-sm">
                    <DialogHeader>
                      <DialogTitle>Global Question Bank ({globalQuestions.length} questions)</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div className="flex gap-2">
                        <div className="relative flex-1">
                          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                          <Input 
                            placeholder="Search questions..." 
                            value={searchTerm} 
                            onChange={e => setSearchTerm(e.target.value)}
                            className="pl-8"
                          />
                        </div>
                        <Button 
                          onClick={handleBulkImport} 
                          disabled={selectedGlobalQuestions.length === 0 || loading}
                          variant="outline"
                        >
                          <CheckSquare className="mr-2 h-4 w-4" />
                          Import Selected ({selectedGlobalQuestions.length})
                        </Button>
                      </div>
                      <div className="max-h-[50vh] overflow-y-auto">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead className="w-12">Select</TableHead>
                              <TableHead>Question</TableHead>
                              <TableHead className="text-right">Action</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {filteredGlobalQuestions.map(q => {
                              const isSelected = selectedGlobalQuestions.includes(q._id);
                              const isAlreadyInGame = gameQuestions.some(gq => gq._id === q._id);
                              return (
                                <TableRow key={q._id} className={isAlreadyInGame ? "opacity-50" : ""}>
                                  <TableCell>
                                    <input 
                                      type="checkbox" 
                                      checked={isSelected}
                                      disabled={isAlreadyInGame}
                                      onChange={e => {
                                        if (e.target.checked) {
                                          setSelectedGlobalQuestions(prev => [...prev, q._id]);
                                        } else {
                                          setSelectedGlobalQuestions(prev => prev.filter(id => id !== q._id));
                                        }
                                      }}
                                      className="rounded"
                                    />
                                  </TableCell>
                                  <TableCell>
                                    <div>
                                      <p className="font-medium">{q.text}</p>
                                      <p className="text-sm text-muted-foreground">Correct: {q.correctAnswer}</p>
                                    </div>
                                  </TableCell>
                                  <TableCell className="text-right">
                                    <Button 
                                      size="sm" 
                                      onClick={() => handleImportQuestion(q)}
                                      disabled={isAlreadyInGame}
                                    >
                                      {isAlreadyInGame ? "Added" : "Import"}
                                    </Button>
                                  </TableCell>
                                </TableRow>
                              );
                            })}
                          </TableBody>
                        </Table>
                        {filteredGlobalQuestions.length === 0 && (
                          <p className="text-center text-muted-foreground py-8">
                            {searchTerm ? "No questions match your search." : "No global questions available."}
                          </p>
                        )}
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              </>
            )}

            {editingQuestion && (
              <Dialog open={!!editingQuestion} onOpenChange={() => setEditingQuestion(null)}>
                <DialogContent className="bg-white/95 backdrop-blur-sm">
                  <DialogHeader>
                    <DialogTitle>Edit Question</DialogTitle>
                  </DialogHeader>
                  <form onSubmit={handleUpdateQuestion} className="space-y-4">
                    <Textarea 
                      placeholder="Question text..." 
                      value={editingQuestion.text} 
                      onChange={e => setEditingQuestion(prev => prev ? { ...prev, text: e.target.value } : null)} 
                    />
                    <div className="grid grid-cols-2 gap-4">
                      {editingQuestion.options.map((opt, i) => (
                        <Input 
                          key={i} 
                          placeholder={`Option ${i + 1}`} 
                          value={opt} 
                          onChange={e => {
                            const newOpts = [...editingQuestion.options];
                            newOpts[i] = e.target.value;
                            setEditingQuestion(prev => prev ? { ...prev, options: newOpts } : null);
                          }} 
                        />
                      ))}
                    </div>
                    <Select 
                      value={editingQuestion.correctAnswer} 
                      onValueChange={value => setEditingQuestion(prev => prev ? { ...prev, correctAnswer: value } : null)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select correct answer" />
                      </SelectTrigger>
                      <SelectContent>
                        {editingQuestion.options.filter(opt => opt.trim()).map((option, i) => (
                          <SelectItem key={i} value={option}>{option}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <div className="flex gap-2">
                      <Button type="submit">Update Question</Button>
                      <Button type="button" variant="outline" onClick={() => setEditingQuestion(null)}>Cancel</Button>
                    </div>
                  </form>
                </DialogContent>
              </Dialog>
            )}

            {/* Start Game Section - Always Visible */}
            <div className="pt-8 text-center space-y-4">
              {gameQuestions.length > 0 && players.length > 0 && (
                <p className="text-sm text-muted-foreground">
                  Ready to start! Your game has {gameQuestions.length} question{gameQuestions.length !== 1 ? 's' : ''} and {players.length} player{players.length !== 1 ? 's' : ''}.
                </p>
              )}
              <Button 
                size="lg" 
                className="bg-green-600 hover:bg-green-700" 
                onClick={handleStartGame}
                disabled={gameQuestions.length === 0 || players.length === 0}
              >
                {gameQuestions.length === 0 ? "Add Questions to Start" : 
                 players.length === 0 ? "Waiting for Players" : "Start Game Now!"}
              </Button>
              {(gameQuestions.length === 0 || players.length === 0) && (
                <p className="text-sm text-muted-foreground">
                  Need at least 1 question and 1 player to start
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
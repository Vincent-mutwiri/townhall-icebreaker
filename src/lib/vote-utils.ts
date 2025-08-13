// src/lib/vote-utils.ts

const votes: Record<string, Record<string, number>> = {}; // { pin: { playerId: count } }

export function getVoteWinner(pin: string): string | null {
  const gameVotes = votes[pin];
  if (!gameVotes || Object.keys(gameVotes).length === 0) {
    return null;
  }

  // Find the player with the most votes
  const winnerId = Object.keys(gameVotes).reduce((a, b) =>
    gameVotes[a] > gameVotes[b] ? a : b
  );

  // Clear votes for the next round
  delete votes[pin];

  return winnerId;
}

export function recordVote(pin: string, votedForPlayerId: string) {
  if (!votes[pin]) {
    votes[pin] = {};
  }
  votes[pin][votedForPlayerId] = (votes[pin][votedForPlayerId] || 0) + 1;
}

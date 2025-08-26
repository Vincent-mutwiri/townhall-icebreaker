// src/app/games/manage/[id]/edit/page.tsx
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { redirect } from "next/navigation";
import connectToDatabase from "@/lib/database";
import { GameTemplate } from "@/models/GameTemplate";
import { GameTemplateEditor } from "@/components/games/GameTemplateEditor";
import { notFound } from 'next/navigation';

async function getGameTemplate(templateId: string, userId: string) {
  await connectToDatabase();
  
  if (templateId === 'new') {
    // Return a new template structure
    return {
      _id: 'new',
      title: '',
      description: '',
      mechanics: 'quiz',
      rules: {
        basePoints: 100,
        timeLimit: 30,
        timeBonusMax: 50,
        hintCost: 10,
        allowHints: true,
        shuffleQuestions: true,
        shuffleAnswers: true
      },
      questions: [],
      createdBy: userId,
      isNew: true
    };
  }

  const template = await GameTemplate.findOne({ _id: templateId, createdBy: userId });
  if (!template) {
    return null;
  }
  
  return JSON.parse(JSON.stringify(template));
}

export default async function GameTemplateEditPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getServerSession(authOptions);
  
  if (!session?.user) {
    redirect('/login');
  }

  const userId = (session.user as any).id;
  const gameTemplate = await getGameTemplate(id, userId);

  if (!gameTemplate) {
    notFound();
  }

  return (
    <div className="container mx-auto p-8">
      <GameTemplateEditor 
        initialTemplate={gameTemplate} 
        userId={userId}
      />
    </div>
  );
}

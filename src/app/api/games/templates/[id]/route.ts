// src/app/api/games/templates/[id]/route.ts
import { NextResponse } from 'next/server';
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import connectToDatabase from '@/lib/database';
import { GameTemplate } from '@/models/GameTemplate';

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ message: 'Not authenticated' }, { status: 401 });
  }

  try {
    await connectToDatabase();
    const { id } = await params;
    const userId = (session.user as any).id;
    
    const template = await GameTemplate.findOne({ _id: id, createdBy: userId });
    
    if (!template) {
      return NextResponse.json({ message: 'Game template not found' }, { status: 404 });
    }
    
    return NextResponse.json({ template });
  } catch (error) {
    console.error('Error fetching game template:', error);
    return NextResponse.json({ message: 'An unexpected error occurred.' }, { status: 500 });
  }
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ message: 'Not authenticated' }, { status: 401 });
  }

  try {
    await connectToDatabase();
    const { id } = await params;
    const userId = (session.user as any).id;
    const { title, description, mechanics, rules, questions } = await request.json();

    // Find the template and verify ownership
    const template = await GameTemplate.findOne({ _id: id, createdBy: userId });
    if (!template) {
      return NextResponse.json({ message: 'Game template not found' }, { status: 404 });
    }

    // Validation
    if (!title?.trim()) {
      return NextResponse.json({ message: 'Title is required' }, { status: 400 });
    }

    if (!questions || questions.length === 0) {
      return NextResponse.json({ message: 'At least one question is required' }, { status: 400 });
    }

    // Validate questions
    for (let i = 0; i < questions.length; i++) {
      const question = questions[i];
      if (!question.text?.trim()) {
        return NextResponse.json({ 
          message: `Question ${i + 1} is missing text` 
        }, { status: 400 });
      }
      
      if (!question.options || question.options.length < 2) {
        return NextResponse.json({ 
          message: `Question ${i + 1} needs at least 2 answer options` 
        }, { status: 400 });
      }
      
      if (!question.correctAnswer?.trim()) {
        return NextResponse.json({ 
          message: `Question ${i + 1} is missing a correct answer` 
        }, { status: 400 });
      }
      
      if (!question.options.includes(question.correctAnswer)) {
        return NextResponse.json({ 
          message: `Question ${i + 1} correct answer must be one of the options` 
        }, { status: 400 });
      }
    }

    // Update the template
    await GameTemplate.updateOne(
      { _id: id, createdBy: userId },
      {
        $set: {
          title: title.trim(),
          description: description?.trim() || '',
          mechanics: mechanics || 'quiz',
          rules: {
            basePoints: rules?.basePoints || 100,
            timeLimit: rules?.timeLimit || 30,
            timeBonusMax: rules?.timeBonusMax || 50,
            hintCost: rules?.hintCost || 10,
            allowHints: rules?.allowHints ?? true,
            shuffleQuestions: rules?.shuffleQuestions ?? true,
            shuffleAnswers: rules?.shuffleAnswers ?? true,
          },
          questions,
          updatedAt: new Date(),
        }
      }
    );

    return NextResponse.json({ message: 'Game template updated successfully' });

  } catch (error) {
    console.error('Error updating game template:', error);
    return NextResponse.json({ message: 'An unexpected error occurred.' }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ message: 'Not authenticated' }, { status: 401 });
  }

  try {
    await connectToDatabase();
    const { id } = await params;
    const userId = (session.user as any).id;
    
    const result = await GameTemplate.deleteOne({ _id: id, createdBy: userId });
    
    if (result.deletedCount === 0) {
      return NextResponse.json({ message: 'Game template not found' }, { status: 404 });
    }
    
    return NextResponse.json({ message: 'Game template deleted successfully' });
  } catch (error) {
    console.error('Error deleting game template:', error);
    return NextResponse.json({ message: 'An unexpected error occurred.' }, { status: 500 });
  }
}

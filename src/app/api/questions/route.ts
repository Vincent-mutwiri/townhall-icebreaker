import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/database';
import { Question } from '@/models/Question';

export async function POST(request: Request) {
  try {
    await connectToDatabase();
    const body = await request.json();
    const { text, options, correctAnswer, isGlobal } = body;

    if (!text || !options || options.length !== 4 || !correctAnswer) {
      return NextResponse.json({ message: 'Invalid question data.' }, { status: 400 });
    }

    const newQuestion = new Question({
      text,
      options,
      correctAnswer,
      isGlobal: !!isGlobal,
    });

    await newQuestion.save();

    return NextResponse.json(newQuestion, { status: 201 });
  } catch (error) {
    console.error('Error creating question:', error);
    return NextResponse.json({ message: 'An unexpected error occurred.' }, { status: 500 });
  }
}

export async function GET() {
  try {
    await connectToDatabase();
    const globalQuestions = await Question.find({ isGlobal: true });
    return NextResponse.json(globalQuestions);
  } catch (error) {
    console.error('Error fetching global questions:', error);
    return NextResponse.json({ message: 'An unexpected error occurred.' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    await connectToDatabase();
    const body = await request.json();
    const { _id, text, options, correctAnswer } = body;

    if (!_id || !text || !options || options.length !== 4 || !correctAnswer) {
      return NextResponse.json({ message: 'Invalid question data.' }, { status: 400 });
    }

    const updatedQuestion = await Question.findByIdAndUpdate(
      _id,
      { text, options, correctAnswer },
      { new: true }
    );

    if (!updatedQuestion) {
      return NextResponse.json({ message: 'Question not found.' }, { status: 404 });
    }

    return NextResponse.json(updatedQuestion);
  } catch (error) {
    console.error('Error updating question:', error);
    return NextResponse.json({ message: 'An unexpected error occurred.' }, { status: 500 });
  }
}
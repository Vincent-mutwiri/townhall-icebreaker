import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/database';
import { Setting } from '@/models/Setting';

export async function POST(request: Request) {
  try {
    await connectToDatabase();
    const { key, value } = await request.json();

    if (!key || value === undefined) {
      return NextResponse.json({ message: 'Key and value are required.' }, { status: 400 });
    }

    const updatedSetting = await Setting.findOneAndUpdate(
      { key },
      { $set: { value } },
      { new: true, upsert: true }
    );

    return NextResponse.json(updatedSetting);
  } catch (error) {
    console.error('Error saving setting:', error);
    return NextResponse.json({ message: 'An unexpected error occurred.' }, { status: 500 });
  }
}

export async function GET() {
  try {
    await connectToDatabase();
    const settings = await Setting.find({});

    const settingsMap = settings.reduce((acc, setting) => {
      acc[setting.key] = setting.value;
      return acc;
    }, {} as Record<string, string>);

    return NextResponse.json(settingsMap);
  } catch (error) {
    console.error('Error fetching settings:', error);
    return NextResponse.json({ message: 'An unexpected error occurred.' }, { status: 500 });
  }
}
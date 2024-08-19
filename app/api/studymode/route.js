import { GoogleGenerativeAI } from '@google/generative-ai';
import { NextResponse } from 'next/server';

// Initialize the Google Generative AI with your API key
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

export async function POST(request) {
  try {
    const { flashcard, userAnswer } = await request.json();

    // Initialize the model (using the most capable one available)
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    // Prepare the prompt for Gemini
    const prompt = `
      Given the following flashcard and user answer, evaluate if the answer is correct:
      Flashcard Front: ${flashcard.front}
      Flashcard Back: ${flashcard.back}
      User's Answer: ${userAnswer}

      Provide your response in the following JSON format:
      {
        "isCorrect": boolean,
        "explanation": "A brief explanation of why the answer is correct or incorrect",
        "suggestion": "A suggestion for improvement if the answer is incorrect, or encouragement if correct"
      }
    `;

    // Generate content using Gemini
    const result = await model.generateContent(prompt);
    const response = result.response;
    const text = response.text();

    // Parse the JSON response
    const evaluation = JSON.parse(text);

    return NextResponse.json(evaluation);
  } catch (error) {
    console.error('Error in StudyMode API:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
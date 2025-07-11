import { NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req: Request) {
  try {
    const { prompt } = await req.json();

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: `For this conversation, help me deduce the following metrics or data.
1. Extract how many number of tries the user had to reach a perfect response or their own satisfactory response or till end of conversation.
2. Extract the scores the user scored in each try. For reference, the scores are on a 8 point or 16 point scale. Ensure to not process the actual prompt explaining the scoring rubric. For reference, the data to look for will be like "Total Score:" If Total Score is not available, return null.

Provide the output in this exact format:
try_count: [number of tries]
score_summary: [scores for each try]

Example output:
try_count: 3
score_summary: try 1, score 4/8; try 2, score 6/8; try 3, score 7/8

If no tries or scores are available, return:
try_count: 0
score_summary: null`
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.3,
      max_tokens: 500,
    });

    const response = completion.choices[0]?.message?.content || 'No response generated';

    return NextResponse.json({ 
      success: true, 
      response 
    });
  } catch (error) {
    console.error('LLM API error:', error);
    return NextResponse.json(
      { error: 'Failed to process with LLM' },
      { status: 500 }
    );
  }
} 
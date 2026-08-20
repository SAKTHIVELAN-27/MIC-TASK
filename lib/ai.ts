import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY || '');

export async function askAI(question: string, stats: object): Promise<string> {
  if (!process.env.GOOGLE_AI_API_KEY) {
    throw new Error('AI_UNAVAILABLE');
  }

  const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

  const systemContext = `You are an event analytics assistant for a real-time event check-in system.
Use ONLY the supplied event statistics below to answer questions.
Never invent, estimate, or guess numbers that are not in the data.
If a requested metric is unavailable, clearly say so.
Explain numbers in a friendly, concise, professional manner.
Format numbers with commas where appropriate.

CURRENT EVENT STATISTICS:
${JSON.stringify(stats, null, 2)}`;

  const result = await model.generateContent([
    { text: systemContext },
    { text: `Question: ${question}` },
  ]);

  return result.response.text();
}

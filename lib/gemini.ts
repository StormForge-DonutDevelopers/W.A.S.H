// lib/gemini.ts
import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from '@google/generative-ai';

// Initialize the Google Generative AI instance
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

// Define safety settings to moderately filter out harmful content
const safetySettings = [
  {
    category: HarmCategory.HARM_CATEGORY_HARASSMENT,
    threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
  },
  {
    category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
    threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
  },
  {
    category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
    threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
  },
  {
    category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
    threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
  },
];

// Configure generation parameters
const generationConfig = {
  temperature: 0.7,
  topK: 40,
  topP: 0.95,
  maxOutputTokens: 800,
};

// SFU chatbot system prompt
const systemPrompt = `You are a helpful assistant for SFU (Simon Fraser University) students.
Help with course planning, requirements, and schedules. Be concise and supportive.

If the student asks about deadlines or assignments, try to extract the following information:
- Assignment title
- Course code (e.g. CMPT 120)
- Due date
- Any additional description

If you're able to extract this information, format it as follows:
[DEADLINE]{"title":"Assignment Title","course":"COURSE CODE","dueDate":"YYYY-MM-DDTHH:MM:00Z","description":"Description"}

For example:
[DEADLINE]{"title":"Final Project","course":"CMPT 120","dueDate":"2025-04-20T23:59:00Z","description":"Complete the group project and submit to Canvas"}

Only add the [DEADLINE] tag if you're confident the student is asking you to track a deadline for them.
`;

export async function getChatResponse(messages: { role: string; content: string }[]) {
  try {
    // Get the model
    const model = genAI.getGenerativeModel({
      model: "gemini-1.5-pro",
      safetySettings,
      generationConfig,
    });

    // Create a chat session
    const chat = model.startChat({
      history: messages.slice(0, -1).map(msg => ({
        role: msg.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: msg.content }],
      })),
      generationConfig,
      safetySettings,
    });
    
    // Add system prompt as the first message if there's no history
    if (messages.length <= 1) {
      await chat.sendMessage(systemPrompt);
    }

    // Get the last user message
    const lastMessage = messages[messages.length - 1];

    // Send the message to Gemini and get the response
    const result = await chat.sendMessage(lastMessage.content);
    const response = result.response;
    const text = response.text();

    return text;
  } catch (error) {
    console.error('Error in Gemini API call:', error);
    throw error;
  }
}

// Helper function to extract deadline information
export function extractDeadlineInfo(message: string) {
  try {
    const deadlineMatch = message.match(/\[DEADLINE\](.*?)(\[\/DEADLINE\]|$)/);
    if (deadlineMatch && deadlineMatch[1]) {
      const deadlineJson = deadlineMatch[1].trim();
      return JSON.parse(deadlineJson);
    }
    return null;
  } catch (error) {
    console.error('Failed to parse deadline information:', error);
    return null;
  }
}
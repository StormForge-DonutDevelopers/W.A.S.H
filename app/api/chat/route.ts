// app/api/chat/route.ts
import { NextRequest } from 'next/server'
import { Message as VercelChatMessage, StreamingTextResponse } from 'ai'
import { ChatOpenAI } from 'langchain/chat_models/openai'
import { BytesOutputParser } from 'langchain/schema/output_parser'
import { PromptTemplate } from 'langchain/prompts'
import { RunnableSequence } from 'langchain/schema/runnable'
import { 
  StringOutputParser,
  CommaSeparatedListOutputParser
} from 'langchain/schema/output_parser'
import {
  ChatPromptTemplate,
  HumanMessagePromptTemplate,
  SystemMessagePromptTemplate,
  MessagesPlaceholder,
} from 'langchain/prompts'

// Convert messages from the Vercel AI SDK format to the LangChain format
const formatMessage = (message: VercelChatMessage) => {
  return `${message.role}: ${message.content}`
}

export async function POST(req: NextRequest) {
  try {
    const { messages } = await req.json()

    // Get the last message
    const lastMessage = messages[messages.length - 1].content.toLowerCase()
    
    // Check if the message is about creating or tracking a deadline
    const isDeadlineRequest = 
      lastMessage.includes('deadline') || 
      lastMessage.includes('assignment') || 
      lastMessage.includes('due') ||
      lastMessage.includes('homework') ||
      lastMessage.includes('project') ||
      lastMessage.includes('exam') ||
      lastMessage.includes('remind me') ||
      lastMessage.includes('track') ||
      lastMessage.includes('schedule')

    const chatModel = new ChatOpenAI({
      modelName: 'gpt-3.5-turbo',
      temperature: 0.7,
    })

    const outputParser = new BytesOutputParser()

    let prompt

    if (isDeadlineRequest) {
      // System prompt specifically for handling deadline-related requests
      prompt = ChatPromptTemplate.fromMessages([
        SystemMessagePromptTemplate.fromTemplate(
          `You are an AI assistant for SFU students, helping them track assignments and deadlines.
           
           If a student asks you to track, remember, or create a deadline for an assignment, exam, or project:
           
           1. Extract the following information from their request:
              - Title of the assignment/exam/project
              - Course code (e.g., CMPT 120, MACM 101)
              - Due date and time
              - Any description or notes
           
           2. If any information is missing, politely ask for clarification.
           
           3. When you have the necessary information, format your response with a [DEADLINE] JSON object at the end:
           
           [DEADLINE]{"title":"Assignment Title","course":"COURSE CODE","dueDate":"YYYY-MM-DDTHH:MM:00Z","description":"Description text"}
           
           The JSON must be valid and include at least the title, course, and dueDate fields.
           
           Always be helpful, conversational, and friendly in your responses.`
        ),
        new MessagesPlaceholder('chat_history'),
        HumanMessagePromptTemplate.fromTemplate('{text}'),
      ])
    } else {
      // General system prompt for course assistance
      prompt = ChatPromptTemplate.fromMessages([
        SystemMessagePromptTemplate.fromTemplate(
          `You are an AI course assistant for SFU (Simon Fraser University) students, specializing in Computer Science curriculum.
           
           You can help with:
           - Course selection and prerequisites
           - Understanding degree requirements
           - Planning academic schedules
           - Explaining concepts from computing science, mathematics, and related fields
           - Answering questions about the SFU CS program
           
           When appropriate, provide specific information about SFU courses like CMPT 120, CMPT 225, MACM 101, etc.
           
           Always be respectful, supportive, and concise in your responses.`
        ),
        new MessagesPlaceholder('chat_history'),
        HumanMessagePromptTemplate.fromTemplate('{text}'),
      ])
    }

    // Create the chain
    const chain = prompt.pipe(chatModel).pipe(outputParser)

    // Prepare the chat history
    const formattedPreviousMessages = messages.slice(0, -1).map(formatMessage)
    
    // Call the chain
    const stream = await chain.stream({
      chat_history: formattedPreviousMessages,
      text: messages[messages.length - 1].content,
    })

    // Return the stream
    return new StreamingTextResponse(stream)
  } catch (error) {
    console.error('Error in chat processing:', error)
    return new Response(JSON.stringify({ error: 'Failed to process chat' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }
}
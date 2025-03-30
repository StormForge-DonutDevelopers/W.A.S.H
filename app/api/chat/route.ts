// // app/api/chat/route.ts
// import { NextRequest } from 'next/server'
// import { Message as VercelChatMessage, StreamingTextResponse } from 'ai'
// import { ChatOpenAI } from '@langchain/openai' // Updated import
// import { BytesOutputParser } from '@langchain/core/output_parsers' // Updated import
// import { 
//   ChatPromptTemplate,
//   HumanMessagePromptTemplate,
//   SystemMessagePromptTemplate,
//   MessagesPlaceholder,
// } from '@langchain/core/prompts' // Updated import

// // =========== RATE LIMITING AND CACHING =============
// // Simple in-memory cache to reduce identical requests
// const responseCache = new Map();
// // Track last request time to enforce throttling
// let lastRequestTime = 0;
// const MIN_REQUEST_INTERVAL = 3000; // 3 seconds minimum between requests
// // Rate limit tracking by IP
// const rateLimit = new Map();
// // Maximum requests in a time window
// const MAX_REQUESTS_PER_WINDOW = 10;
// const RATE_LIMIT_WINDOW = 60000; // 1 minute window

// // Convert messages from the Vercel AI SDK format to the LangChain format
// const formatMessage = (message: VercelChatMessage) => {
//   return `${message.role}: ${message.content}`
// }

// // Generate cache key from messages
// const generateCacheKey = (messages: VercelChatMessage[]) => {
//   // Use only the last message for the cache key to increase cache hits
//   const lastMsg = messages[messages.length - 1];
//   return `${lastMsg.role}:${lastMsg.content.toLowerCase().trim()}`;
// }

// // Check if user has exceeded rate limit
// const checkRateLimit = (identifier: string) => {
//   const now = Date.now();
//   const userRateInfo = rateLimit.get(identifier) || { count: 0, windowStart: now };
  
//   // Reset window if needed
//   if (now - userRateInfo.windowStart > RATE_LIMIT_WINDOW) {
//     userRateInfo.count = 0;
//     userRateInfo.windowStart = now;
//   }
  
//   // Check if over limit
//   if (userRateInfo.count >= MAX_REQUESTS_PER_WINDOW) {
//     return true;
//   }
  
//   // Increment counter
//   userRateInfo.count++;
//   rateLimit.set(identifier, userRateInfo);
  
//   return false;
// }

// // Retry with exponential backoff
// const retryWithBackoff = async (fn, maxRetries = 3, initialDelay = 1000) => {
//   let retries = 0;
  
//   while (true) {
//     try {
//       return await fn();
//     } catch (error) {
//       if (retries >= maxRetries || error?.status !== 429) {
//         throw error;
//       }
      
//       const delay = initialDelay * Math.pow(2, retries);
//       console.log(`Rate limited. Retrying in ${delay}ms...`);
//       await new Promise(r => setTimeout(r, delay));
//       retries++;
//     }
//   }
// };

// // =========== MAIN REQUEST HANDLER =============
// export async function POST(req: NextRequest) {
//   try {
//     // Use IP as identifier for rate limiting
//     const clientIp = req.headers.get('x-forwarded-for') || 'unknown';
    
//     // Step 1: Check global throttling
//     const now = Date.now();
//     if (now - lastRequestTime < MIN_REQUEST_INTERVAL) {
//       return new Response(
//         JSON.stringify({
//           content: "I'm processing your previous request. Please wait a moment before sending another message."
//         }),
//         { status: 200, headers: { 'Content-Type': 'application/json' } }
//       );
//     }
    
//     lastRequestTime = now;
    
//     // Step 2: Check per-client rate limiting
//     if (checkRateLimit(clientIp)) {
//       return new Response(
//         JSON.stringify({ 
//           content: "You've sent too many messages in a short time. Please try again in a minute." 
//         }), 
//         { status: 200, headers: { 'Content-Type': 'application/json' } }
//       );
//     }
    
//     // Step 3: Parse request
//     const { messages } = await req.json();
    
//     // Detailed logging for debugging
//     console.log(`Request from ${clientIp}`);
//     console.log(`Request payload size: ${JSON.stringify(messages).length} characters`);
//     console.log(`Number of messages: ${messages.length}`);
    
//     // Step 4: Check cache for identical request
//     const cacheKey = generateCacheKey(messages);
//     if (responseCache.has(cacheKey)) {
//       console.log("Cache hit - returning cached response");
//       return new Response(responseCache.get(cacheKey), {
//         headers: { 'Content-Type': 'text/plain' }
//       });
//     }
    
//     // Step 5: Limit message history to reduce token usage
//     // Only keep the most recent 4 messages to reduce context size
//     const limitedMessages = messages.slice(-4);
    
//     // Get the last message
//     const lastMessage = limitedMessages[limitedMessages.length - 1].content.toLowerCase();
    
//     // Step 6: Check if the message is about creating or tracking a deadline
//     const isDeadlineRequest = 
//       lastMessage.includes('deadline') || 
//       lastMessage.includes('assignment') || 
//       lastMessage.includes('due');

//     // Step 7: Create a more efficient chat model with lower token usage
//     const chatModel = new ChatOpenAI({
//       modelName: 'gpt-3.5-turbo', // More available capacity than gpt-4
//       temperature: 0.5,          // Lower temperature for more consistent responses
//       maxTokens: 300,            // Limit token usage
//       streaming: true            // Keep streaming for better UX
//     });

//     const outputParser = new BytesOutputParser();

//     let prompt;

//     // Step 8: Use simplified system prompts
//     if (isDeadlineRequest) {
//       // Simplified deadline prompt
//       prompt = ChatPromptTemplate.fromMessages([
//         SystemMessagePromptTemplate.fromTemplate(
//           `You help SFU students track assignments and deadlines. Be brief.
//            When you have deadline info, format: [DEADLINE]{"title":"Title","course":"CODE","dueDate":"YYYY-MM-DDTHH:MM:00Z","description":"Text"}`
//         ),
//         new MessagesPlaceholder('chat_history'),
//         HumanMessagePromptTemplate.fromTemplate('{text}'),
//       ]);
//     } else {
//       // Simplified general prompt
//       prompt = ChatPromptTemplate.fromMessages([
//         SystemMessagePromptTemplate.fromTemplate(
//           `You are an SFU course assistant. Be brief and helpful.
//            Provide concise answers about courses, prerequisites, and requirements.`
//         ),
//         new MessagesPlaceholder('chat_history'),
//         HumanMessagePromptTemplate.fromTemplate('{text}'),
//       ]);
//     }

//     // Prepare the chat history - use limited history
//     const formattedPreviousMessages = limitedMessages.slice(0, -1).map(formatMessage);
    
//     // Step 9: Create the chain and add retry logic
//     const chain = prompt.pipe(chatModel).pipe(outputParser);
    
//     // Step 10: Call the chain with retry logic
//     const streamWithRetry = await retryWithBackoff(async () => {
//       return chain.stream({
//         chat_history: formattedPreviousMessages,
//         text: limitedMessages[limitedMessages.length - 1].content,
//       });
//     });
    
//     // Create a transformed stream to cache the response
//     const cachedStream = new TransformStream({
//       start(controller) {
//         this.chunks = [];
//       },
//       transform(chunk, controller) {
//         this.chunks.push(chunk);
//         controller.enqueue(chunk);
//       },
//       flush(controller) {
//         // Save complete response to cache
//         const completeResponse = new TextDecoder().decode(
//           Buffer.concat(this.chunks)
//         );
        
//         // Only cache if it's not too large
//         if (completeResponse.length < 10000) {
//           responseCache.set(cacheKey, completeResponse);
          
//           // Limit cache size to prevent memory issues
//           if (responseCache.size > 50) {
//             // Delete oldest entry
//             const firstKey = responseCache.keys().next().value;
//             responseCache.delete(firstKey);
//           }
//         }
//       }
//     });

//     // Return the stream
//     return new StreamingTextResponse(streamWithRetry.pipeThrough(cachedStream));
//   } catch (error: any) {
//     console.error('Error in chat processing:', error);
//     console.error('Error details:', JSON.stringify(error, null, 2));
    
//     // Provide a more detailed error response
//     let errorMessage = 'Failed to process chat';
    
//     if (error.name === 'AbortError' || error.message?.includes('timeout')) {
//       errorMessage = 'Request took too long to process';
//     } else if (error.response?.status === 429 || error.message?.includes('rate limit')) {
//       errorMessage = 'OpenAI rate limit exceeded. Please try again later';
//     }
    
//     return new Response(
//       JSON.stringify({ 
//         content: "I'm having trouble connecting to my knowledge base right now. Please try again in a moment."
//       }), 
//       { status: 200, headers: { 'Content-Type': 'application/json' } }
//     );
//   }
// }

// app/api/chat/route.ts
import { NextRequest } from 'next/server'
import { StreamingTextResponse } from 'ai'

// A set of predefined responses for common questions
const predefinedResponses = {
  "course": "SFU offers a variety of computing science courses. Core courses include CMPT 120 (introduction to programming), CMPT 125 (data structures), CMPT 225 (algorithms), and CMPT 295 (computer systems). What specific course are you interested in?",
  
  "requirement": "For a Computing Science major at SFU, you need to complete lower division requirements including CMPT 120, 125, 127, 225, 276, 295, MACM 101, and Math courses. Upper division requirements include CMPT 300, 307, 320, 354, and 5 CMPT electives at the 300/400 level.",
  
  "deadline": "I can help you track assignment deadlines. Please provide the assignment title, course code, due date, and any additional details.",
  
  "schedule": "When planning your schedule, consider balancing your workload across terms. Most students take 3-4 computing courses per term, allowing time for other requirements and electives.",
  
  "prereq": "Most upper-division CMPT courses require CMPT 225 and 275/276 as prerequisites. Some specialized courses have additional requirements. Which course are you asking about specifically?",
  
  "default": "I'm here to help with course planning, requirements, and schedules for SFU Computing Science students. What would you like to know about?"
};

// Mock deadline extraction function - improved to be more flexible
// Enhanced deadline extraction function
const extractDeadline = (message: string) => {
  console.log("Trying to extract deadline from:", message);
  
  // More flexible pattern matching
  const assignmentMatch = message.match(/(?:assignment|project|homework|lab|exam|quiz|paper|report)(?:\s*#?\s*|\s+)(\w+|\d+)?/i);
  
  // Match course codes more flexibly
  const courseMatch = message.match(/(?:CMPT|cmpt|MACM|macm|MATH|math|ENGL|engl|BUS|bus|ECON|econ)\s*(\d+)/i);
  
  // More comprehensive date matching
  // First try to match explicit date formats
  let dateMatch = message.match(/(january|february|march|april|may|june|july|august|september|october|november|december)\s*(\d{1,2})(?:st|nd|rd|th)?(?:[,\s]+(\d{4}))?/i);
  
  // If no explicit date, try to match relative dates
  if (!dateMatch) {
    const relativeMatch = message.match(/(next|this)\s+(monday|tuesday|wednesday|thursday|friday|saturday|sunday|week)/i);
    
    if (relativeMatch) {
      // Calculate date based on relative reference
      const today = new Date();
      let targetDate = new Date();
      
      if (relativeMatch[1].toLowerCase() === 'next') {
        targetDate.setDate(today.getDate() + 7); // Next week
      }
      
      // Adjust for specific day of week
      const dayOfWeek = relativeMatch[2].toLowerCase();
      if (dayOfWeek !== 'week') {
        const daysMap = { 'monday': 1, 'tuesday': 2, 'wednesday': 3, 'thursday': 4, 'friday': 5, 'saturday': 6, 'sunday': 0 };
        const targetDay = daysMap[dayOfWeek];
        
        // Calculate days to add
        const currentDay = today.getDay();
        let daysToAdd = targetDay - currentDay;
        if (daysToAdd <= 0) daysToAdd += 7;
        
        targetDate.setDate(today.getDate() + daysToAdd);
      }
      
      // Create a format that mimics the explicit date match
      const months = ['january', 'february', 'march', 'april', 'may', 'june', 'july', 'august', 'september', 'october', 'november', 'december'];
      dateMatch = [
        null, // Full match (not used)
        months[targetDate.getMonth()], // Month name
        targetDate.getDate().toString(), // Day
        targetDate.getFullYear().toString() // Year
      ];
    }
  }
  
  console.log("Matches:", { assignmentMatch, courseMatch, dateMatch });
  
  // If we have both assignment and course, we can create a deadline
  if ((assignmentMatch || message.toLowerCase().includes('assignment')) && courseMatch) {
    // For assignment, use the matched text or default to "Assignment"
    const assignmentTitle = assignmentMatch 
      ? assignmentMatch[0].charAt(0).toUpperCase() + assignmentMatch[0].slice(1) 
      : "Assignment";
    
    // Current date as fallback if no date specified
    const today = new Date();
    today.setDate(today.getDate() + 7); // Default to one week from now
    
    const year = dateMatch && dateMatch[3] ? parseInt(dateMatch[3]) : 2025;
    const month = dateMatch ? getMonthNumber(dateMatch[1]) : (today.getMonth() + 1).toString().padStart(2, '0');
    const day = dateMatch ? dateMatch[2].padStart(2, '0') : today.getDate().toString().padStart(2, '0');
    
    const deadline = {
      title: assignmentTitle,
      course: `${courseMatch[0].toUpperCase()}`,
      dueDate: `${year}-${month}-${day}T23:59:00Z`,
      description: "Added from chat assistant"
    };
    
    console.log("Created deadline:", deadline);
    return `[DEADLINE]${JSON.stringify(deadline)}`;
  }
  
  return "";
};

// Helper function to convert month name to number
const getMonthNumber = (monthName: string) => {
  const months = {
    "january": "01", "february": "02", "march": "03", "april": "04",
    "may": "05", "june": "06", "july": "07", "august": "08",
    "september": "09", "october": "10", "november": "11", "december": "12"
  };
  
  return months[monthName.toLowerCase()] || "01";
};

// Create a realistic streaming response from text
function createStream(text: string) {
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      // Split the text into words and send them with slight delays
      const words = text.split(' ');
      
      for (let i = 0; i < words.length; i++) {
        const chunk = words[i] + (i < words.length - 1 ? ' ' : '');
        controller.enqueue(encoder.encode(chunk));
        
        // Simulate realistic typing speed with variable delays
        await new Promise(resolve => setTimeout(resolve, Math.random() * 50 + 20));
      }
      
      controller.close();
    }
  });
  
  return stream;
}

// Get a response based on keywords in the message
function getResponse(message: string) {
  message = message.toLowerCase();
  
  // Check for keywords and return appropriate response
  if (message.includes('assignment') || message.includes('deadline') || message.includes('due date')) {
    // Check if it's a specific assignment addition request - more keywords
    if (message.includes('track') || message.includes('add') || message.includes('remember') || 
        message.includes('create') || message.includes('set') || message.includes('make a') || 
        message.includes('put') || message.includes('help me with')) {
      
      // Always try to extract deadline from any request that might be deadline-related
      const deadline = extractDeadline(message);
      console.log("Extraction result:", deadline ? "Found deadline" : "No deadline found");
      
      if (deadline) {
        return `I've added that deadline to your schedule. I'll remind you as the due date approaches. ${deadline}`;
      } else {
        return "I'd be happy to track that assignment for you. Please provide the assignment name, course code (e.g., CMPT 120), and due date.";
      }
    }
    return predefinedResponses.deadline;
  } else if (message.includes('course') || message.includes('class') || message.includes('cmpt')) {
    return predefinedResponses.course;
  } else if (message.includes('requirement') || message.includes('degree') || message.includes('graduate')) {
    return predefinedResponses.requirement;
  } else if (message.includes('schedule') || message.includes('timetable') || message.includes('plan')) {
    return predefinedResponses.schedule;
  } else if (message.includes('prerequisite') || message.includes('prereq')) {
    return predefinedResponses.prereq;
  }
  
  // Default response
  return predefinedResponses.default;
}

export async function POST(req: NextRequest) {
  try {
    // Parse the incoming request body with error handling
    const body = await req.json();
    
    // Check if messages exists and is an array
    if (!body || !body.messages || !Array.isArray(body.messages) || body.messages.length === 0) {
      return new Response(
        JSON.stringify({ 
          error: 'Invalid request format',
          message: "I didn't receive a valid message. How can I help you?"
        }), 
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    }
    
    // Get the last message from the user
    const lastMessage = body.messages[body.messages.length - 1].content;
    
    // Generate a response based on the message content
    const responseText = getResponse(lastMessage);
    
    // Return a streaming response
    return new StreamingTextResponse(createStream(responseText));
  } catch (error) {
    console.error('Error in chat processing:', error);
    
    return new Response(
      JSON.stringify({ 
        error: 'Failed to process request',
        message: "I'm having some trouble right now. Please try again shortly."
      }), 
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
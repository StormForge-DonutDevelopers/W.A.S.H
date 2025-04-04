// app/api/chat/route.ts
import { NextRequest } from 'next/server';
import { getChatResponse } from '@/lib/gemini';

// Simple in-memory cache and rate limiting
const responseCache = new Map();
const rateLimit = new Map();
const MAX_REQUESTS_PER_MINUTE = 10;
const RATE_LIMIT_WINDOW = 60000; // 1 minute window
let lastRequestTime = 0;
const MIN_REQUEST_INTERVAL = 1000; // 1 second minimum between requests

// Create a streaming text response
function createStreamingResponse(text: string) {
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      // Split the text into small chunks to simulate streaming
      const chunks = text.split(/(?<=\s)/);
      
      for (let i = 0; i < chunks.length; i++) {
        controller.enqueue(encoder.encode(chunks[i]));
        
        // Add a small delay to simulate realistic typing
        await new Promise(resolve => setTimeout(resolve, Math.random() * 30 + 10));
      }
      
      controller.close();
    }
  });
  
  return new Response(stream, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' }
  });
}

// Generate cache key from messages
const generateCacheKey = (messages) => {
  // Use only the last message for the cache key to increase cache hits
  const lastMsg = messages[messages.length - 1];
  return `${lastMsg.role}:${lastMsg.content.toLowerCase().trim()}`;
};

// Check if user has exceeded rate limit
const checkRateLimit = (identifier: string) => {
  const now = Date.now();
  const userRateInfo = rateLimit.get(identifier) || { count: 0, windowStart: now };
  
  // Reset window if needed
  if (now - userRateInfo.windowStart > RATE_LIMIT_WINDOW) {
    userRateInfo.count = 0;
    userRateInfo.windowStart = now;
  }
  
  // Check if over limit
  if (userRateInfo.count >= MAX_REQUESTS_PER_MINUTE) {
    return true;
  }
  
  // Increment counter
  userRateInfo.count++;
  rateLimit.set(identifier, userRateInfo);
  
  return false;
};

export async function POST(req: NextRequest) {
  try {
    // Use IP as identifier for rate limiting
    const clientIp = req.headers.get('x-forwarded-for') || 'unknown';
    
    // Step 1: Check global throttling
    const now = Date.now();
    if (now - lastRequestTime < MIN_REQUEST_INTERVAL) {
      return new Response(
        JSON.stringify({
          content: "I'm processing your previous request. Please wait a moment before sending another message."
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    }
    
    lastRequestTime = now;
    
    // Step 2: Check per-client rate limiting
    if (checkRateLimit(clientIp)) {
      return new Response(
        JSON.stringify({ 
          content: "You've sent too many messages in a short time. Please try again in a minute." 
        }), 
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    }
    
    // Step 3: Parse request
    const { messages } = await req.json();
    
    // Step 4: Check cache for identical request
    const cacheKey = generateCacheKey(messages);
    if (responseCache.has(cacheKey)) {
      console.log("Cache hit - returning cached response");
      return new Response(responseCache.get(cacheKey), {
        headers: { 'Content-Type': 'text/plain' }
      });
    }
    
    // Step 5: Limit message history to reduce token usage
    // Only keep the most recent 4 messages to reduce context size
    const limitedMessages = messages.slice(-4);
    
    // Step 6: Call Gemini API
    const response = await getChatResponse(limitedMessages);
    
    // Step 7: Add to cache if not too large
    if (response.length < 10000) {
      responseCache.set(cacheKey, response);
      
      // Limit cache size to prevent memory issues
      if (responseCache.size > 50) {
        // Delete oldest entry
        const firstKey = responseCache.keys().next().value;
        responseCache.delete(firstKey);
      }
    }
    
    // Step 8: Return streaming response
    return createStreamingResponse(response);
    
  } catch (error: any) {
    console.error('Error in chat processing:', error);
    
    // Provide a detailed error response
    return new Response(
      JSON.stringify({ 
        content: "I'm having trouble connecting to my knowledge base right now. Please try again in a moment."
      }), 
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
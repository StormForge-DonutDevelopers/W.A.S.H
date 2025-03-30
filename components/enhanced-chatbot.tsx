// "use client"

// import { useState, useEffect, useRef } from "react"
// import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
// import { Button } from "@/components/ui/button"
// import { Input } from "@/components/ui/input"
// import { ScrollArea } from "@/components/ui/scroll-area"
// import { MessageCircle, Send, Calendar, Plus, AlertTriangle, RefreshCw } from "lucide-react"

// type Deadline = {
//   id: string
//   title: string
//   dueDate: Date
//   course: string
//   description?: string
//   completed: boolean
// }

// interface Message {
//   id: string
//   content: string
//   role: "user" | "assistant" | "system"
//   timestamp: Date
// }

// export function EnhancedChatbot() {
//   // Instead of fetching from API, store deadlines in local state only
//   const [deadlines, setDeadlines] = useState<Deadline[]>([])
//   const [showDeadlines, setShowDeadlines] = useState(false)
//   const scrollAreaRef = useRef<HTMLDivElement>(null)
  
//   // Chat state
//   const [messages, setMessages] = useState<Message[]>([
//     {
//       id: "welcome",
//       content: "Hi there! I'm your SFU course assistant. Ask me about courses, requirements, scheduling, or help me track your assignments and deadlines.",
//       role: "assistant",
//       timestamp: new Date()
//     }
//   ])
//   const [input, setInput] = useState("")
//   const [isProcessing, setIsProcessing] = useState(false)
//   const [error, setError] = useState<string | null>(null)
//   const [lastMessageTime, setLastMessageTime] = useState(0)
//   const [consecutiveErrors, setConsecutiveErrors] = useState(0)
//   const [shouldShowTyping, setShouldShowTyping] = useState(false)
//   const messageQueue = useRef<Message[]>([])
//   const processingTimeout = useRef<NodeJS.Timeout | null>(null)
  
//   // Throttling config
//   const MIN_MESSAGE_INTERVAL = 2000 // 2 seconds between messages
//   const MAX_CONSECUTIVE_ERRORS = 3
//   const ERROR_COOLDOWN = 10000 // 10 seconds cooldown after max errors

//   // Auto scroll to bottom of chat
//   useEffect(() => {
//     if (scrollAreaRef.current) {
//       const scrollContainer = scrollAreaRef.current
//       scrollContainer.scrollTop = scrollContainer.scrollHeight
//     }
//   }, [messages, shouldShowTyping])
  
//   // Clean up timeout on unmount
//   useEffect(() => {
//     return () => {
//       if (processingTimeout.current) {
//         clearTimeout(processingTimeout.current)
//       }
//     }
//   }, [])
  
//   // Process message queue
//   useEffect(() => {
//     const processQueue = async () => {
//       if (messageQueue.current.length > 0 && !isProcessing) {
//         const nextMessage = messageQueue.current.shift()
//         if (nextMessage) {
//           await sendMessageToAPI(nextMessage.content)
//         }
//       }
//     }
    
//     processQueue()
//   }, [isProcessing, messageQueue.current.length])

//   const parseAndAddDeadline = (message: string) => {
//     try {
//       const deadlineMatch = message.match(/\[DEADLINE\](.*?)(\[\/DEADLINE\]|$)/)
//       if (deadlineMatch && deadlineMatch[1]) {
//         const deadlineJson = deadlineMatch[1].trim()
//         const deadlineData = JSON.parse(deadlineJson)
        
//         // Create a new deadline object and add to local state
//         const newDeadline: Deadline = {
//           id: Date.now().toString(), // Generate a random ID
//           title: deadlineData.title,
//           course: deadlineData.course,
//           dueDate: new Date(deadlineData.dueDate),
//           description: deadlineData.description,
//           completed: false
//         }
        
//         // Add to local state only (no API call)
//         setDeadlines(prev => [...prev, newDeadline])
        
//         // Add notification message to chat
//         setMessages(prev => [...prev, {
//           id: `notification-${Date.now()}`,
//           role: "assistant",
//           content: `✅ Deadline added: ${newDeadline.title} for ${newDeadline.course}`,
//           timestamp: new Date()
//         }])
//       }
//     } catch (error) {
//       console.error("Failed to parse or add deadline:", error)
//     }
//   }

//   const toggleComplete = (id: string) => {
//     // Update deadline completion status in local state only
//     setDeadlines(deadlines.map(d => 
//       d.id === id ? { ...d, completed: !d.completed } : d
//     ))
//   }

//   const formatDate = (date: Date) => {
//     return new Date(date).toLocaleDateString(undefined, { 
//       year: 'numeric', 
//       month: 'short', 
//       day: 'numeric', 
//       hour: '2-digit', 
//       minute: '2-digit' 
//     })
//   }

//   const getDaysRemaining = (dueDate: Date) => {
//     const now = new Date()
//     const due = new Date(dueDate)
//     const diffTime = due.getTime() - now.getTime()
//     const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
//     return diffDays
//   }
  
//   // Send message to API with retry and exponential backoff
//   const sendMessageToAPI = async (userMessage: string) => {
//     setIsProcessing(true)
//     setShouldShowTyping(true)
    
//     try {
//       // Prepare API payload - only use limited context
//       const recentMessages = messages
//         .filter(msg => msg.id !== "welcome") // Filter out welcome message
//         .slice(-4) // Only send last 4 messages
//         .map(msg => ({
//           role: msg.role,
//           content: msg.content
//         }));
      
//       // Add current message
//       recentMessages.push({
//         role: "user",
//         content: userMessage
//       });
      
//       // Send with retry logic
//       let retryCount = 0;
//       let error = null;
//       let response = null;
//       const maxRetries = 2;
//       let backoffDelay = 1000;
      
//       while (retryCount <= maxRetries && !response) {
//         try {
//           response = await fetch('/api/chat', {
//             method: 'POST',
//             headers: {
//               'Content-Type': 'application/json',
//             },
//             body: JSON.stringify({ messages: recentMessages }),
//           });
          
//           if (!response.ok) {
//             throw new Error(`Server responded with ${response.status}`);
//           }
//         } catch (err) {
//           error = err;
//           retryCount++;
          
//           if (retryCount <= maxRetries) {
//             console.log(`Retry attempt ${retryCount} in ${backoffDelay}ms`);
//             await new Promise(r => setTimeout(r, backoffDelay));
//             backoffDelay *= 2; // Exponential backoff
//           }
//         }
//       }
      
//       if (!response) {
//         throw error || new Error("Failed to send message after retries");
//       }
      
//       // Handle streaming response
//       const reader = response.body?.getReader();
//       const decoder = new TextDecoder();
//       let responseText = '';
      
//       if (reader) {
//         while (true) {
//           const { done, value } = await reader.read();
//           if (done) break;
          
//           const chunk = decoder.decode(value, { stream: true });
//           responseText += chunk;
//         }
//       } else {
//         // Fallback for non-streaming response
//         responseText = await response.text();
//       }
      
//       // Reset error counter on success
//       setConsecutiveErrors(0);
      
//       // Add bot response
//       const botResponse: Message = {
//         id: Date.now().toString(),
//         content: responseText,
//         role: "assistant",
//         timestamp: new Date()
//       };
      
//       setMessages(prev => [...prev, botResponse]);
      
//       // Check for deadline information
//       if (responseText.includes("[DEADLINE]")) {
//         parseAndAddDeadline(responseText);
//       }
//     } catch (err: any) {
//       console.error("Error sending message:", err);
      
//       // Increment error counter
//       setConsecutiveErrors(prev => prev + 1);
      
//       // Add error message
//       const errorMsg = 
//         err.message?.includes("429") || err.message?.includes("rate limit") 
//           ? "I'm receiving too many requests right now. Please try again in a moment."
//           : "I'm having trouble connecting. Please try again shortly.";
      
//       setMessages(prev => [...prev, {
//         id: `error-${Date.now()}`,
//         content: errorMsg,
//         role: "assistant",
//         timestamp: new Date()
//       }]);
      
//       setError(errorMsg);
//     } finally {
//       setShouldShowTyping(false);
//       setIsProcessing(false);
      
//       // Set cooldown if too many consecutive errors
//       if (consecutiveErrors >= MAX_CONSECUTIVE_ERRORS) {
//         setError("Too many errors. Please wait a moment before trying again.");
        
//         // Reset after cooldown
//         processingTimeout.current = setTimeout(() => {
//           setConsecutiveErrors(0);
//           setError(null);
//         }, ERROR_COOLDOWN);
//       }
//     }
//   };
  
//   // Handle message submission with throttling
//   const handleSubmit = async (e: React.FormEvent) => {
//     e.preventDefault();
    
//     if (!input.trim() || isProcessing) return;
    
//     const now = Date.now();
//     const timeSinceLastMessage = now - lastMessageTime;
    
//     // Add user message immediately
//     const userMessage: Message = {
//       id: now.toString(),
//       content: input,
//       role: "user",
//       timestamp: new Date()
//     };
    
//     setMessages(prev => [...prev, userMessage]);
//     setInput("");
//     setLastMessageTime(now);
    
//     // If too many errors, show warning
//     if (consecutiveErrors >= MAX_CONSECUTIVE_ERRORS) {
//       setError("Please wait a moment before sending more messages.");
//       return;
//     }
    
//     // Check if we need to throttle
//     if (timeSinceLastMessage < MIN_MESSAGE_INTERVAL) {
//       // Add to queue instead of sending immediately
//       messageQueue.current.push(userMessage);
      
//       // Show a notification about throttling
//       setMessages(prev => [...prev, {
//         id: `throttle-${Date.now()}`,
//         content: "I'm processing your previous message. Your new message has been queued.",
//         role: "system",
//         timestamp: new Date()
//       }]);
//     } else {
//       // Send immediately
//       await sendMessageToAPI(userMessage.content);
//     }
//   };
  
//   // Retry sending the last user message
//   const handleRetry = () => {
//     // Clear error state
//     setError(null);
    
//     // Find last user message
//     const lastUserMessage = [...messages].reverse().find(m => m.role === "user");
//     if (lastUserMessage) {
//       // Call send message directly
//       sendMessageToAPI(lastUserMessage.content);
//     }
//   };
  
//   // Sort deadlines by due date (closest first)
//   const sortedDeadlines = [...deadlines].sort((a, b) => 
//     new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()
//   )

//   // Get upcoming deadlines (next 7 days)
//   const upcomingDeadlines = sortedDeadlines.filter(
//     d => !d.completed && getDaysRemaining(d.dueDate) <= 7 && getDaysRemaining(d.dueDate) >= 0
//   )

//   return (
//     <Card className="h-[600px] flex flex-col">
//       <CardHeader>
//         <CardTitle className="flex items-center justify-between">
//           <div className="flex items-center gap-2">
//             <MessageCircle className="h-5 w-5" />
//             Course Assistant
//           </div>
//           <Button 
//             variant="outline" 
//             size="sm" 
//             onClick={() => setShowDeadlines(!showDeadlines)}
//             className="flex items-center gap-1"
//           >
//             <Calendar className="h-4 w-4" />
//             {showDeadlines ? "Hide Deadlines" : `Deadlines (${upcomingDeadlines.length})`}
//           </Button>
//         </CardTitle>
//       </CardHeader>
//       <CardContent className="flex-1 flex flex-col">
//         {showDeadlines ? (
//           <div className="flex-1 overflow-auto">
//             <h3 className="font-medium mb-2">Upcoming Deadlines</h3>
            
//             {sortedDeadlines.length === 0 ? (
//               <div className="text-center p-4 text-muted-foreground">
//                 No deadlines found. Ask the assistant to help you track assignments!
//               </div>
//             ) : upcomingDeadlines.length === 0 ? (
//               <div className="text-center p-4 text-muted-foreground">
//                 No upcoming deadlines in the next 7 days.
//               </div>
//             ) : (
//               <div className="space-y-3">
//                 {upcomingDeadlines.map(deadline => (
//                   <div 
//                     key={deadline.id} 
//                     className="border rounded-md p-3 relative"
//                   >
//                     <div className="flex items-start justify-between">
//                       <div>
//                         <h4 className="font-medium">{deadline.title}</h4>
//                         <div className="text-sm text-muted-foreground">{deadline.course}</div>
//                       </div>
//                       <div className="flex items-center">
//                         {getDaysRemaining(deadline.dueDate) <= 2 && (
//                           <AlertTriangle size={16} className="text-red-500 mr-1" />
//                         )}
//                         <span className={`text-sm ${getDaysRemaining(deadline.dueDate) <= 2 ? 'text-red-500 font-medium' : ''}`}>
//                           {getDaysRemaining(deadline.dueDate) === 0 
//                             ? 'Due today!' 
//                             : `${getDaysRemaining(deadline.dueDate)} days left`}
//                         </span>
//                       </div>
//                     </div>
//                     <div className="text-xs mt-2">{formatDate(deadline.dueDate)}</div>
//                     {deadline.description && (
//                       <div className="text-sm mt-1">{deadline.description}</div>
//                     )}
//                     <div className="mt-2">
//                       <Button 
//                         variant="outline" 
//                         size="sm" 
//                         onClick={() => toggleComplete(deadline.id)}
//                       >
//                         Mark as Complete
//                       </Button>
//                     </div>
//                   </div>
//                 ))}
//               </div>
//             )}
            
//             <div className="mt-4">
//               <h3 className="font-medium mb-2">All Deadlines</h3>
//               <div className="space-y-2">
//                 {sortedDeadlines.map(deadline => (
//                   <div 
//                     key={deadline.id}
//                     className={`flex items-center justify-between p-2 rounded-md ${
//                       deadline.completed ? 'bg-muted line-through text-muted-foreground' : ''
//                     }`}
//                   >
//                     <div className="flex items-center">
//                       <input 
//                         type="checkbox" 
//                         checked={deadline.completed}
//                         onChange={() => toggleComplete(deadline.id)}
//                         className="mr-2" 
//                       />
//                       <div>
//                         <div className="text-sm font-medium">{deadline.title}</div>
//                         <div className="text-xs text-muted-foreground">{deadline.course} - {formatDate(deadline.dueDate)}</div>
//                       </div>
//                     </div>
//                   </div>
//                 ))}
//               </div>
//             </div>
//           </div>
//         ) : (
//           <>
//             <ScrollArea className="flex-1 pr-4" ref={scrollAreaRef}>
//               <div className="space-y-4">
//                 {messages.map((message) => {
//                   // Clean content by removing deadline tags
//                   const cleanContent = message.content.replace(/\[DEADLINE\].*?(\[\/DEADLINE\]|$)/g, '');
//                   return (
//                     <div key={message.id} className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}>
//                       <div
//                         className={`rounded-lg px-4 py-2 max-w-[80%] ${
//                           message.role === "user" ? "bg-primary text-primary-foreground" : 
//                           message.role === "system" ? "bg-secondary bg-opacity-20 text-foreground" :
//                           "bg-muted text-foreground"
//                         }`}
//                       >
//                         <p>{cleanContent}</p>
//                         <p className="text-xs opacity-70 mt-1">
//                           {message.timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
//                         </p>
//                       </div>
//                     </div>
//                   );
//                 })}
                
//                 {shouldShowTyping && (
//                   <div className="flex justify-start">
//                     <div className="rounded-lg px-4 py-2 bg-muted text-foreground animate-pulse">
//                       <p>Thinking...</p>
//                     </div>
//                   </div>
//                 )}
                
//                 {error && !isProcessing && (
//                   <div className="flex justify-center mt-2">
//                     <Button 
//                       variant="outline" 
//                       size="sm" 
//                       onClick={handleRetry}
//                       className="flex items-center gap-1"
//                       disabled={consecutiveErrors >= MAX_CONSECUTIVE_ERRORS}
//                     >
//                       <RefreshCw className="h-3 w-3" />
//                       Retry
//                     </Button>
//                   </div>
//                 )}
//               </div>
//             </ScrollArea>
//             <form className="flex gap-2 mt-4" onSubmit={handleSubmit}>
//               <Input
//                 placeholder="Ask about courses, requirements, or add a deadline..."
//                 value={input}
//                 onChange={(e) => setInput(e.target.value)}
//                 disabled={isProcessing || (consecutiveErrors >= MAX_CONSECUTIVE_ERRORS)}
//               />
//               <Button 
//                 type="submit" 
//                 disabled={isProcessing || !input.trim() || (consecutiveErrors >= MAX_CONSECUTIVE_ERRORS)}
//               >
//                 <Send className="h-4 w-4" />
//               </Button>
//             </form>
//           </>
//         )}
//       </CardContent>
//     </Card>
//   )
// }

"use client"

import { useState, useEffect, useRef } from "react"
import { useChat } from "ai/react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { MessageCircle, Send, Calendar, AlertTriangle } from "lucide-react"
import { useUser } from "@auth0/nextjs-auth0/client"

type Deadline = {
  id: string
  title: string
  dueDate: Date
  course: string
  description?: string
  completed: boolean
}

export function EnhancedChatbot() {
  const { user, isLoading } = useUser()
  const [deadlines, setDeadlines] = useState<Deadline[]>([])
  const [showDeadlines, setShowDeadlines] = useState(false)
  const scrollAreaRef = useRef<HTMLDivElement>(null)
  
  const { messages, input, handleInputChange, handleSubmit, isLoading: isChatLoading } = useChat({
    api: "/api/chat",
    onFinish: (message) => {
      // Check if message contains deadline information
      if (message.content.includes("[DEADLINE]")) {
        parseAndAddDeadline(message.content)
      }
    }
  })

  // Ensure the welcome message is always visible
  const [showWelcome, setShowWelcome] = useState(true)
  
  useEffect(() => {
    if (messages.length > 0) {
      setShowWelcome(false)
    }
  }, [messages])

  // Fetch deadlines on load if user is authenticated
  useEffect(() => {
    if (user?.sub) {
      fetchDeadlines()
    }
  }, [user])

  // Auto scroll to bottom of chat - improved version
  useEffect(() => {
    // Use a short timeout to ensure the scroll happens after render
    const scrollTimeout = setTimeout(() => {
      if (scrollAreaRef.current) {
        // Using scrollIntoView for better browser compatibility
        const lastMessage = document.querySelector('.message-container:last-child');
        if (lastMessage) {
          lastMessage.scrollIntoView({ behavior: 'smooth', block: 'end' });
        } else {
          // Fallback to direct scrolling if querySelector fails
          scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight;
        }
      }
    }, 100);
    
    return () => clearTimeout(scrollTimeout);
  }, [messages, isChatLoading]);

  const fetchDeadlines = async () => {
    try {
      const response = await fetch('/api/deadlines')
      if (response.ok) {
        const data = await response.json()
        setDeadlines(data)
      }
    } catch (error) {
      console.error("Failed to fetch deadlines:", error)
    }
  }

  const parseAndAddDeadline = async (message: string) => {
    // Example format: [DEADLINE]{"title":"Assignment 1","course":"CMPT 120","dueDate":"2025-03-15T23:59:00Z","description":"Complete lab exercises 1-5"}
    try {
      const deadlineMatch = message.match(/\[DEADLINE\](.*?)(\[\/DEADLINE\]|$)/)
      if (deadlineMatch && deadlineMatch[1]) {
        const deadlineJson = deadlineMatch[1].trim()
        console.log("Found deadline JSON:", deadlineJson);
        const deadlineData = JSON.parse(deadlineJson)
        
        const newDeadline: Omit<Deadline, 'id'> = {
          title: deadlineData.title,
          course: deadlineData.course,
          dueDate: new Date(deadlineData.dueDate),
          description: deadlineData.description,
          completed: false
        }
        
        // For testing, we'll just add it to the local state
        // In production, you would save to a database
        setDeadlines(prev => [...prev, {
          ...newDeadline,
          id: Date.now().toString()
        }]);
        
        console.log("Added deadline:", newDeadline);
        
        // If user is authenticated, save to database
        if (user?.sub) {
          try {
            const response = await fetch('/api/deadlines', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify(newDeadline),
            })
            
            if (response.ok) {
              // Refresh deadlines
              fetchDeadlines()
            }
          } catch (err) {
            console.error("Error saving to database:", err);
          }
        }
      }
    } catch (error) {
      console.error("Failed to parse or add deadline:", error)
    }
  }

  const toggleComplete = async (id: string) => {
    const deadline = deadlines.find(d => d.id === id)
    if (!deadline) return
    
    try {
      const response = await fetch(`/api/deadlines/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ completed: !deadline.completed }),
      })
      
      if (response.ok) {
        // Update local state
        setDeadlines(deadlines.map(d => 
          d.id === id ? { ...d, completed: !d.completed } : d
        ))
      }
    } catch (error) {
      console.error("Failed to update deadline:", error)
    }
  }

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString(undefined, { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric', 
      hour: '2-digit', 
      minute: '2-digit' 
    })
  }

  const getDaysRemaining = (dueDate: Date) => {
    const now = new Date()
    const due = new Date(dueDate)
    const diffTime = due.getTime() - now.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return diffDays
  }
  
  // Sort deadlines by due date (closest first)
  const sortedDeadlines = [...deadlines].sort((a, b) => 
    new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()
  )

  // Get upcoming deadlines (next 7 days)
  const upcomingDeadlines = sortedDeadlines.filter(
    d => !d.completed && getDaysRemaining(d.dueDate) <= 7 && getDaysRemaining(d.dueDate) >= 0
  )

  return (
    <Card className="h-[600px] flex flex-col">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MessageCircle className="h-5 w-5" />
            Course Assistant
          </div>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => setShowDeadlines(!showDeadlines)}
            className="flex items-center gap-1"
          >
            <Calendar className="h-4 w-4" />
            {showDeadlines ? "Hide Deadlines" : `Deadlines (${upcomingDeadlines.length})`}
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col">
        {showDeadlines ? (
          <div className="flex-1 overflow-auto">
            <h3 className="font-medium mb-2">Upcoming Deadlines</h3>
            
            {sortedDeadlines.length === 0 ? (
              <div className="text-center p-4 text-muted-foreground">
                No deadlines found. Ask the assistant to help you track assignments!
              </div>
            ) : upcomingDeadlines.length === 0 ? (
              <div className="text-center p-4 text-muted-foreground">
                No upcoming deadlines in the next 7 days.
              </div>
            ) : (
              <div className="space-y-3">
                {upcomingDeadlines.map(deadline => (
                  <div 
                    key={deadline.id} 
                    className="border rounded-md p-3 relative"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <h4 className="font-medium">{deadline.title}</h4>
                        <div className="text-sm text-muted-foreground">{deadline.course}</div>
                      </div>
                      <div className="flex items-center">
                        {getDaysRemaining(deadline.dueDate) <= 2 && (
                          <AlertTriangle size={16} className="text-red-500 mr-1" />
                        )}
                        <span className={`text-sm ${getDaysRemaining(deadline.dueDate) <= 2 ? 'text-red-500 font-medium' : ''}`}>
                          {getDaysRemaining(deadline.dueDate) === 0 
                            ? 'Due today!' 
                            : `${getDaysRemaining(deadline.dueDate)} days left`}
                        </span>
                      </div>
                    </div>
                    <div className="text-xs mt-2">{formatDate(deadline.dueDate)}</div>
                    {deadline.description && (
                      <div className="text-sm mt-1">{deadline.description}</div>
                    )}
                    <div className="mt-2">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => toggleComplete(deadline.id)}
                      >
                        Mark as Complete
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
            
            <div className="mt-4">
              <h3 className="font-medium mb-2">All Deadlines</h3>
              <div className="space-y-2">
                {sortedDeadlines.map(deadline => (
                  <div 
                    key={deadline.id}
                    className={`flex items-center justify-between p-2 rounded-md ${
                      deadline.completed ? 'bg-muted line-through text-muted-foreground' : ''
                    }`}
                  >
                    <div className="flex items-center">
                      <input 
                        type="checkbox" 
                        checked={deadline.completed}
                        onChange={() => toggleComplete(deadline.id)}
                        className="mr-2" 
                      />
                      <div>
                        <div className="text-sm font-medium">{deadline.title}</div>
                        <div className="text-xs text-muted-foreground">{deadline.course} - {formatDate(deadline.dueDate)}</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <>
            <div 
              ref={scrollAreaRef}
              className="flex-1 overflow-y-auto pr-4"
              style={{ 
                maxHeight: "calc(100% - 50px)",
                scrollbarWidth: "thin",
                scrollbarColor: "#CBD5E0 #F7FAFC"
              }}
            >
              <div className="space-y-4">
                {showWelcome && (
                  <div className="flex justify-start message-container">
                    <div className="rounded-lg px-4 py-2 max-w-[80%] bg-muted text-[#000]">
                      <p>Hi there! I'm your SFU course assistant. Ask me about courses, requirements, scheduling, or help me track your assignments and deadlines.</p>
                      <p className="text-xs opacity-70 mt-1">
                        {new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </p>
                    </div>
                  </div>
                )}
                
                {messages.map((message) => {
                  // Remove deadline JSON from display
                  const cleanContent = message.content.replace(/\[DEADLINE\].*?(\[\/DEADLINE\]|$)/g, '');
                  
                  return (
                    <div key={message.id} className={`flex ${message.role === "user" ? "justify-end" : "justify-start"} message-container`}>
                      <div
                        className={`rounded-lg px-4 py-2 max-w-[80%] ${
                          message.role === "user" ? "bg-primary text-primary-foreground" : "bg-muted text-foreground"
                        }`}
                      >
                        <p>{cleanContent}</p>
                        <p className="text-xs opacity-70 mt-1">
                          {new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                        </p>
                      </div>
                    </div>
                  );
                })}
                
                {isChatLoading && (
                  <div className="flex justify-start message-container">
                    <div className="rounded-lg px-4 py-2 bg-muted text-foreground animate-pulse">
                      <p>Thinking...</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
            <form className="flex gap-2 mt-4" onSubmit={handleSubmit}>
              <Input
                placeholder="Ask about courses, requirements, or add a deadline..."
                value={input}
                onChange={handleInputChange}
                disabled={isChatLoading}
              />
              <Button type="submit" disabled={isChatLoading}>
                <Send className="h-4 w-4" />
              </Button>
            </form>
          </>
        )}
      </CardContent>
    </Card>
  )
}
"use client"

import { useState, useEffect, useRef } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { MessageCircle, Send, Calendar, AlertTriangle } from "lucide-react"
import { Badge } from "@/components/ui/badge"

interface Message {
  id: string
  content: string
  role: "user" | "assistant" | "system"
  timestamp: Date
}

type Deadline = {
  id: string
  title: string
  course: string
  dueDate: Date
  description?: string
  completed: boolean
}

export function EnhancedChatbot() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      content: "Hi there! I'm your SFU course assistant. Ask me about courses, requirements, scheduling, or help me track your assignments and deadlines.",
      role: "assistant",
      timestamp: new Date()
    }
  ])
  const [input, setInput] = useState("")
  const [isProcessing, setIsProcessing] = useState(false)
  const [deadlines, setDeadlines] = useState<Deadline[]>([])
  const [showDeadlines, setShowDeadlines] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const scrollAreaRef = useRef<HTMLDivElement>(null)

  // Fetch deadlines on component mount
  useEffect(() => {
    fetchDeadlines()
  }, [])

  // Auto scroll to bottom of chat
  useEffect(() => {
    if (scrollAreaRef.current) {
      const scrollContainer = scrollAreaRef.current
      scrollContainer.scrollTop = scrollContainer.scrollHeight
    }
  }, [messages, isProcessing])

  // Fetch deadlines from API
  const fetchDeadlines = async () => {
    try {
      const response = await fetch('/api/deadline')
      if (response.ok) {
        const data = await response.json()
        
        if (Array.isArray(data)) {
          // Convert string dates to Date objects
          const formattedData = data.map((item: any) => ({
            ...item,
            dueDate: new Date(item.dueDate)
          }))
          
          setDeadlines(formattedData)
        }
      } else {
        console.error("Failed to fetch deadlines, status:", response.status)
      }
    } catch (error) {
      console.error("Error fetching deadlines:", error)
    }
  }

  // Toggle deadline completion
  const toggleComplete = async (id: string) => {
    const deadline = deadlines.find(d => d.id === id)
    if (!deadline) return
    
    try {
      const response = await fetch(`/api/deadline/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ completed: !deadline.completed }),
      })
      
      if (response.ok) {
        // Update local state for immediate UI update
        setDeadlines(deadlines.map(d => 
          d.id === id ? { ...d, completed: !d.completed } : d
        ))
      } else {
        // Refresh deadlines if update failed
        fetchDeadlines()
      }
    } catch (error) {
      console.error("Error updating deadline:", error)
    }
  }

  // Delete a deadline
  const deleteDeadline = async (id: string) => {
    try {
      const response = await fetch(`/api/deadline/${id}`, {
        method: 'DELETE',
      })
      
      if (response.ok) {
        // Remove from local state
        setDeadlines(prev => prev.filter(d => d.id !== id))
      }
    } catch (error) {
      console.error("Error deleting deadline:", error)
    }
  }

  // Parse and add deadline from chat
  const parseAndAddDeadline = async (message: string) => {
    try {
      const deadlineMatch = message.match(/\[DEADLINE\](.*?)(\[\/DEADLINE\]|$)/)
      if (deadlineMatch && deadlineMatch[1]) {
        const deadlineJson = deadlineMatch[1].trim()
        const deadlineData = JSON.parse(deadlineJson)
        
        // Send the deadline data to the API
        const response = await fetch('/api/deadline', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            title: deadlineData.title,
            course: deadlineData.course,
            dueDate: deadlineData.dueDate,
            description: deadlineData.description || "",
            completed: false
          }),
        })
        
        if (response.ok) {
          // Refresh deadlines
          fetchDeadlines()
          
          // Add notification message to chat
          setMessages(prev => [...prev, {
            id: `notification-${Date.now()}`,
            role: "system",
            content: `✅ Deadline added: ${deadlineData.title} for ${deadlineData.course}`,
            timestamp: new Date()
          }])
        }
      }
    } catch (error) {
      console.error("Failed to parse or add deadline:", error)
    }
  }

  // Handle sending message
  const handleSend = async () => {
    if (!input.trim() || isProcessing) return

    // Create user message
    const userMessage: Message = {
      id: Date.now().toString(),
      content: input,
      role: "user",
      timestamp: new Date(),
    }

    // Add to chat immediately
    setMessages(prev => [...prev, userMessage])
    setInput("")
    setIsProcessing(true)
    setError(null)

    try {
      // Prepare messages for API
      const messagesForApi = messages.map(msg => ({
        role: msg.role,
        content: msg.content
      }))
      
      // Add current message
      messagesForApi.push({
        role: "user",
        content: userMessage.content
      })

      // Call API with retry logic
      let retryCount = 0
      const maxRetries = 2
      let response = null
      let backoffDelay = 1000
      
      while (retryCount <= maxRetries && !response) {
        try {
          response = await fetch('/api/chat', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ messages: messagesForApi }),
          })
          
          if (!response.ok) {
            throw new Error(`Server responded with ${response.status}`)
          }
        } catch (err) {
          retryCount++
          
          if (retryCount <= maxRetries) {
            console.log(`Retry attempt ${retryCount} in ${backoffDelay}ms`)
            await new Promise(r => setTimeout(r, backoffDelay))
            backoffDelay *= 2 // Exponential backoff
          } else {
            throw err
          }
        }
      }

      if (!response) {
        throw new Error("Failed to get response after retries")
      }

      // Process streaming response
      const reader = response.body?.getReader()
      const decoder = new TextDecoder()
      let responseText = ''
      
      if (reader) {
        while (true) {
          const { done, value } = await reader.read()
          if (done) break
          
          const chunk = decoder.decode(value, { stream: true })
          responseText += chunk
        }
      } else {
        // Fallback for non-streaming response
        responseText = await response.text()
      }
      
      // Add bot response
      const botMessage: Message = {
        id: Date.now().toString(),
        content: responseText,
        role: "assistant",
        timestamp: new Date()
      }

      setMessages(prev => [...prev, botMessage])

      // Check for deadline information
      if (responseText.includes("[DEADLINE]")) {
        parseAndAddDeadline(responseText)
      }
    } catch (error: any) {
      console.error("Error sending message:", error)
      
      // Add error message
      setMessages(prev => [...prev, {
        id: `error-${Date.now()}`,
        content: "I'm having trouble connecting. Please try again shortly.",
        role: "assistant",
        timestamp: new Date()
      }])
      
      setError("Failed to send message. Please try again.")
    } finally {
      setIsProcessing(false)
    }
  }

  // Format date for display
  const formatDate = (date: Date) => {
    return date.toLocaleDateString(undefined, { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric'
    })
  }

  // Format time for display
  const formatTime = (date: Date) => {
    return date.toLocaleTimeString(undefined, { 
      hour: '2-digit', 
      minute: '2-digit'
    })
  }

  // Calculate days remaining until deadline
  const getDaysRemaining = (dueDate: Date) => {
    const now = new Date()
    const due = new Date(dueDate)
    const diffTime = due.getTime() - now.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return diffDays
  }

  // Sort deadlines by due date (closest first)
  const sortedDeadlines = [...deadlines].sort((a, b) => 
    a.dueDate.getTime() - b.dueDate.getTime()
  )

  // Get upcoming deadlines (next 7 days)
  const upcomingDeadlines = sortedDeadlines.filter(
    d => !d.completed && getDaysRemaining(d.dueDate) <= 7 && getDaysRemaining(d.dueDate) >= 0
  )

  return (
    <Card className="h-[400px] flex flex-col">
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
            
            {deadlines.length === 0 ? (
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
                    <div className="text-xs mt-2">{formatDate(deadline.dueDate)} at {formatTime(deadline.dueDate)}</div>
                    {deadline.description && (
                      <div className="text-sm mt-1">{deadline.description}</div>
                    )}
                    <div className="mt-2 flex gap-2">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => toggleComplete(deadline.id)}
                      >
                        {deadline.completed ? 'Mark Incomplete' : 'Mark Complete'}
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => deleteDeadline(deadline.id)}
                      >
                        Delete
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
                      deadline.completed ? 'bg-muted text-muted-foreground' : ''
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <input 
                        type="checkbox" 
                        checked={deadline.completed}
                        onChange={() => toggleComplete(deadline.id)}
                        className="h-4 w-4 rounded border-gray-300" 
                      />
                      <div>
                        <div className={`text-sm font-medium ${deadline.completed ? 'line-through' : ''}`}>
                          {deadline.title}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {deadline.course} - {formatDate(deadline.dueDate)}
                        </div>
                      </div>
                    </div>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => deleteDeadline(deadline.id)}
                      className="h-6 w-6 p-0"
                    >
                      <span className="sr-only">Delete</span>
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M3 6h18"></path>
                        <path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"></path>
                      </svg>
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <>
            <ScrollArea className="flex-1 pr-4" ref={scrollAreaRef}>
              <div className="space-y-4">
                {messages.map((message) => {
                  // Clean content by removing deadline tags
                  const cleanContent = message.content.replace(/\[DEADLINE\].*?(\[\/DEADLINE\]|$)/g, '');
                  return (
                    <div key={message.id} className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}>
                      <div
                        className={`rounded-lg px-4 py-2 max-w-[80%] ${
                          message.role === "user" ? "bg-primary text-primary-foreground" : 
                          message.role === "system" ? "bg-secondary/20 text-foreground" :
                          "bg-muted text-foreground"
                        }`}
                      >
                        <p>{cleanContent}</p>
                        <p className="text-xs opacity-70 mt-1">
                          {message.timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                        </p>
                      </div>
                    </div>
                  );
                })}
                
                {isProcessing && (
                  <div className="flex justify-start">
                    <div className="rounded-lg px-4 py-2 bg-muted text-foreground animate-pulse">
                      <p>Thinking...</p>
                    </div>
                  </div>
                )}
                
                {error && !isProcessing && (
                  <div className="text-center mt-2">
                    <Badge variant="outline" className="bg-red-100 text-red-800">
                      {error}
                    </Badge>
                  </div>
                )}
              </div>
            </ScrollArea>
            <div className="flex gap-2 mt-4">
              <Input
                placeholder="Ask about courses, requirements, or track deadlines..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleSend();
                  }
                }}
                disabled={isProcessing}
              />
              <Button 
                onClick={handleSend} 
                disabled={isProcessing || !input.trim()}
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  )
}
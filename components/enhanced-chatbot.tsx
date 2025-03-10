"use client"

import { useState, useEffect, useRef } from "react"
import { useChat } from "ai/react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { MessageCircle, Send, Calendar, Plus, AlertTriangle } from "lucide-react"
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

  // Fetch deadlines on load if user is authenticated
  useEffect(() => {
    if (user?.sub) {
      fetchDeadlines()
    }
  }, [user])

  // Auto scroll to bottom of chat
  useEffect(() => {
    if (scrollAreaRef.current) {
      const scrollContainer = scrollAreaRef.current
      scrollContainer.scrollTop = scrollContainer.scrollHeight
    }
  }, [messages])

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
        const deadlineData = JSON.parse(deadlineJson)
        
        const newDeadline: Omit<Deadline, 'id'> = {
          title: deadlineData.title,
          course: deadlineData.course,
          dueDate: new Date(deadlineData.dueDate),
          description: deadlineData.description,
          completed: false
        }
        
        // Save to database
        if (user?.sub) {
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
            <ScrollArea className="flex-1 pr-4" ref={scrollAreaRef}>
              <div className="space-y-4">
                {messages.map((message) => (
                  <div key={message.id} className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}>
                    <div
                      className={`rounded-lg px-4 py-2 max-w-[80%] ${
                        message.role === "user" ? "bg-primary text-primary-foreground" : "bg-muted text-foreground"
                      }`}
                    >
                      <p>{message.content.replace(/\[DEADLINE\].*?(\[\/DEADLINE\]|$)/g, '')}</p>
                      <p className="text-xs opacity-70 mt-1">
                        {new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </p>
                    </div>
                  </div>
                ))}
                
                {isLoading && !messages.length && (
                  <div className="flex justify-start">
                    <div className="rounded-lg px-4 py-2 max-w-[80%] bg-muted text-foreground">
                      <p>Hi there! I'm your SFU course assistant. Ask me about courses, requirements, scheduling, or help me track your assignments and deadlines.</p>
                    </div>
                  </div>
                )}
                
                {isChatLoading && (
                  <div className="flex justify-start">
                    <div className="rounded-lg px-4 py-2 bg-muted text-foreground animate-pulse">
                      <p>Thinking...</p>
                    </div>
                  </div>
                )}
              </div>
            </ScrollArea>
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
// Updated DeadlineTracker component with improved fetching
"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Calendar, AlertTriangle, Plus, Check, Trash2, RefreshCw } from "lucide-react"

type Deadline = {
  id: string
  title: string
  course: string
  dueDate: Date
  description?: string
  completed: boolean
}

export function DeadlineTracker() {
  const [deadlines, setDeadlines] = useState<Deadline[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddForm, setShowAddForm] = useState(false)
  const [newDeadline, setNewDeadline] = useState({
    title: "",
    course: "",
    dueDate: "",
    description: "",
  })

  // Fetch deadlines on load and set up refresh interval
  useEffect(() => {
    fetchDeadlines()
    
    // Set up a polling interval to check for new deadlines
    const refreshInterval = setInterval(() => {
      fetchDeadlines(false) // Don't show loading state for auto-refresh
    }, 10000) // Check every 10 seconds
    
    return () => clearInterval(refreshInterval)
  }, [])

  const fetchDeadlines = async (showLoading = true) => {
    try {
      if (showLoading) setLoading(true)
      
      const response = await fetch('/api/deadline')
      if (response.ok) {
        const data = await response.json()
        
        if (Array.isArray(data)) {
          // Convert string dates to Date objects
          const formattedData = data.map((item: any) => ({
            ...item,
            dueDate: new Date(item.dueDate)
          }))
          
          console.log("Fetched deadlines:", formattedData)
          setDeadlines(formattedData)
        } else {
          console.error("Unexpected response format:", data)
        }
      } else {
        console.error("Failed to fetch deadlines, status:", response.status)
      }
    } catch (error) {
      console.error("Error fetching deadlines:", error)
    } finally {
      if (showLoading) setLoading(false)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setNewDeadline(prev => ({ ...prev, [name]: value }))
  }

  const handleAddDeadline = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!newDeadline.title || !newDeadline.course || !newDeadline.dueDate) {
      alert("Please fill in all required fields")
      return
    }

    try {
      const response = await fetch('/api/deadline', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...newDeadline,
          completed: false
        }),
      })
      
      if (response.ok) {
        // Refresh the deadlines list
        await fetchDeadlines()
        
        // Reset form
        setNewDeadline({
          title: "",
          course: "",
          dueDate: "",
          description: "",
        })
        setShowAddForm(false)
      } else {
        console.error("Failed to add deadline:", await response.text())
      }
    } catch (error) {
      console.error("Error adding deadline:", error)
    }
  }

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
        console.error("Failed to update deadline, status:", response.status)
        // Refresh deadlines to ensure UI is in sync with server
        fetchDeadlines()
      }
    } catch (error) {
      console.error("Error updating deadline:", error)
    }
  }

  const deleteDeadline = async (id: string) => {
    try {
      const response = await fetch(`/api/deadline/${id}`, {
        method: 'DELETE',
      })
      
      if (response.ok) {
        // Remove from local state
        setDeadlines(prev => prev.filter(d => d.id !== id))
      } else {
        console.error("Failed to delete deadline, status:", response.status)
      }
    } catch (error) {
      console.error("Error deleting deadline:", error)
    }
  }

  const formatDate = (date: Date) => {
    return date.toLocaleDateString(undefined, { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric'
    })
  }

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString(undefined, { 
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
    a.dueDate.getTime() - b.dueDate.getTime()
  )

  // Get upcoming deadlines (next 7 days)
  const upcomingDeadlines = sortedDeadlines.filter(
    d => !d.completed && getDaysRemaining(d.dueDate) <= 7 && getDaysRemaining(d.dueDate) >= 0
  )

  return (
    <Card className="bg-[#1E293B]/70 border-0 backdrop-blur-sm text-white">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2 text-white">
          <Calendar className="h-5 w-5" />
          Upcoming Deadlines
          <Button 
            onClick={() => fetchDeadlines()} 
            variant="ghost" 
            size="sm"
            className="ml-2 text-white hover:bg-white/10"
          >
            <RefreshCw className="h-4 w-4" />
          </Button>
        </CardTitle>
        <Button 
          onClick={() => setShowAddForm(!showAddForm)} 
          variant="ghost" 
          className="text-white hover:bg-white/10"
        >
          <Plus className="h-5 w-5 mr-1" />
          Add Deadline
        </Button>
      </CardHeader>
      <CardContent>
        {showAddForm && (
          <form onSubmit={handleAddDeadline} className="space-y-4 mb-6 p-4 bg-white/5 rounded-lg">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                name="title"
                placeholder="Assignment Title"
                value={newDeadline.title}
                onChange={handleInputChange}
                required
                className="bg-white/10 border-0 text-white placeholder:text-white/50"
              />
              <Input
                name="course"
                placeholder="Course (e.g. CMPT 120)"
                value={newDeadline.course}
                onChange={handleInputChange}
                required
                className="bg-white/10 border-0 text-white placeholder:text-white/50"
              />
              <Input
                name="dueDate"
                type="datetime-local"
                value={newDeadline.dueDate}
                onChange={handleInputChange}
                required
                className="bg-white/10 border-0 text-white"
              />
              <Input
                name="description"
                placeholder="Description (optional)"
                value={newDeadline.description}
                onChange={handleInputChange}
                className="bg-white/10 border-0 text-white placeholder:text-white/50"
              />
            </div>  
            <div className="flex gap-2">
              <Button 
                type="submit" 
                className="bg-primary hover:bg-primary/80"
              >
                Save Deadline
              </Button>
              <Button 
                type="button" 
                variant="ghost" 
                onClick={() => setShowAddForm(false)}
                className="text-white hover:bg-white/10"
              >
                Cancel
              </Button>
            </div>
          </form>
        )}

        {loading ? (
          <div className="text-center p-8 text-white/70">Loading deadlines...</div>
        ) : deadlines.length === 0 ? (
          <div className="text-center p-8 text-white/70">
            No deadlines found. Add your first deadline above!
          </div>
        ) : (
          <div className="space-y-4">
            {upcomingDeadlines.length === 0 ? (
              <div className="text-center p-4 text-white/70">
                No upcoming deadlines in the next 7 days.
              </div>
            ) : (
              <div className="space-y-3">
                {upcomingDeadlines.map(deadline => (
                  <div 
                    key={deadline.id} 
                    className={`border border-white/20 rounded-md p-4 relative ${
                      deadline.completed ? 'bg-white/5 opacity-70' : 'bg-white/10'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h4 className={`font-medium text-lg ${deadline.completed ? 'line-through opacity-70' : ''}`}>
                          {deadline.title}
                        </h4>
                        <div className="text-sm text-white/70">{deadline.course}</div>
                        
                        <div className="mt-2 flex items-center gap-1 text-sm text-white/70">
                          <Calendar className="h-3 w-3" />
                          {formatDate(deadline.dueDate)} at {formatTime(deadline.dueDate)}
                        </div>
                        
                        {deadline.description && (
                          <div className="mt-2 text-sm">{deadline.description}</div>
                        )}
                      </div>
                      
                      <div className="flex flex-col items-end">
                        <div className="flex items-center mb-2">
                          {getDaysRemaining(deadline.dueDate) <= 2 && (
                            <AlertTriangle size={16} className="text-red-400 mr-1" />
                          )}
                          <span className={`text-sm font-medium ${
                            getDaysRemaining(deadline.dueDate) <= 2 
                              ? 'text-red-400' 
                              : 'text-white/70'
                          }`}>
                            {getDaysRemaining(deadline.dueDate) === 0 
                              ? 'Due today!' 
                              : `${getDaysRemaining(deadline.dueDate)} days left`}
                          </span>
                        </div>
                        
                        <div className="flex gap-2">
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => toggleComplete(deadline.id)}
                            className="text-white hover:bg-white/10 h-8 px-2"
                          >
                            <Check className="h-4 w-4 mr-1" />
                            {deadline.completed ? 'Undo' : 'Complete'}
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => deleteDeadline(deadline.id)}
                            className="text-white hover:bg-white/10 h-8 px-2"
                          >
                            <Trash2 className="h-4 w-4 mr-1" />
                            Delete
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
            
            {/* All deadlines section */}
            <div className="mt-8">
              <h3 className="font-medium text-lg text-white mb-3">All Deadlines</h3>
              <div className="space-y-2">
                {sortedDeadlines.map(deadline => (
                  <div 
                    key={deadline.id}
                    className={`flex items-center justify-between p-3 rounded-md ${
                      deadline.completed ? 'bg-white/5 text-white/50' : 'bg-white/10 text-white'
                    } transition-all`}
                  >
                    <div className="flex items-center flex-1">
                      <div 
                        className={`w-5 h-5 rounded-full border mr-3 flex items-center justify-center cursor-pointer
                          ${deadline.completed ? 'bg-primary border-primary' : 'border-white/50'}`}
                        onClick={() => toggleComplete(deadline.id)}
                      >
                        {deadline.completed && <Check className="h-3 w-3 text-white" />}
                      </div>
                      
                      <div className="flex-1">
                        <div className={`font-medium ${deadline.completed ? 'line-through' : ''}`}>
                          {deadline.title}
                        </div>
                        <div className="text-xs text-white/70">
                          {deadline.course} - {formatDate(deadline.dueDate)}
                        </div>
                      </div>
                    </div>
                    
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => deleteDeadline(deadline.id)}
                      className="text-white/70 hover:bg-white/10 h-7 w-7 p-0"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
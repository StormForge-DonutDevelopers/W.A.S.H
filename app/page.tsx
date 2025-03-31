//import { DashboardHeader } from "@/components/dashboard-header"
import { CoursePlanner } from "@/components/course-planner"
import { ChatbotWindow } from "@/components/chatbot-window"
import { DeadlineTracker } from "@/components/deadline-tracker"

import Image from 'next/image'

import './main.css'
import bubbles from '../lib/images/bubbles.svg'
import mirror from '../lib/images/mirror.svg'
import duck from '../lib/images/duck.png'
//import raccoon from '../lib/images/raccoon.png'

export default function DashboardPage() {
  return (
    <div className="relative">
      <Image 
        src={mirror}
        alt=""
        className="absolute z-[-1000] left-0 top-0"
      />

      <div className="flex min-h-screen flex-col mx-[10rem] mb-[5rem]">
        <main className="flex-1 space-y-4 p-4 md:p-8">
          <div className="mt-[5rem] ml-[20rem]">
            <h1 className="text-[5rem] font-display tracking-tight">Hi, Jane!</h1>
            <p className="text-xl mt-[-0.5rem] mb-[31.5rem]">What are your plans for today?</p>
          </div>

          <Image 
            src={bubbles}
            alt=""
            className="absolute z-[-100] left-0 top-[-8.5rem]"
          />

          <Image 
            src={duck}
            alt=""
            className="absolute z-[-1] w-[16rem] top-[34rem] left-[48%]"
          />

          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-7">
            <div className="col-span-4 mt-[10rem]">
              <h2 className="text-4xl mb-[2rem] text-[#FBFBFB] font-display">Course Planner</h2>
              <CoursePlanner />
              
              {/* Deadline Tracker below the Course Planner */}
              <div className="mt-8">
                <h2 className="text-4xl mb-[2rem] text-[#FBFBFB] font-display">Deadline Tracker</h2>
                <DeadlineTracker />
              </div>
            </div>
            <div className="col-span-3 mt-[10rem]">
              <h2 className="text-4xl mb-[2rem] text-[#FBFBFB] font-display">Course Assistant</h2>
              <ChatbotWindow />
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
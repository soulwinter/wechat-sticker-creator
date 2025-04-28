"use client"

import StepTwo from "@/components/step-two"

export default function Home() {
  return (
    <main className="container mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold text-center mb-8">微信表情包制作工具</h1>
      <div className="w-full max-w-4xl mx-auto">
        <StepTwo />
      </div>
    </main>
  )
}

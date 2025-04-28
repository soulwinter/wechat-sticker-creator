"use client"

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import StepOne from "@/components/step-one"
import StepTwo from "@/components/step-two"
import { TabProvider, useTab } from "@/contexts/tab-context"

function TabsContainer() {
  const { activeTab, setActiveTab } = useTab()

  return (
    <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full max-w-4xl mx-auto">
      <TabsList className="grid w-full grid-cols-2">
        <TabsTrigger value="step1">步骤 1: 聊天生成图片</TabsTrigger>
        <TabsTrigger value="step2">步骤 2: 分割和处理表情包</TabsTrigger>
      </TabsList>

      <TabsContent value="step1" className="mt-6">
        <StepOne />
      </TabsContent>

      <TabsContent value="step2" className="mt-6">
        <StepTwo />
      </TabsContent>
    </Tabs>
  )
}

export default function Home() {
  return (
    <main className="container mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold text-center mb-8">微信表情包制作工具</h1>

      <TabProvider>
        <TabsContainer />
      </TabProvider>
    </main>
  )
}

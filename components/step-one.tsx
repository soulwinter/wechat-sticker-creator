import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { MessageSquare, ImageIcon, Info } from "lucide-react"

export default function StepOne() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageSquare className="h-5 w-5" />
          步骤 1: 聊天生成图片
        </CardTitle>
        <CardDescription>此功能暂未实现，请直接进入步骤 2 上传您的表情包图片</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="bg-gray-50 p-4 rounded-lg border">
          <h3 className="text-sm font-medium flex items-center gap-2 mb-2">
            <ImageIcon className="h-4 w-4" />
            推荐的提示词模板
          </h3>
          <div className="bg-white p-3 rounded border text-sm">
            <code className="block whitespace-pre-wrap text-xs">
              请将这张照片制作成一套卡通贴图(sticker set)： 1. 每个贴图不要互相重叠 2. 保留原始脸部特征 3. 使用透明背景
              4. 添加简单白色边框 5. 风格：[可爱/简约/卡通/手绘]
            </code>
          </div>
        </div>

        <div className="flex items-start gap-2 text-sm text-muted-foreground">
          <Info className="h-4 w-4 mt-0.5 flex-shrink-0" />
          <p>
            您可以使用类似GPT-4o或DALL-E等AI模型生成表情包，然后在步骤2中上传进行处理。
            生成后的表情包可能需要进一步分割和调整。
          </p>
        </div>
      </CardContent>
    </Card>
  )
}

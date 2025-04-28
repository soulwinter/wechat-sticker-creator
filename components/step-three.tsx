"use client"

import type React from "react"
import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Download, AlertCircle, Info, ImageIcon } from "lucide-react"
import ImageProcessor from "./image-processor"

interface StepThreeProps {
  processedImages: string[]
  onImageSelect?: (image: string) => void
}

export default function StepThree({ processedImages, onImageSelect }: StepThreeProps) {
  const [selectedImage, setSelectedImage] = useState<string | null>(null)
  const [avatar, setAvatar] = useState<string | null>(null)
  const [icon, setIcon] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleImageSelect = (image: string) => {
    setSelectedImage(image)
    processImage(image)
    onImageSelect?.(image)
  }

  const processImage = async (image: string) => {
    try {
      const processor = new ImageProcessor()
      
      // 处理头像 (240x240)
      const avatarResult = await processor.resizeImage(image, 240, 240)
      setAvatar(avatarResult)

      // 处理图标 (50x50)
      const iconResult = await processor.resizeImage(image, 50, 50)
      setIcon(iconResult)

      setError(null)
    } catch (err) {
      setError("处理图片时出错")
    }
  }

  const downloadImage = (dataUrl: string, type: string) => {
    const a = document.createElement("a")
    a.href = dataUrl
    a.download = `sticker_${type}.png`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>生成头像和图标</CardTitle>
        <CardDescription>
          从处理好的表情包中选择一个，生成头像（240×240像素）和图标（50×50像素）
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* 选择表情包 */}
          {processedImages.length > 0 && (
            <div className="space-y-4">
              <h3 className="text-sm font-medium flex items-center gap-2">
                <ImageIcon className="h-4 w-4" />
                选择表情包
              </h3>
              <div className="grid grid-cols-6 gap-3">
                {processedImages.map((src, index) => (
                  <div
                    key={index}
                    className={`border rounded-lg p-2 cursor-pointer hover:border-blue-500 transition-colors w-[120px] h-[120px] ${
                      selectedImage === src ? "ring-2 ring-blue-500 bg-blue-50" : "bg-gray-50"
                    }`}
                    onClick={() => handleImageSelect(src)}
                  >
                    <div className="aspect-square flex items-center justify-center h-full">
                      <img 
                        src={src} 
                        alt={`表情包 ${index + 1}`} 
                        className="w-full h-full object-contain max-w-[100px] max-h-[100px]" 
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 注意事项 */}
          <div className="bg-gray-50 p-4 rounded-lg space-y-2">
            <h3 className="text-sm font-medium flex items-center gap-2">
              <Info className="h-4 w-4" />
              注意事项
            </h3>
            <ul className="text-sm text-gray-600 space-y-1 list-disc pl-5">
              <li>建议使用表情形象正面的半身像或全身像，展示形象最具辨识度的部分</li>
              <li>避免只使用形象头部图片</li>
              <li>图片中形象不应有白色描边，并避免出现锯齿</li>
              <li>须设置为透明背景</li>
              <li>避免使用白色背景</li>
              <li>不要出现正方形边框，避免表情主体出现生硬的直角边缘</li>
              <li>合理安排图片布局，每张图片不应有过多留白</li>
              <li>画面尽量简洁，避免加入装饰元素</li>
              <li>除纯文字类型表情外，避免出现文字</li>
              <li>不同的表情形象应使用不一样的头像和图标</li>
            </ul>
          </div>

          {/* 预览区域 */}
          {(avatar || icon) && (
            <div className="grid grid-cols-2 gap-6">
              {/* 头像预览 */}
              <div className="space-y-3">
                <h3 className="text-sm font-medium">头像预览 (240×240)</h3>
                <div className="bg-gray-100 p-4 rounded-lg">
                  <img
                    src={avatar || "/placeholder.svg"}
                    alt="头像预览"
                    className="w-60 h-60 mx-auto object-contain"
                  />
                </div>
                <Button className="w-full" onClick={() => avatar && downloadImage(avatar, "avatar")}>
                  <Download className="mr-2 h-4 w-4" />
                  下载头像
                </Button>
              </div>

              {/* 图标预览 */}
              <div className="space-y-3">
                <h3 className="text-sm font-medium">图标预览 (50×50)</h3>
                <div className="bg-gray-100 p-4 rounded-lg">
                  <img
                    src={icon || "/placeholder.svg"}
                    alt="图标预览"
                    className="w-[100px] h-[100px] mx-auto object-contain"
                  />
                </div>
                <Button className="w-full" onClick={() => icon && downloadImage(icon, "icon")}>
                  <Download className="mr-2 h-4 w-4" />
                  下载图标
                </Button>
              </div>
            </div>
          )}

          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
        </div>
      </CardContent>
    </Card>
  )
} 
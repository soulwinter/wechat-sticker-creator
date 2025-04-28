"use client"

import type React from "react"

import { useState, useRef } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, Upload, Download, AlertCircle, Layers, X, Trash2 } from "lucide-react"
import ImageSplitter from "./image-splitter"
import ImageProcessor from "./image-processor"
import ImageMerger from "./image-merger"

export default function StepTwo() {
  const [image, setImage] = useState<string | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [isMerging, setIsMerging] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [processedImages, setProcessedImages] = useState<string[]>([])
  const [selectedImages, setSelectedImages] = useState<number[]>([])
  const [originalRegions, setOriginalRegions] = useState<
    Array<{ x: number; y: number; width: number; height: number }>
  >([])
  const [isSelectionMode, setIsSelectionMode] = useState(false)
  const [backgroundColor, setBackgroundColor] = useState<{ r: number; g: number; b: number } | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setError(null)
    const file = e.target.files?.[0]

    if (!file) return

    // 允许PNG和JPG格式
    if (!file.type.includes("png") && !file.type.includes("jpeg") && !file.type.includes("jpg")) {
      setError("请上传PNG或JPG格式的图片")
      return
    }

    const reader = new FileReader()
    reader.onload = (event) => {
      setImage(event.target?.result as string)
      setProcessedImages([])
      setSelectedImages([])
      setOriginalRegions([])
      setIsSelectionMode(false)
      setBackgroundColor(null)
    }
    reader.readAsDataURL(file)
  }

  const handleSplitImage = async () => {
    if (!image) return

    setIsProcessing(true)
    setError(null)
    setProcessedImages([])
    setSelectedImages([])
    setOriginalRegions([])
    setIsSelectionMode(false)
    setBackgroundColor(null)

    try {
      // 处理图片分割的逻辑
      const img = new Image()
      img.src = image
      img.crossOrigin = "anonymous"

      img.onload = async () => {
        // 1. 分割图片
        const splitter = new ImageSplitter(img)
        const { images: splitResults, regions, backgroundColor: detectedBgColor } = splitter.split()
        setOriginalRegions(regions)
        setBackgroundColor(detectedBgColor)

        // 2. 处理分割后的图片（调整尺寸）
        const processor = new ImageProcessor()
        const processedResults = await processor.processImages(splitResults)
        setProcessedImages(processedResults)

        setIsProcessing(false)
      }

      img.onerror = () => {
        setError("图片加载失败")
        setIsProcessing(false)
      }
    } catch (err) {
      setError("处理图片时出错")
      setIsProcessing(false)
    }
  }

  const handleUploadClick = () => {
    fileInputRef.current?.click()
  }

  const handleImageSelect = (index: number) => {
    if (!isSelectionMode || index >= originalRegions.length) return

    setSelectedImages((prev) => {
      if (prev.includes(index)) {
        return prev.filter((i) => i !== index)
      } else {
        return [...prev, index]
      }
    })
  }

  const handleMergeSelected = async () => {
    if (selectedImages.length < 2 || !image) return

    setIsMerging(true)
    setError(null)

    try {
      // 获取选中的区域
      const selectedRegions = selectedImages.map((index) => originalRegions[index])

      // 创建原始图像对象
      const originalImg = new Image()
      originalImg.src = image
      originalImg.crossOrigin = "anonymous"

      await new Promise((resolve) => {
        originalImg.onload = resolve
      })

      // 合并选中的区域
      const merger = new ImageMerger(originalImg)
      const mergedImageUrl = merger.mergeRegions(selectedRegions, backgroundColor)

      // 处理合并后的图像
      const processor = new ImageProcessor()
      const processedMergedImage = await processor.processImages([mergedImageUrl])

      // 更新处理后的图像列表 - 移除被合并的图像，添加合并后的图像
      setProcessedImages((prev) => {
        // 创建一个新数组，排除被合并的图像
        const newImages = prev.filter((_, index) => !selectedImages.includes(index))
        // 添加合并后的图像
        return [...newImages, ...processedMergedImage]
      })

      // 清除选择并退出选择模式
      setSelectedImages([])
      setIsSelectionMode(false)
      setIsMerging(false)
    } catch (err) {
      setError("合并图片时出错")
      setIsMerging(false)
    }
  }

  const handleDeleteSelected = () => {
    if (selectedImages.length === 0) return

    setIsDeleting(true)

    try {
      // 更新处理后的图像列表 - 移除被选中的图像
      setProcessedImages((prev) => {
        // 创建一个新数组，排除被选中的图像
        return prev.filter((_, index) => !selectedImages.includes(index))
      })

      // 更新原始区域列表
      setOriginalRegions((prev) => {
        // 创建一个新数组，排除被选中的区域
        const newRegions = prev.filter((_, index) => !selectedImages.includes(index))
        return newRegions
      })

      // 清除选择
      setSelectedImages([])
      setIsDeleting(false)
    } catch (err) {
      setError("删除图片时出错")
      setIsDeleting(false)
    }
  }

  const toggleSelectionMode = () => {
    setIsSelectionMode((prev) => !prev)
    if (isSelectionMode) {
      setSelectedImages([])
    }
  }

  const handleClearSelection = () => {
    setSelectedImages([])
  }

  const downloadImage = (dataUrl: string, index: number) => {
    const a = document.createElement("a")
    a.href = dataUrl
    a.download = `sticker_${index + 1}.png`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
  }

  const downloadAllImages = () => {
    if (processedImages.length === 0) return

    // 创建一个zip文件
    import("jszip").then(({ default: JSZip }) => {
      const zip = new JSZip()

      // 添加所有图片到zip
      processedImages.forEach((dataUrl, index) => {
        // 从dataURL中提取base64数据
        const base64Data = dataUrl.split(",")[1]
        zip.file(`sticker_${index + 1}.png`, base64Data, { base64: true })
      })

      // 生成zip文件并下载
      zip.generateAsync({ type: "blob" }).then((blob) => {
        const url = URL.createObjectURL(blob)
        const a = document.createElement("a")
        a.href = url
        a.download = "wechat_stickers.zip"
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        URL.revokeObjectURL(url)
      })
    })
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>分割和调整表情包</CardTitle>
        <CardDescription>
          上传包含多个表情的 PNG 或 JPG 图片，系统将自动分割并调整为微信表情尺寸。推荐透明背景 PNG 照片，JPG 格式效果可能不佳。
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <input
            type="file"
            accept=".png,.jpg,.jpeg"
            className="hidden"
            onChange={handleFileChange}
            ref={fileInputRef}
          />

          {!image ? (
            <div
              className="border-2 border-dashed rounded-lg p-12 text-center cursor-pointer hover:bg-gray-50 transition-colors"
              onClick={handleUploadClick}
            >
              <Upload className="mx-auto h-12 w-12 text-gray-400" />
              <p className="mt-2 text-sm text-gray-600">点击上传PNG或JPG图片</p>
              <p className="text-xs text-gray-500 mt-1">支持透明背景和纯色背景</p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="bg-gray-100 p-4 rounded-lg">
                <img src={image || "/placeholder.svg"} alt="上传的图片" className="max-h-64 mx-auto object-contain" />
              </div>

              <div className="flex justify-between">
                <Button variant="outline" onClick={handleUploadClick}>
                  更换图片
                </Button>
                <Button onClick={handleSplitImage} disabled={isProcessing}>
                  {isProcessing ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      处理中...
                    </>
                  ) : (
                    "分割并处理图片"
                  )}
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

          {processedImages.length > 0 && (
            <div className="mt-6">
              <div className="flex justify-between items-center mb-3">
                <h3 className="text-lg font-medium">处理结果 ({processedImages.length}个)</h3>
                <div className="flex gap-2">
                  {processedImages.length > 1 && (
                    <Button size="sm" variant={isSelectionMode ? "default" : "outline"} onClick={toggleSelectionMode}>
                      <Layers className="mr-2 h-4 w-4" />
                      {isSelectionMode ? "退出编辑模式" : "进入编辑模式"}
                    </Button>
                  )}
                  <Button size="sm" onClick={downloadAllImages}>
                    <Download className="mr-2 h-4 w-4" />
                    下载全部
                  </Button>
                </div>
              </div>

              {isSelectionMode && (
                <div className="bg-gray-50 p-3 rounded-md mb-3 flex flex-wrap gap-2 items-center">
                  <span className="text-sm font-medium">编辑模式：</span>
                  {selectedImages.length > 1 && (
                    <Button size="sm" variant="secondary" onClick={handleMergeSelected} disabled={isMerging}>
                      {isMerging ? (
                        <>
                          <Loader2 className="mr-1 h-4 w-4 animate-spin" />
                          合并中...
                        </>
                      ) : (
                        <>
                          <Layers className="mr-1 h-4 w-4" />
                          合并选中 ({selectedImages.length})
                        </>
                      )}
                    </Button>
                  )}
                  {selectedImages.length > 0 && (
                    <Button size="sm" variant="destructive" onClick={handleDeleteSelected} disabled={isDeleting}>
                      {isDeleting ? (
                        <>
                          <Loader2 className="mr-1 h-4 w-4 animate-spin" />
                          删除中...
                        </>
                      ) : (
                        <>
                          <Trash2 className="mr-1 h-4 w-4" />
                          删除选中 ({selectedImages.length})
                        </>
                      )}
                    </Button>
                  )}
                  {selectedImages.length > 0 && (
                    <Button size="sm" variant="outline" onClick={handleClearSelection}>
                      <X className="mr-1 h-4 w-4" />
                      清除选择
                    </Button>
                  )}
                  <span className="text-xs text-gray-500 ml-auto">
                    {selectedImages.length === 0
                      ? "点击图片选择要操作的部分"
                      : `已选择 ${selectedImages.length} 个部分`}
                  </span>
                </div>
              )}

              {!isSelectionMode && (
                <p className="text-sm text-gray-500 mb-3">
                  鼠标悬停在图片上可以下载单个表情包，或点击"下载全部"一次性下载所有表情包。
                  <br />
                  如果有表情包被分割为多个部分或错误分割，可以点击编辑模式合并或删除。
                </p>
              )}

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                {processedImages.map((src, index) => {
                  const isOriginalImage = index < originalRegions.length
                  const isSelectable = isSelectionMode && isOriginalImage

                  return (
                    <div
                      key={index}
                      className={`border rounded-lg p-2 relative group ${
                        isSelectionMode && isOriginalImage ? "cursor-pointer" : "cursor-default"
                      } ${
                        isSelectionMode && selectedImages.includes(index)
                          ? "ring-2 ring-blue-500 bg-blue-50"
                          : "bg-gray-50"
                      }`}
                      onClick={() => isSelectable && handleImageSelect(index)}
                    >
                      <img
                        src={src || "/placeholder.svg"}
                        alt={`表情包 ${index + 1}`}
                        className="w-full h-auto object-contain"
                      />
                      {isSelectionMode && selectedImages.includes(index) && (
                        <div className="absolute top-2 right-2 bg-blue-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs">
                          {selectedImages.indexOf(index) + 1}
                        </div>
                      )}
                      {!isSelectionMode && (
                        <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button size="sm" variant="secondary" onClick={() => downloadImage(src, index)}>
                            <Download className="h-4 w-4" />
                          </Button>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

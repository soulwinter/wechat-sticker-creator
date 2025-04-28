export default class ImageProcessor {
  async processImages(imageSources: string[]): Promise<string[]> {
    const processedImages: string[] = []

    for (const src of imageSources) {
      try {
        const processedSrc = await this.processImage(src)
        processedImages.push(processedSrc)
      } catch (error) {
        console.error("处理图片时出错:", error)
      }
    }

    return processedImages
  }

  private async processImage(src: string): Promise<string> {
    return new Promise((resolve, reject) => {
      const img = new Image()
      img.crossOrigin = "anonymous"
      img.src = src

      img.onload = () => {
        try {
          // 获取原始尺寸
          const { width, height } = img

          // 确定正方形的大小（取最大边长）
          const maxSide = Math.max(width, height)

          // 创建一个临时Canvas
          const tempCanvas = document.createElement("canvas")
          tempCanvas.width = maxSide
          tempCanvas.height = maxSide
          const tempCtx = tempCanvas.getContext("2d")!

          // 计算居中位置
          const offsetX = (maxSide - width) / 2
          const offsetY = (maxSide - height) / 2

          // 绘制图像到临时Canvas（居中）
          tempCtx.clearRect(0, 0, maxSide, maxSide)
          tempCtx.drawImage(img, offsetX, offsetY)

          // 创建最终的Canvas（240x240）
          const finalCanvas = document.createElement("canvas")
          finalCanvas.width = 240
          finalCanvas.height = 240
          const finalCtx = finalCanvas.getContext("2d")!

          // 绘制调整大小后的图像
          finalCtx.drawImage(tempCanvas, 0, 0, maxSide, maxSide, 0, 0, 240, 240)

          // 返回数据URL
          resolve(finalCanvas.toDataURL("image/png"))
        } catch (error) {
          reject(error)
        }
      }

      img.onerror = () => {
        reject(new Error("加载图片失败"))
      }
    })
  }
}

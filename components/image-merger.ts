export default class ImageMerger {
  private img: HTMLImageElement
  private backgroundColor: { r: number; g: number; b: number } | null = null

  constructor(img: HTMLImageElement) {
    this.img = img
  }

  mergeRegions(
    regions: Array<{ x: number; y: number; width: number; height: number }>,
    backgroundColor?: { r: number; g: number; b: number } | null,
  ): string {
    if (regions.length === 0) {
      throw new Error("No regions to merge")
    }

    this.backgroundColor = backgroundColor || null

    // 计算合并后的边界框
    const boundingBox = this.calculateBoundingBox(regions)

    // 创建一个新的Canvas
    const canvas = document.createElement("canvas")
    canvas.width = boundingBox.width
    canvas.height = boundingBox.height
    const ctx = canvas.getContext("2d", { willReadFrequently: true })

    if (!ctx) {
      throw new Error("Failed to create canvas context")
    }

    // 绘制每个区域到Canvas上
    regions.forEach((region) => {
      // 计算相对于边界框的位置
      const relativeX = region.x - boundingBox.x
      const relativeY = region.y - boundingBox.y

      // 绘制区域
      ctx.drawImage(
        this.img,
        region.x,
        region.y,
        region.width,
        region.height,
        relativeX,
        relativeY,
        region.width,
        region.height,
      )
    })

    // 如果提供了背景色，处理背景透明
    if (this.backgroundColor) {
      this.makeBackgroundTransparent(ctx, canvas.width, canvas.height)
    }

    // 返回合并后的图像数据URL
    return canvas.toDataURL("image/png")
  }

  private calculateBoundingBox(regions: Array<{ x: number; y: number; width: number; height: number }>): {
    x: number
    y: number
    width: number
    height: number
  } {
    // 找出所有区域的最小和最大坐标
    let minX = Number.MAX_VALUE
    let minY = Number.MAX_VALUE
    let maxX = 0
    let maxY = 0

    regions.forEach((region) => {
      minX = Math.min(minX, region.x)
      minY = Math.min(minY, region.y)
      maxX = Math.max(maxX, region.x + region.width)
      maxY = Math.max(maxY, region.y + region.height)
    })

    // 计算边界框的宽度和高度
    const width = maxX - minX
    const height = maxY - minY

    return {
      x: minX,
      y: minY,
      width,
      height,
    }
  }

  private makeBackgroundTransparent(ctx: CanvasRenderingContext2D, width: number, height: number): void {
    if (!this.backgroundColor) return

    const imageData = ctx.getImageData(0, 0, width, height)
    const data = imageData.data

    // 颜色相似度阈值
    const threshold = 25

    // 将背景色设为透明
    for (let i = 0; i < data.length; i += 4) {
      const pixelColor = {
        r: data[i],
        g: data[i + 1],
        b: data[i + 2],
      }

      const colorDiff = this.getColorDifference(pixelColor, this.backgroundColor)

      // 如果像素颜色与背景色相似，则设为透明
      if (colorDiff <= threshold) {
        data[i + 3] = 0 // 设置alpha通道为0（完全透明）
      }
    }

    ctx.putImageData(imageData, 0, 0)
  }

  private getColorDifference(
    color1: { r: number; g: number; b: number },
    color2: { r: number; g: number; b: number },
  ): number {
    // 计算两个颜色之间的欧几里得距离
    const rDiff = color1.r - color2.r
    const gDiff = color1.g - color2.g
    const bDiff = color1.b - color2.b
    return Math.sqrt(rDiff * rDiff + gDiff * gDiff + bDiff * bDiff)
  }
}

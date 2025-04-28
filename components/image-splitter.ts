export default class ImageSplitter {
  private img: HTMLImageElement
  private canvas: HTMLCanvasElement
  private ctx: CanvasRenderingContext2D
  private backgroundColor: { r: number; g: number; b: number } | null = null

  constructor(img: HTMLImageElement) {
    this.img = img
    this.canvas = document.createElement("canvas")
    this.canvas.width = img.width
    this.canvas.height = img.height
    const ctx = this.canvas.getContext("2d", { willReadFrequently: true })
    if (!ctx) throw new Error("无法创建Canvas上下文")
    this.ctx = ctx

    // 绘制图像到Canvas
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height)
    this.ctx.drawImage(this.img, 0, 0)
  }

  split(): {
    images: string[]
    regions: Array<{ x: number; y: number; width: number; height: number }>
    backgroundColor: { r: number; g: number; b: number } | null
  } {
    // 获取图像数据
    const imageData = this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height)
    const data = imageData.data
    const width = imageData.width
    const height = imageData.height

    // 检测图像是否有透明通道
    const hasTransparency = this.checkTransparency(data)

    // 创建二值化图像，用于标记前景像素
    const binaryData = new Uint8Array(width * height)

    if (hasTransparency) {
      // 如果有透明通道，使用透明度来区分前景和背景
      this.binarizeByTransparency(data, binaryData, width, height)
    } else {
      // 如果没有透明通道，尝试检测纯色背景
      this.backgroundColor = this.detectBackgroundColor(data, width, height)
      console.log("检测到的背景色:", this.backgroundColor)
      this.binarizeByBackgroundColor(data, binaryData, width, height)
    }

    // 查找连通区域
    const regions = this.findConnectedRegions(binaryData, width, height)

    // 过滤掉太大的区域（可能是整个图像）
    const filteredRegions = this.filterRegions(regions, width, height)

    // 为每个区域创建单独的图像
    const images = filteredRegions.map((region) => this.createRegionImage(region, hasTransparency))

    // 返回图像和对应的区域信息以及背景色
    return {
      images,
      regions: filteredRegions,
      backgroundColor: this.backgroundColor,
    }
  }

  private checkTransparency(data: Uint8ClampedArray): boolean {
    // 检查图像是否有透明通道
    for (let i = 3; i < data.length; i += 4) {
      if (data[i] < 255) {
        return true
      }
    }
    return false
  }

  private detectBackgroundColor(
    data: Uint8ClampedArray,
    width: number,
    height: number,
  ): { r: number; g: number; b: number } {
    // 使用颜色直方图方法检测背景色
    // 这种方法假设背景色是图像中出现最多的颜色
    const colorHistogram: Map<string, number> = new Map()
    const colorMap: Map<string, { r: number; g: number; b: number }> = new Map()

    // 采样图像像素（为了性能，不检查所有像素）
    const sampleStep = Math.max(1, Math.floor(Math.sqrt(width * height) / 100))

    for (let y = 0; y < height; y += sampleStep) {
      for (let x = 0; x < width; x += sampleStep) {
        const idx = (y * width + x) * 4

        // 获取像素颜色
        const r = data[idx]
        const g = data[idx + 1]
        const b = data[idx + 2]

        // 量化颜色以减少颜色数量（每8个值分为一组）
        const quantizedR = Math.floor(r / 8) * 8
        const quantizedG = Math.floor(g / 8) * 8
        const quantizedB = Math.floor(b / 8) * 8

        const colorKey = `${quantizedR},${quantizedG},${quantizedB}`

        // 更新直方图
        colorHistogram.set(colorKey, (colorHistogram.get(colorKey) || 0) + 1)
        colorMap.set(colorKey, { r: quantizedR, g: quantizedG, b: quantizedB })
      }
    }

    // 找出出现最多的颜色
    let maxCount = 0
    let dominantColorKey = ""

    for (const [colorKey, count] of colorHistogram.entries()) {
      if (count > maxCount) {
        maxCount = count
        dominantColorKey = colorKey
      }
    }

    // 返回背景色
    return colorMap.get(dominantColorKey) || { r: 255, g: 255, b: 255 }
  }

  private binarizeByTransparency(data: Uint8ClampedArray, binaryData: Uint8Array, width: number, height: number): void {
    // 使用透明度来区分前景和背景
    for (let i = 0; i < height; i++) {
      for (let j = 0; j < width; j++) {
        const idx = (i * width + j) * 4
        // 如果alpha通道值大于128，则标记为前景
        binaryData[i * width + j] = data[idx + 3] > 128 ? 1 : 0
      }
    }
  }

  private binarizeByBackgroundColor(
    data: Uint8ClampedArray,
    binaryData: Uint8Array,
    width: number,
    height: number,
  ): void {
    if (!this.backgroundColor) return

    // 颜色相似度阈值 - 增加阈值以更好地处理颜色变化
    const threshold = 25

    // 根据背景色进行二值化
    for (let i = 0; i < height; i++) {
      for (let j = 0; j < width; j++) {
        const idx = (i * width + j) * 4
        const pixelColor = {
          r: data[idx],
          g: data[idx + 1],
          b: data[idx + 2],
        }

        // 如果像素颜色与背景色相似，则标记为背景(0)，否则标记为前景(1)
        const colorDiff = this.getColorDifference(pixelColor, this.backgroundColor)
        binaryData[i * width + j] = colorDiff > threshold ? 1 : 0
      }
    }
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

  private findConnectedRegions(
    binaryData: Uint8Array,
    width: number,
    height: number,
  ): Array<{ x: number; y: number; width: number; height: number }> {
    const visited = new Uint8Array(width * height)
    const regions: Array<{ x: number; y: number; width: number; height: number }> = []

    // 四个方向：上、右、下、左
    const dx = [0, 1, 0, -1]
    const dy = [-1, 0, 1, 0]

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const idx = y * width + x

        // 如果是前景像素且未访问过
        if (binaryData[idx] === 1 && visited[idx] === 0) {
          // 使用BFS查找连通区域
          const queue: Array<[number, number]> = [[x, y]]
          visited[idx] = 1

          let minX = x,
            maxX = x,
            minY = y,
            maxY = y

          // 计算区域内的像素数量
          let pixelCount = 1

          while (queue.length > 0) {
            const [curX, curY] = queue.shift()!

            // 更新边界
            minX = Math.min(minX, curX)
            maxX = Math.max(maxX, curX)
            minY = Math.min(minY, curY)
            maxY = Math.max(maxY, curY)

            // 检查四个方向
            for (let d = 0; d < 4; d++) {
              const nx = curX + dx[d]
              const ny = curY + dy[d]

              // 检查边界
              if (nx < 0 || nx >= width || ny < 0 || ny >= height) continue

              const nidx = ny * width + nx

              // 如果是前景像素且未访问过
              if (binaryData[nidx] === 1 && visited[nidx] === 0) {
                queue.push([nx, ny])
                visited[nidx] = 1
                pixelCount++
              }
            }
          }

          // 忽略太小的区域
          const regionWidth = maxX - minX + 1
          const regionHeight = maxY - minY + 1

          // 计算区域的填充率（前景像素占区域的比例）
          const fillRate = pixelCount / (regionWidth * regionHeight)

          // 只保留合适大小和填充率的区域
          if (regionWidth >= 10 && regionHeight >= 10 && fillRate > 0.1) {
            regions.push({
              x: minX,
              y: minY,
              width: regionWidth,
              height: regionHeight,
            })
          }
        }
      }
    }

    return regions
  }

  private filterRegions(
    regions: Array<{ x: number; y: number; width: number; height: number }>,
    imageWidth: number,
    imageHeight: number,
  ): Array<{ x: number; y: number; width: number; height: number }> {
    // 如果只有一个区域，检查它是否占据了整个图像的大部分
    if (regions.length === 1) {
      const region = regions[0]
      const regionArea = region.width * region.height
      const imageArea = imageWidth * imageHeight

      // 如果区域面积超过图像面积的90%，则认为它可能是整个图像，需要进一步分析
      if (regionArea > imageArea * 0.9) {
        // 尝试使用更严格的标准重新分割
        return this.reSplitLargeRegion(region)
      }
    }

    // 过滤掉太大的区域（超过图像面积的90%）
    return regions.filter((region) => {
      const regionArea = region.width * region.height
      const imageArea = imageWidth * imageHeight
      return regionArea <= imageArea * 0.9
    })
  }

  private reSplitLargeRegion(region: { x: number; y: number; width: number; height: number }): Array<{
    x: number
    y: number
    width: number
    height: number
  }> {
    // 这个函数可以实现更复杂的分割逻辑
    // 例如，使用边缘检测、轮廓分析等方法
    // 简单起见，我们这里返回空数组，表示丢弃这个大区域
    return []
  }

  private createRegionImage(
    region: { x: number; y: number; width: number; height: number },
    hasTransparency: boolean,
  ): string {
    // 创建新的Canvas
    const canvas = document.createElement("canvas")
    canvas.width = region.width
    canvas.height = region.height
    const ctx = canvas.getContext("2d", { willReadFrequently: true })!

    // 绘制区域
    ctx.drawImage(this.img, region.x, region.y, region.width, region.height, 0, 0, region.width, region.height)

    // 如果原图没有透明通道，需要手动将背景色设为透明
    if (!hasTransparency && this.backgroundColor) {
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
      const data = imageData.data

      // 颜色相似度阈值 - 与二值化使用相同的阈值
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

    // 返回数据URL (PNG格式，保留透明度)
    return canvas.toDataURL("image/png")
  }
}

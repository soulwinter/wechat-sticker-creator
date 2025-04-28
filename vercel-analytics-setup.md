# Vercel Analytics 和 Speed Insights 安装指南

要将 Vercel 的 Web Analytics 和 Speed Insights 添加到项目中，请按照以下步骤操作：

## 1. 安装依赖包

使用您喜欢的包管理器安装必要的依赖：

\`\`\`bash
# 使用 npm
npm install @vercel/analytics @vercel/speed-insights

# 或使用 yarn
yarn add @vercel/analytics @vercel/speed-insights

# 或使用 pnpm
pnpm add @vercel/analytics @vercel/speed-insights
\`\`\`

## 2. 启用 Vercel Analytics

在 Vercel 仪表板中，导航到您的项目，然后：

1. 点击 "Analytics" 标签
2. 点击 "Enable Analytics"
3. 完成设置向导

## 3. 启用 Speed Insights

同样在 Vercel 仪表板中：

1. 点击 "Speed Insights" 标签
2. 点击 "Enable Speed Insights"
3. 完成设置向导

## 4. 部署您的应用

一旦您部署了应用，Vercel 将自动开始收集分析数据和性能指标。您可以在 Vercel 仪表板中查看这些数据。

## 注意事项

- Web Analytics 提供有关访问者、页面浏览量和引荐来源的详细信息
- Speed Insights 提供有关网站性能的实时数据，包括核心 Web 指标
- 这两个功能在所有 Vercel 计划中都可用，包括免费计划

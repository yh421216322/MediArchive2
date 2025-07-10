#!/bin/bash

# MediArchive 部署脚本

echo "🚀 开始部署 MediArchive 应用..."

# 检查是否安装了 EAS CLI
if ! command -v eas &> /dev/null; then
    echo "❌ 未安装 EAS CLI，正在安装..."
    npm install -g @expo/eas-cli
fi

# 登录 Expo 账户
echo "📱 登录 Expo 账户..."
eas login

# 构建 Android APK
echo "🤖 构建 Android APK..."
eas build --platform android --profile production --non-interactive

# 构建 iOS IPA (可选)
echo "🍎 构建 iOS IPA..."
eas build --platform ios --profile production --non-interactive

# 构建 Web 版本
echo "🌐 构建 Web 版本..."
npx expo export --platform web

echo "✅ 部署完成！"
echo "📦 构建产物已上传到 EAS Build"
echo "🌐 Web 版本已生成在 dist/ 目录" 
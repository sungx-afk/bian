#!/bin/sh
# 把 Web 源码重新打包进 iOS 壳（ios-app/www）
# 用法：改完 src/ 但真机没生效时，手动跑一次： ./sync-ios.sh
# 说明：dev 服务（http://localhost:8080）是热更新的，真机/App 只认 ios-app/www 里的构建产物，
#       所以改完源码必须跑这个脚本，再重新出包（云端构建）才会在手机上生效。
set -e

ROOT="$(cd "$(dirname "$0")" && pwd)"
cd "$ROOT"

echo "[1/3] 清理旧产物 dist/"
rm -rf dist

echo "[2/3] 构建前端（ASSET_PUBLIC_PATH=/，保证 App 内能取到相对路径资源）"
ASSET_PUBLIC_PATH=/ npm run build

echo "[3/3] 同步到 ios-app/www"
sh ios-app/copy-web.sh

# 冒烟检查：新包里几个关键标记，缺一个就说明打的是老包
MISSING=0
check() {
  if grep -rq "$2" ios-app/www/bian-mobile/dist 2>/dev/null; then
    echo "  ✓ $1"
  else
    echo "  ✗ $1（未找到 $2）"
    MISSING=1
  fi
}
echo "冒烟检查："
check "祭拜页 Apple 免扣费逻辑" "isAppleFree"
check "祭拜页主题背景" "theme_"
check "火焰 PIXI 渲染" "FlameFilter"

if [ "$MISSING" -eq 1 ]; then
  echo "警告：部分标记为缺失，确认源码里是否还存在对应逻辑"
else
  echo "全部通过"
fi

echo
echo "完成：$(date '+%F %T')"
echo "产物：ios-app/www"
echo "下一步：真机生效需要重新出包（云端构建 / Codemagic），或把已发布站点更新到最新。"

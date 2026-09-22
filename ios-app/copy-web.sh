#!/bin/sh
# 把 Web 构建产物打进 App（本地资源，不再加载线上网页）
# 用法：确保根目录已执行 npm run build，然后 ./copy-web.sh
set -e

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

if [ ! -f dist/index.html ]; then
  echo "错误：请先在项目根目录执行 npm run build"
  exit 1
fi

# 旧资源包移到 /tmp 而不是直接删（避免一次删几百个文件触发安全策略）
if [ -d ios-app/www ]; then
  mv ios-app/www "/tmp/bian_www_old_$$"
fi
mkdir -p ios-app/www

# Webpack 产物（页面 + JS/CSS chunk）
cp -R dist/. ios-app/www/

# 老版本依赖的静态库（jquery / pixi / jweixin / smoke / plupload / qiniu ...）
cp -R static ios-app/www/static

# index.html 里外链 CDN 的静态库改成本地相对路径（离线也能跑）
sed -i '' 's#https://static-app01.yugusoft.com/static/#static/#g' ios-app/www/index.html
# 图标字体是协议相对地址（//at.alicdn.com），在 capacitor:// 协议下会被解析错，必须补 https
sed -i '' 's#"//at.alicdn.com#https://at.alicdn.com#g' ios-app/www/index.html
sed -i '' 's#href=//at.alicdn.com#href=https://at.alicdn.com#g' ios-app/www/index.html

echo "已生成 ios-app/www（本地资源包）"
du -sh ios-app/www

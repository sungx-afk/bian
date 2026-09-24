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

# index.html 里外链 CDN 的资源全部改成本地绝对路径（离线也能跑）。
# 坑：以前只替换了 /static/ 前缀，webpack 产物走的是 .../bian-mobile/dist/...，
# 漏网；App 里去请求线上 CDN 且 CDN 上没有该 hash 的文件 → manifest 404 → 白屏。
sed -i '' 's#https://static-app01.yugusoft.com/#/#g' ios-app/www/index.html
sed -i '' 's#http://static-app01.yugusoft.com/#/#g' ios-app/www/index.html
# 图标字体是协议相对地址（//at.alicdn.com），在 capacitor:// 协议下会被解析错，必须补 https
sed -i '' 's#"//at.alicdn.com#https://at.alicdn.com#g' ios-app/www/index.html
sed -i '' 's#href=//at.alicdn.com#href=https://at.alicdn.com#g' ios-app/www/index.html

# 自检：还有 CDN 外链就直接失败，别让人装上去才发现是白屏
if grep -q 'static-app01.yugusoft.com' ios-app/www/index.html; then
  echo "错误：index.html 仍有 CDN 外链，打进 App 会白屏："
  grep -oE 'https?://[^ "]*static-app01[^ "]*' ios-app/www/index.html | sort -u
  exit 1
fi

# 自检：webpack runtime（manifest.js）里的 publicPath 必须也是本地的。
# index.html 可以被 sed 兜底改掉，但 manifest.js 里的 __webpack_require__.p 改不了，
# 它若仍是 CDN 域名，路由跳转时异步 chunk 还是会去线上拉 → 页面依然白。
if grep -l 'static-app01.yugusoft.com' dist/bian-mobile/dist/js/manifest.*.js >/dev/null 2>&1; then
  echo "错误：manifest.js 里的 publicPath 仍指向 CDN，请用 ASSET_PUBLIC_PATH=/ npm run build 重新构建"
  exit 1
fi

# 自检：webpack 入口 js/css 必须已经在本地资源包里
for f in $(grep -oE '/bian-mobile/dist/[A-Za-z0-9_./-]+' ios-app/www/index.html | sort -u); do
  if [ ! -f "ios-app/www$f" ]; then
    echo "错误：index.html 引用的资源在本地包里不存在：ios-app/www$f"
    exit 1
  fi
done

echo "已生成 ios-app/www（本地资源包）"
du -sh ios-app/www

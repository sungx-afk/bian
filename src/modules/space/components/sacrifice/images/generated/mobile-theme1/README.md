# 主题 1 手机素材

使用内置 `image_gen` 重绘四套背景与双层桌子，供 393×852 手机祭拜页使用。

背景实际输出均为 **852×1846**，桌子均为 **1774×887**。背景接近 393:852 的竖屏比例，桌子为 2:1 的独立透明底素材。四套背景的尺寸相同，四张桌子的尺寸也相同。

| 界面语言 | 视觉风格 | 背景 | 桌子 |
| --- | --- | --- | --- |
| 简中 / 繁中 | 中式木构、灯笼、格窗 | [背景](/Volumes/data/workspace/bian/src/modules/space/components/sacrifice/images/generated/mobile-theme1/memorial-hall-chinese.webp) | [透明桌子](/Volumes/data/workspace/bian/src/modules/space/components/sacrifice/images/generated/mobile-theme1/altar-table-chinese.webp) |
| 英文 | 浅色墙面、壁灯、欧式木作 | [背景](/Volumes/data/workspace/bian/src/modules/space/components/sacrifice/images/generated/mobile-theme1/memorial-hall-western.webp) | [透明桌子](/Volumes/data/workspace/bian/src/modules/space/components/sacrifice/images/generated/mobile-theme1/altar-table-western.webp) |
| 日语 | 浅木、障子纸门、榻榻米 | [背景](/Volumes/data/workspace/bian/src/modules/space/components/sacrifice/images/generated/mobile-theme1/memorial-hall-japanese.webp) | [透明桌子](/Volumes/data/workspace/bian/src/modules/space/components/sacrifice/images/generated/mobile-theme1/altar-table-japanese.webp) |
| 韩语 | 深木梁柱、韩纸格窗、木地板 | [背景](/Volumes/data/workspace/bian/src/modules/space/components/sacrifice/images/generated/mobile-theme1/memorial-hall-korean.webp) | [透明桌子](/Volumes/data/workspace/bian/src/modules/space/components/sacrifice/images/generated/mobile-theme1/altar-table-korean.webp) |

构图参考：中央保留名称、照片和墓志铭的低细节区域；窗格、纸门或壁灯放入两侧的手机可见区域；地面留给页面叠加的桌子、香炉和蜡烛。桌子使用相同的双层布局参考与正面透视。用户照片、名称、挽联与祭品均未烘焙进背景。

[完整生成提示词与参考输入](/Volumes/data/workspace/bian/src/modules/space/components/sacrifice/images/generated/mobile-theme1/generation-prompts.json)。WebP 背景采用质量 90 编码，桌子使用无损编码并完整保留生成图的 Alpha 通道。

只替换主题 1 的背景、桌子及选择页预览。点烛数量、香炉固定居中、海外挽联隐藏规则继续使用现有逻辑。


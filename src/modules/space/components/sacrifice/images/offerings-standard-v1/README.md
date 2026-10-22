# 祭拜贡品统一素材标准 v1

祭拜页贡品使用统一的 512×512 透明 PNG 画布，保留现有 10vw 布局槽位。贡品主体在素材画布内留白缩小，页面按 100% 槽位宽度显示整张画布，避免对透明留白二次缩放导致贡品过小。这样比原素材略小、视觉尺寸统一，同时不会挤动香炉、烛台或其他摆放位置。

所有新图都参考了 `images/` 下的原图，用内置 `image_gen` 重绘并以带透明通道的 PNG 交付。原始 PNG 保留在父目录；完整提示词、原图路径和文件映射记录在 [generation-prompts.json](./generation-prompts.json)。馒头在普通供品和九品供席中共用同一张图。

酒、甜点／馒头、肉类、米饭和鱼类按登录语言提供地区版本：日语使用清酒、和菓子、炸猪排、烤鸡串和日式鱼饭；韩语使用烧酒、松饼／米糕、韩式猪肉和鸡肉料理；英语使用红酒、西式甜点、餐包和烤肉。祭拜页根据根节点的 `memorial-theme-*` 类切换图片。水果与鲜花作为通用供品共享原图。物品 ID 和各地区素材映射记录在 [regional-offerings.json](./regional-offerings.json)。

## 素材

- [花束](./item_hua_01.png)
- [白酒壶](./item_jiu_01.png)
- [白酒瓶](./item_jiu_02.png)
- [馒头](./item_mantou.png)
- [月饼](./item_pan_bing.png)
- [烤鸭](./item_pan_ya.png)
- [红烧肉](./item_pk_jiuxi_hongsaorou.png)
- [整鸡](./item_pk_jiuxi_ji.png)
- [茅台瓶](./item_pk_jiuxi_maotai.png)
- [米饭碗](./item_pk_jiuxi_mifan.png)
- [九品烤鸭](./item_pk_jiuxi_ya.png)
- [清蒸鱼](./item_pk_jiuxi_yu.png)
- [水果盘](./item_shuiguo.png)

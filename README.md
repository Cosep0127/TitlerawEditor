# TitleRaw 编辑器

Minecraft 基岩版 `/titleraw` 命令的可视化编辑器，Apple 极简风格。

## 功能

- **可视化组件编辑**：添加、删除、排序组件，支持 text / selector / score / translate 四种类型
- **颜色与格式参考**：29 种基岩版颜色代码 + B/I/K/R 格式，点击复制 § 编码
- **命令导入**：粘贴现有命令或 JSON，自动解析为组件
- **实时预览**：命令预览（格式化/压缩切换）+ 视觉预览（支持 § 代码和 \n 换行渲染）
- **一键复制**：复制生成好的命令到剪贴板

## 使用

直接用浏览器打开 `index.html`，无需任何依赖。

## 文件

```text
├── index.html    页面骨架
├── style.css     Apple 极简样式
├── script.js     交互逻辑
└── README.md     本文件
```

## 颜色说明

基岩版支持 29 种颜色代码，包括 16 种标准色和 13 种材质色（如 minecoin_gold、material_redstone、material_diamond 等）。在文本中使用 `§` + 代码字符即可应用颜色或格式。

# light 的讲义 · 总站

课程总站（https://cockroach-f.github.io/）与姊妹站点导航组件的唯一数据源。

## 这里有什么

- `index.html` — 总站首页，课程卡片墙（从 `sites.json` 渲染）
- `sites.json` — **唯一的课程清单**：总站卡片、各站顶栏「全部课程」下拉菜单都读它
- `sister-nav.js` / `sister-nav.css` — 顶栏下拉菜单组件，各课程站引用后自动注入

## 新增一门课

1. 在新课程仓库的 `mkdocs.yml` 里加上（只需一次，之后不用再改）：
   ```yaml
   extra_javascript:
     - https://cockroach-f.github.io/sister-nav.js
   extra_css:
     - https://cockroach-f.github.io/sister-nav.css
   ```
   并删掉旧的页脚 `extra.social` 姊妹条目和导航底部的姊妹外链（如果有）。
2. 往 `sites.json` 的 `sites` 数组加一条：`id`（仓库名/URL 第一段）、`name`、`desc`、`url`、`glyph`（单字符号）、`color`（六位十六进制）。
3. 推送即可：总站卡片和所有分站的下拉菜单自动同步，旧课程仓库不需要任何改动。

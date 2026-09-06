# Prehistoric Ocean

史前海洋互動博物館 Prototype v0.1。這個階段僅包含 Three.js 場景、相機、渲染器、海床、基礎水下環境、動畫迴圈與準心。

## 開發

```bash
npm install
npm run dev
```

## 建置

```bash
npm run build
```

Vite 使用相對路徑輸出，可部署至 GitHub Pages 專案子路徑。
推送到 `main` 後，內附的 GitHub Actions workflow 可建置並部署 `dist/`。

## 後續擴充方向

- `src/core/`：渲染生命週期、輸入控制與系統協調
- `src/world/`：年代場景、海床、光線、生物與環境物件
- `src/ui/`：生物資訊、手機控制與其他介面

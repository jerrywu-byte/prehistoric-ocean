# Prehistoric Ocean

史前海洋互動博物館 Prototype v0.2。這個階段包含 Three.js 水下場景，以及桌機版第一人稱潛水控制。

## 操作

- 點擊畫面：啟用滑鼠觀看
- `W` / `A` / `S` / `D`：依視角方向移動
- `Space`：上浮
- `Shift`：下潛
- `Esc`：解除滑鼠控制

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

- `src/core/`：渲染生命週期與系統協調
- `src/controls/`：潛水移動、鍵盤輸入與 Pointer Lock 視角控制
- `src/world/`：年代場景、海床、光線、生物與環境物件
- `src/ui/`：生物資訊、手機控制與其他介面

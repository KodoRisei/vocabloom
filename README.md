# VocaBloom

英語フレーズ・単語の個人学習アプリ。優先度スコアリングで苦手語彙を重点出題し、スライディングウィンドウ形式のクイズで効率的に習得する。

## 技術スタック

| 領域 | 技術 |
|---|---|
| Frontend | React 19 + Vite + TypeScript + Tailwind CSS v4 |
| State / Cache | Zustand + TanStack Query |
| Animation | Framer Motion |
| Backend | NestJS 11 + TypeScript |
| ORM | Prisma 6 |
| DB | PostgreSQL 16 |
| Infrastructure | Docker Compose |
| Monorepo | npm workspaces |

## 前提条件

- Node.js v20+
- Docker Desktop

## セットアップ

```bash
# 依存インストール
npm install

# PostgreSQL 起動
npm run db:up

# DB マイグレーション
DATABASE_URL="postgresql://vocabloom:vocabloom_dev@localhost:5433/vocabloom_dev" \
  apps/api/node_modules/.bin/prisma migrate deploy \
  --schema=apps/api/prisma/schema.prisma

# Prisma クライアント生成
DATABASE_URL="..." apps/api/node_modules/.bin/prisma generate \
  --schema=apps/api/prisma/schema.prisma

# シードデータ投入
npm run db:seed
```

## 起動

```bash
# API と Web を同時起動
npm run dev
```

| サービス | URL |
|---|---|
| Web | http://localhost:5173 |
| API | http://localhost:3001/api/v1 |
| DB | localhost:5433 |

> **ポートについて:** 5432 / 3000 が別サービスで使用中のため、DB は 5433、API は 3001 を使用。

### 個別起動

```bash
# DB のみ
docker compose -f docker-compose.dev.yml up -d

# API のみ（ビルド後）
cd apps/api && ../../node_modules/.bin/nest build
DATABASE_URL="postgresql://vocabloom:vocabloom_dev@localhost:5433/vocabloom_dev" \
  PORT=3001 node dist/src/main.js

# Web のみ
node_modules/.bin/vite apps/web --port 5173
```

## 主な機能

### 語彙管理
- 英語表現 + 日本語訳 + メモの登録・編集・削除
- 大文字小文字を無視した重複防止（`HOLLOW` と `hollow` は同一）
- キーワード検索・ページネーション

### クイズ（スライディングウィンドウ方式）
- 出題数: 5 / 10 / 20 / 50 問から選択
- 常に最大5問を表示（ウィンドウ）
- 左列: 英語カード（最大5枚）
- 右列: 日本語8枚（ウィンドウ内5正解 + ランダムダミー3枚、シャッフル済み）
- 英語カードを選択 → 日本語を選んで正誤判定
- 正解した問題はウィンドウから消え、未出題の問題が補充される

### 学習履歴・優先度スコアリング
- 各語彙の正解数・連続正解（streak）・最終回答日を記録
- 苦手語彙・長期未学習語彙を優先出題（重み付きスコアリング）

## プロジェクト構成

```
vocabloom/
├── apps/
│   ├── api/               # NestJS バックエンド
│   │   ├── src/
│   │   │   ├── modules/
│   │   │   │   ├── vocabularies/
│   │   │   │   ├── quiz/
│   │   │   │   └── learning-records/
│   │   │   └── common/
│   │   └── prisma/
│   │       ├── schema.prisma
│   │       └── seed.ts
│   └── web/               # React フロントエンド
│       └── src/
│           ├── pages/
│           ├── components/
│           ├── services/
│           ├── store/
│           └── types/
├── docs/
│   └── system-design.md   # 詳細設計書
└── docker-compose.dev.yml
```

## 環境変数

`apps/api/.env`:

```env
DATABASE_URL="postgresql://vocabloom:vocabloom_dev@localhost:5433/vocabloom_dev"
PORT=3001
NODE_ENV=development
```

## ドキュメント

詳細設計は [docs/system-design.md](docs/system-design.md) を参照。

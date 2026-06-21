# VocaBloom — システム設計書

## 1. アーキテクチャ概要

```
┌─────────────────────────────────────────────────────────┐
│                     Client Layer                         │
│                                                         │
│   React 19 + Vite (SPA)                                 │
│   ├── Zustand（クイズ状態管理）                           │
│   ├── TanStack Query（API キャッシュ）                    │
│   └── Framer Motion（カードアニメーション）               │
│                      │ HTTP/REST                        │
└──────────────────────┼──────────────────────────────────┘
                       │
┌──────────────────────▼──────────────────────────────────┐
│                     API Layer                            │
│                                                         │
│   NestJS 11 + TypeScript                                │
│   ├── VocabulariesModule（CRUD + 重複防止）              │
│   ├── QuizModule                                        │
│   │   ├── QuizService（スライディングウィンドウ管理）      │
│   │   ├── PriorityService（出題優先度スコアリング）        │
│   │   └── DecoyService（ダミー選択肢生成）               │
│   ├── LearningRecordsModule（履歴・統計）                │
│   └── Prisma 6（ORM）                                   │
│                      │                                  │
└──────────────────────┼──────────────────────────────────┘
                       │
┌──────────────────────▼──────────────────────────────────┐
│                    Data Layer                            │
│                                                         │
│   PostgreSQL 16（Docker、ポート 5433）                   │
│   ├── vocabularies                                      │
│   ├── learning_records                                  │
│   ├── quiz_sessions                                     │
│   └── quiz_session_items                               │
└─────────────────────────────────────────────────────────┘
```

---

## 2. フロントエンド設計

### ライブラリ選定

| ライブラリ | 目的 |
|---|---|
| React 19 + Vite | SPA フレームワーク |
| TypeScript | 型安全 |
| React Router v6 | ルーティング |
| Zustand | クイズ状態（ウィンドウ・選択・スコア） |
| TanStack Query | API キャッシュ・ローディング状態 |
| Axios | HTTP クライアント |
| Tailwind CSS v4 | スタイリング |
| Framer Motion | カードアニメーション（AnimatePresence） |

### ページ構成

```
/                        → HomePage（学習サマリー）
/vocabularies            → VocabularyListPage（一覧・検索）
/vocabularies/new        → VocabularyFormPage（新規登録）
/vocabularies/:id/edit   → VocabularyFormPage（編集）
/quiz                    → QuizConfigPage（問題数選択）
/quiz/:sessionId         → QuizGamePage（クイズ画面）
/quiz/:sessionId/result  → QuizResultPage（結果）
/history                 → HistoryPage（学習履歴）
```

### クイズ UI 設計（スライディングウィンドウ）

```
┌──────────────────────────────────────────────────────┐
│  進捗 3/10   正解 3   ミス 1                   [終了] │
│  ━━━━━━━━━━━━━━━━━━━━━━━░░░░░░░░░░░░░░░░░░░░░░░░░   │
├──────────────────────────────────────────┬───────────┤
│  英語 (5問表示中)      │  日本語 (正解を選んでください) │
│                        │                │
│  [look after]          │  [〜の世話をする] ← 正解の1つ│
│  [relevant]  ← 選択中  │  [精度]         ← ダミー    │
│  [precision]           │  [関連する]     ← 正解の1つ │
│  [involve]             │  [成し遂げる]   ← ダミー    │
│  [accomplish]          │  [〜を含む]     ← 正解の1つ │
│                        │  [状況]         ← ダミー    │
│                        │  [look after の訳]          │
│                        │  [involve の訳]             │
├──────────────────────────────────────────────────────┤
│        「relevant」の日本語訳を選んでください          │
└──────────────────────────────────────────────────────┘
```

**操作フロー:**
1. 左列の英語カードをクリック（ハイライト）
2. 右列の日本語を選択 → サーバーが正誤判定
3. 正解: 英語カードがウィンドウから消え、未出題の1問が補充される
4. 不正解: 英語カードはそのまま残る。ウィンドウが更新（ダミー再シャッフル）
5. 全問正解で完了、結果画面へ

### Zustand ストア（`quizStore.ts`）

```typescript
interface QuizState {
  sessionId: string | null;
  questionCount: number;
  activeItems: ActiveItem[];      // 現在ウィンドウに表示中の英語カード（最大5）
  japaneseOptions: JapaneseOption[]; // 右列（正解5 + ダミー3 = 8枚）
  stats: WindowStats | null;

  selectedEnglishId: string | null; // 選択中の英語カードのvocabularyId
  correctCount: number;
  incorrectCount: number;
  lastAnswerCorrect: boolean | null;
  isSubmitting: boolean;
  sessionCompleted: boolean;
}
```

---

## 3. バックエンド設計

### NestJS モジュール構成

```
AppModule
├── PrismaModule（グローバル）
│
├── VocabulariesModule
│   ├── VocabulariesController
│   ├── VocabulariesService
│   │   └── assertNoDuplicateEnglish()  ← 大文字小文字無視で重複チェック
│   └── dto/
│       ├── create-vocabulary.dto.ts
│       ├── update-vocabulary.dto.ts
│       └── query-vocabulary.dto.ts
│
├── QuizModule
│   ├── QuizController
│   ├── QuizService
│   │   ├── createSession()     ← 重み付きサンプリング + ウィンドウ初期化
│   │   ├── getWindow()         ← 現在ウィンドウ + ダミー生成
│   │   ├── submitAnswer()      ← 正誤判定 + ウィンドウ更新 + 学習記録更新
│   │   ├── completeSession()
│   │   └── abandonSession()
│   ├── PriorityService
│   │   ├── calculate()         ← 優先度スコア計算
│   │   └── weightedSample()    ← 重み付きランダムサンプリング
│   ├── DecoyService
│   │   └── generateRandom()    ← ダミー日本語訳をランダム抽出
│   └── dto/
│       ├── create-quiz-session.dto.ts
│       └── submit-answer.dto.ts
│
├── LearningRecordsModule
│   ├── LearningRecordsController
│   └── LearningRecordsService
│
└── CommonModule
    ├── filters/HttpExceptionFilter     ← 統一エラーレスポンス
    └── interceptors/ResponseInterceptor ← { success, data } ラッパー
```

### 出題優先度スコアリング

苦手語彙・長期未学習語彙を優先出題するが、得意語彙も一定確率で出題（完全除外なし）。

```
Priority(v) = 0.40×T + 0.40×E − 0.20×S + 5 (最低保証)

T = min(経過日数 / 30, 1.0) × 100   ← 未回答 or 長期未学習で高くなる
E = (incorrectCount / (total + 1)) × 100  ← 誤答率が高いほど高い
S = min(streak × 10, 80)             ← 連続正解数が多いと下がる
```

| ケース | T | E | S | スコア |
|---|---|---|---|---|
| 新規未学習 | 100 | 0 | 0 | 45.0 |
| 昨日間違えた | 3 | 80 | 0 | 33.2 |
| streak=5、1週間前 | 23 | 10 | 50 | 22.2 |
| streak=10、今日 | 0 | 0 | 80 | **5.0（下限）** |

### スライディングウィンドウアルゴリズム

```
createSession(N):
  1. 全語彙を優先度スコアで重み付きサンプリング → N件選択
  2. position 0〜N-1 を割り当て
  3. position 0〜4 を ACTIVE、5〜N-1 を PENDING に設定
  4. buildWindow() で初期ウィンドウを返す

buildWindow(sessionId):
  1. ACTIVE な QuizSessionItem を取得（最大5件）
  2. ACTIVE な vocabularyId 以外から 3件ランダム抽出（DecoyService）
  3. 正解5件 + ダミー3件 = 8件をシャッフルして返す

submitAnswer(vocabularyId, selectedVocabularyId):
  正解 (vocabularyId == selectedVocabularyId):
    - QuizSessionItem.status → CORRECT
    - 次の PENDING を ACTIVE に昇格（ウィンドウ補充）
    - LearningRecord: correctCount++, streak++, lastCorrectAt = now
    - ACTIVE + PENDING が 0 件 → セッション完了

  不正解:
    - QuizSessionItem.attemptCount++（ACTIVE のまま）
    - LearningRecord: incorrectCount++, streak = 0
    - ウィンドウ更新（ダミーを再シャッフル）
```

### ダミー選択肢生成（DecoyService）

```typescript
// アクティブウィンドウ外の語彙からランダム3件抽出
generateRandom(excludeVocabIds: string[], count: number): Promise<DecoyOption[]>
// → SELECT id, japanese_translation FROM vocabularies
//    WHERE id != ALL($1) ORDER BY random() LIMIT $2
```

将来の拡張ポイント（同インターフェースで差し替え可）:
- `generateByDifficulty()` — 同難易度の類義語
- `generateBySemantic()` — 意味的に近い選択肢
- `generateByAI()` — LLM 生成ダミー

---

## 4. Prisma スキーマ

```prisma
model Vocabulary {
  id                  String            @id @default(uuid()) @db.Uuid
  englishExpression   String            @map("english_expression") @db.VarChar(500)
  japaneseTranslation String            @map("japanese_translation") @db.VarChar(500)
  notes               String?           @db.Text
  createdAt           DateTime          @default(now()) @map("created_at")
  updatedAt           DateTime          @updatedAt @map("updated_at")

  learningRecord   LearningRecord?
  quizSessionItems QuizSessionItem[]

  // 大文字小文字無視のユニーク制約（マイグレーションで生成）:
  // CREATE UNIQUE INDEX vocabularies_english_ci_uq ON vocabularies (lower(english_expression));
  @@index([createdAt])
  @@map("vocabularies")
}

model LearningRecord {
  id           String     @id @default(uuid()) @db.Uuid
  vocabularyId String     @unique @map("vocabulary_id") @db.Uuid
  vocabulary   Vocabulary @relation(fields: [vocabularyId], references: [id], onDelete: Cascade)

  correctCount   Int   @default(0) @map("correct_count")
  incorrectCount Int   @default(0) @map("incorrect_count")
  streak         Int   @default(0)
  priorityScore  Float @default(100) @map("priority_score")

  lastAnsweredAt DateTime? @map("last_answered_at")
  lastCorrectAt  DateTime? @map("last_correct_at")
  createdAt      DateTime  @default(now()) @map("created_at")
  updatedAt      DateTime  @updatedAt @map("updated_at")

  @@index([priorityScore(sort: Desc)])
  @@map("learning_records")
}

model QuizSession {
  id             String            @id @default(uuid()) @db.Uuid
  questionCount  Int               @map("question_count")
  windowSize     Int               @default(5) @map("window_size")
  correctCount   Int               @default(0) @map("correct_count")
  incorrectCount Int               @default(0) @map("incorrect_count")
  status         QuizSessionStatus @default(IN_PROGRESS)
  startedAt      DateTime          @default(now()) @map("started_at")
  completedAt    DateTime?         @map("completed_at")

  items QuizSessionItem[]

  @@index([startedAt(sort: Desc)])
  @@map("quiz_sessions")
}

enum QuizSessionStatus { IN_PROGRESS COMPLETED ABANDONED }

model QuizSessionItem {
  id           String         @id @default(uuid()) @db.Uuid
  sessionId    String         @map("session_id") @db.Uuid
  session      QuizSession    @relation(fields: [sessionId], references: [id], onDelete: Cascade)
  vocabularyId String         @map("vocabulary_id") @db.Uuid
  vocabulary   Vocabulary     @relation(fields: [vocabularyId], references: [id])

  position     Int
  status       QuizItemStatus @default(PENDING)
  displayedAt  DateTime?      @map("displayed_at")

  attemptCount Int       @default(0) @map("attempt_count")
  isCorrect    Boolean?  @map("is_correct")
  answeredAt   DateTime? @map("answered_at")

  @@unique([sessionId, vocabularyId])
  @@unique([sessionId, position])
  @@map("quiz_session_items")
}

enum QuizItemStatus { PENDING ACTIVE CORRECT }
```

---

## 5. PostgreSQL テーブル設計

### vocabularies

| カラム | 型 | 制約 |
|---|---|---|
| id | UUID | PK |
| english_expression | VARCHAR(500) | NOT NULL |
| japanese_translation | VARCHAR(500) | NOT NULL |
| notes | TEXT | NULL |
| created_at | TIMESTAMPTZ | NOT NULL DEFAULT NOW() |
| updated_at | TIMESTAMPTZ | NOT NULL |

**インデックス:**
- `vocabularies_english_ci_uq` — `UNIQUE ON (lower(english_expression))` （大文字小文字無視の重複防止）
- `vocabularies_created_at_idx` — `created_at` 降順

### learning_records

| カラム | 型 | 制約 |
|---|---|---|
| id | UUID | PK |
| vocabulary_id | UUID | FK(vocabularies), UNIQUE |
| correct_count | INTEGER | DEFAULT 0 |
| incorrect_count | INTEGER | DEFAULT 0 |
| streak | INTEGER | DEFAULT 0 |
| priority_score | FLOAT8 | DEFAULT 100 |
| last_answered_at | TIMESTAMPTZ | NULL |
| last_correct_at | TIMESTAMPTZ | NULL |
| created_at | TIMESTAMPTZ | NOT NULL DEFAULT NOW() |
| updated_at | TIMESTAMPTZ | NOT NULL |

**インデックス:** `priority_score DESC`

### quiz_sessions

| カラム | 型 | 制約 |
|---|---|---|
| id | UUID | PK |
| question_count | INTEGER | NOT NULL |
| window_size | INTEGER | NOT NULL DEFAULT 5 |
| correct_count | INTEGER | DEFAULT 0 |
| incorrect_count | INTEGER | DEFAULT 0 |
| status | ENUM | DEFAULT 'IN_PROGRESS' |
| started_at | TIMESTAMPTZ | NOT NULL DEFAULT NOW() |
| completed_at | TIMESTAMPTZ | NULL |

### quiz_session_items

| カラム | 型 | 制約 |
|---|---|---|
| id | UUID | PK |
| session_id | UUID | FK(quiz_sessions) |
| vocabulary_id | UUID | FK(vocabularies) |
| position | INTEGER | NOT NULL（セッション内の出題順） |
| status | ENUM | DEFAULT 'PENDING'（PENDING / ACTIVE / CORRECT） |
| displayed_at | TIMESTAMPTZ | NULL（ACTIVE 昇格日時） |
| attempt_count | INTEGER | DEFAULT 0 |
| is_correct | BOOLEAN | NULL（未回答は NULL） |
| answered_at | TIMESTAMPTZ | NULL |

**ユニーク制約:** `(session_id, vocabulary_id)`、`(session_id, position)`

---

## 6. API 設計

### ベース URL: `/api/v1`

#### Vocabulary API

| Method | Path | 説明 |
|---|---|---|
| GET | `/vocabularies` | 一覧取得（`?page=1&limit=20&search=look`） |
| POST | `/vocabularies` | 新規登録（重複時 409 Conflict） |
| GET | `/vocabularies/:id` | 詳細取得（学習履歴付き） |
| PATCH | `/vocabularies/:id` | 更新（英語表現変更時も重複チェック） |
| DELETE | `/vocabularies/:id` | 削除 |

#### Quiz API

| Method | Path | 説明 |
|---|---|---|
| POST | `/quiz/sessions` | セッション開始（`{ questionCount: 5\|10\|20\|50 }`） |
| GET | `/quiz/sessions/:id` | セッション詳細取得 |
| GET | `/quiz/sessions/:id/window` | 現在のウィンドウ取得（英語5 + 日本語8） |
| POST | `/quiz/sessions/:id/answer` | 回答送信（`{ vocabularyId, selectedVocabularyId }`） |
| PATCH | `/quiz/sessions/:id/complete` | セッション完了 |
| PATCH | `/quiz/sessions/:id/abandon` | セッション放棄 |

**`POST /quiz/sessions` レスポンス例:**
```json
{
  "success": true,
  "data": {
    "sessionId": "uuid",
    "status": "IN_PROGRESS",
    "activeItems": [
      { "vocabularyId": "uuid", "englishExpression": "look after", "position": 0 }
    ],
    "japaneseOptions": [
      { "vocabularyId": "uuid", "japaneseTranslation": "〜の世話をする" }
    ],
    "stats": { "totalCount": 10, "answeredCount": 0, "remainingCount": 10, "windowSize": 5 }
  }
}
```

**`POST /quiz/sessions/:id/answer` リクエスト:**
```json
{ "vocabularyId": "uuid-of-english-card", "selectedVocabularyId": "uuid-of-chosen-japanese" }
```

正解判定: `vocabularyId === selectedVocabularyId`（サーバーサイドで判定）

**`POST /quiz/sessions/:id/answer` レスポンス:**
```json
{
  "data": {
    "isCorrect": true,
    "sessionCompleted": false,
    "window": { "activeItems": [...], "japaneseOptions": [...], "stats": {...} }
  }
}
```

#### Learning Records API

| Method | Path | 説明 |
|---|---|---|
| GET | `/learning-records` | 全語彙の学習記録一覧 |
| GET | `/learning-records/vocabulary/:id` | 特定語彙の記録 |
| GET | `/learning-records/stats` | 学習統計サマリー |

#### 共通レスポンス形式

```typescript
// 成功
{ "success": true, "data": { ... } }

// エラー
{ "success": false, "error": { "statusCode": 404, "message": "..." } }
```

---

## 7. 学習記録の更新ルール

| イベント | correctCount | incorrectCount | streak | lastAnsweredAt | lastCorrectAt |
|---|---|---|---|---|---|
| 正解 | +1 | 変化なし | +1 | 更新 | 更新 |
| 不正解 | 変化なし | +1 | **0にリセット** | 更新 | 変化なし |

回答後に `priorityScore` を再計算してDBに保存。

---

## 8. ディレクトリ構成

```
vocabloom/
├── README.md
├── package.json                      ← npm workspaces ルート
├── docker-compose.dev.yml
├── docs/
│   └── system-design.md
│
├── apps/
│   ├── api/                          ← NestJS バックエンド
│   │   ├── src/
│   │   │   ├── main.ts               ← GlobalPrefix /api/v1, CORS, ValidationPipe
│   │   │   ├── app.module.ts
│   │   │   ├── modules/
│   │   │   │   ├── vocabularies/
│   │   │   │   │   ├── vocabularies.controller.ts
│   │   │   │   │   ├── vocabularies.service.ts
│   │   │   │   │   └── dto/
│   │   │   │   ├── quiz/
│   │   │   │   │   ├── quiz.controller.ts
│   │   │   │   │   ├── quiz.service.ts
│   │   │   │   │   ├── priority.service.ts
│   │   │   │   │   ├── decoy.service.ts
│   │   │   │   │   └── dto/
│   │   │   │   └── learning-records/
│   │   │   └── common/
│   │   │       ├── prisma/
│   │   │       ├── filters/          ← HttpExceptionFilter
│   │   │       └── interceptors/     ← ResponseInterceptor
│   │   ├── prisma/
│   │   │   ├── schema.prisma
│   │   │   ├── seed.ts
│   │   │   └── migrations/
│   │   └── package.json
│   │
│   └── web/                          ← React フロントエンド
│       └── src/
│           ├── pages/
│           │   ├── HomePage.tsx
│           │   ├── VocabularyListPage.tsx
│           │   ├── VocabularyFormPage.tsx
│           │   ├── QuizConfigPage.tsx
│           │   ├── QuizGamePage.tsx
│           │   ├── QuizResultPage.tsx
│           │   └── HistoryPage.tsx
│           ├── components/
│           │   ├── common/           ← Button, Input, LoadingSpinner
│           │   └── quiz/             ← MatchCard（旧方式、未使用）
│           ├── services/
│           │   ├── api.ts            ← Axios インスタンス（proxy → localhost:3001）
│           │   ├── vocabulary.api.ts
│           │   ├── quiz.api.ts
│           │   └── learningRecord.api.ts
│           ├── store/
│           │   └── quizStore.ts      ← Zustand（スライディングウィンドウ状態）
│           └── types/
│               └── index.ts
│
└── packages/
    └── shared/                       ← 共有型定義（将来利用）
```

---

## 9. 設計上の主要な決定

| 決定事項 | 採用内容 | 理由 |
|---|---|---|
| 重複防止 | DB の `lower()` 関数インデックス | Prisma が `citext` 拡張に未対応のため |
| 正誤判定 | サーバーサイドで `vocabularyId === selectedVocabularyId` | クライアントに正解情報を持たせない |
| ダミー選択肢 | `ORDER BY random()` でランダム抽出 | シンプルで十分。将来は DistractorStrategy に差し替え可 |
| クイズ状態 | `QuizItemStatus` (PENDING/ACTIVE/CORRECT) を DB 管理 | リロード後もセッション復元可能 |
| DBキー | UUID | 将来のマルチユーザー・分散対応 |
| APIバージョン | `/api/v1` | 破壊的変更時に v2 を並行稼働 |
| スコア下限 | `FLOOR = 5` | 得意語彙を完全除外しない |
| Monorepo | npm workspaces | 型共有・依存管理がシンプル |
| 認証 | MVP では不要 | `user_id` カラム追加で後付け対応可 |

---

## 10. 将来拡張

### ダミー選択肢の高度化
`DecoyService.generateRandom()` を差し替えるだけで対応可能:
- 難易度マッチング（同レベルの語彙からダミーを選ぶ）
- 意味的近傍（Word2Vec / Embedding）
- LLM 生成（Anthropic claude-sonnet-4-6）

### ユーザー認証
`vocabularies.user_id UUID NULL` をマイグレーションで追加 + NestJS に `AuthModule` + JWT Guard。

### カテゴリ / タグ
`categories` テーブル + `vocabulary_tags` 中間テーブルを追加。クイズ出題時のフィルター対応。

### モバイル対応
`apps/mobile`（React Native + Expo）を追加。API 層は共通利用。`packages/shared` に型定義を集約。

### インフラ拡張パス
```
開発:     Docker Compose（現在）
個人公開: Railway / Render
本格展開: AWS ECS Fargate + RDS
```

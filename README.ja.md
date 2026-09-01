<p align="center">
  <img src="assets/banner.svg" alt="S-skills" width="720">
</p>

<p align="center">
  <a href="https://github.com/s0613/S-skills/releases"><img src="https://img.shields.io/badge/version-3.8.0-f7a521?style=flat-square&labelColor=0d0d0d" alt="version"></a>
  <a href="https://github.com/s0613/S-skills"><img src="https://img.shields.io/badge/claude--plugin-install-f7a521?style=flat-square&labelColor=0d0d0d" alt="plugin"></a>
  <a href="LICENSE"><img src="https://img.shields.io/badge/license-MIT-f7a521?style=flat-square&labelColor=0d0d0d" alt="license"></a>
</p>

<p align="center">
  <a href="README.md">🇰🇷 한국어</a>
  &nbsp;·&nbsp;
  <a href="README.en.md">🇺🇸 English</a>
  &nbsp;·&nbsp;
  <a href="README.zh.md">🇨🇳 中文</a>
  &nbsp;·&nbsp;
  <strong>🇯🇵 日本語</strong>
</p>

<br>

<p align="center">
  <strong>一人でも、会社のように。</strong>
</p>

<p align="center">
  PM、デザイナー、開発者、QA、セキュリティ専門家が<br>
  Claude Code の中でチームのように動きます。
</p>

<br>

---

## 何をするのか

S-skills は**ロールベースの AI 開発オーケストレーター**です。

要件分析から設計、実装、レビュー、リリースまで——タスクを言葉で説明すれば、必要な専門家が自動的に投入されます。人のように協働し、結果だけを返します。

```
/sj-company ログイン機能を作って
```

```
[Medium] "ログイン機能を作って"
必要なロール: database, backend, security, frontend
ディスパッチ順: 1) database  2) backend + security 並列  3) frontend
```

---

## コアロール

| ロール | 役割 |
|--------|------|
| **PM** | 要件分析、リスク検討、優先順位の定義 |
| **Design** | リファレンス DNA ベースの UI 設計、AI っぽさを除く検査 |
| **Tech Lead** | 専門サブエージェントの並列ディスパッチ + 結果統合 |
| **Frontend** | UI・コンポーネント・アクセシビリティ・レスポンシブ実装 |
| **Backend** | API・サーバー・ドメインロジック実装 |
| **Security** | OWASP Top 10 + STRIDE 実装 + 横断レビュー |
| **QA** | 独立検証——実装者の成果物を参照せず直接探索 |

---

## 何が違うのか

**専門家レベルの協働プロトコル**

サブエージェントは Tech Lead を経由せず、チームチャンネルで直接調整します。Database が「nullable カラムに注意」と投稿すると、Backend が直接読んで対応します。

**好みが蓄積するデザインシステム**

却下した方向は封印され、承認した方向は積み重なります。時間が経つほどブランドのアイデンティティが鮮明になります。

**QA の独立性を保証**

QA は実装者が書いた要約ドキュメントを読みません。PM ブリーフと実際のファイルを直接探索し、バイアスなく検証します。

---

## ハーネス設計——gbrain から取り入れた 6 つ

[garrytan/gbrain](https://github.com/garrytan/gbrain) の実証済みハーネス構造を S-skills に移植しました。スキルが増えても崩れないようにする骨格です。

| # | 原則 | 何をするか |
|---|------|-----------|
| 1 | **2 層ルーティング** | トリガー→スキルのルーティングを [`RESOLVER.md`](skills/RESOLVER.md) 一箇所に集約。sj-company は薄いディスパッチャーになり（866→542 行）、厚い本文はオンデマンドでロード |
| 2 | **横断コンベンションの一元化** | ヒューマンゲート・PII・archive-only・Judge 独立性・RUN_ID・friction・context-curation を [`_conventions/`](skills/_conventions) に単一定義。ルールが N 個のスキルに散らばり一つを漏らす事故を構造的に排除 |
| 3 | **フリクションループ** | スキル実行中の摩擦と喜びを一行で記録 → 週次レトロが集約して改善の入力に。「摩擦を記録すること自体に摩擦があってはならない」 |
| 4 | **コンテキスト衛生** | 学習の蓄積は notability ゲート（次のサイクルに役立つ？/コードから得られない？/再利用できる？）を通過したものだけ、`[run:RUN_ID]` 引用形式で。ノイズが brain を濁さないように |
| 5 | **manifest 整合性** | [`scripts/skill-manifest.py`](scripts/skill-manifest.py) が frontmatter↔ディレクトリ↔RESOLVER↔CLAUDE.md のバージョンを機械検査。散文ではなくガードがドリフトを防ぐ（導入直後に実際のバグを 3 件検出） |
| 6 | **スコア修復ループ** | `/docs-organize remediate` が目標スコアまで修復プラン→承認→段階実行・再測定。自動で到達不能なスコアは天井で止めて委譲 |

> 全工程で**ヒューマンゲート**は不変です——PR マージ・本番デプロイの承認は常に人が行います。*build the loop, stay the engineer.*

---

## はじめに

```bash
claude plugin install s0613/S-skills
```

```bash
# ローカル開発
git clone https://github.com/s0613/S-skills.git ~/S-skills
ln -sf ~/S-skills/skills/harness ~/.claude/skills/s-skills
```

インストール後、どのプロジェクトでも：

```
/sj-company <欲しいものを言葉で>
```

---

## 主なコマンド

| コマンド | 説明 |
|----------|------|
| `/sj-company <タスク>` | **すべての起点**——タスクを説明すれば適切な専門家へ自動ルーティング |
| `/spec` | 曖昧な意図 → 5 段階の実行可能な精密仕様 |
| `/design` | リファレンスブランド DNA ベースの UI 設計——ダイナミック/抑制/バランスの 3 つの HTML 案をブラウザで確認後、方向を選択 |
| `/design-shotgun` | 4〜6 個の方向を並列探索して選択 |
| `/investigate` | 仮説を立てる → 検証を強制、推測による修正を禁止 |
| `/cso` | OWASP + STRIDE セキュリティ監査 |
| `/ship` | テスト → カバレッジ → PR 自動化 |
| `/retro` | コミット・テスト・プロセス摩擦（friction）・成長指標の週次レトロ |
| `/sj-agent-dev` | 10 軸ベースのビジネスエージェント設計 |
| `/sj-loop` | ループプロンプト生成 + ドライラン/セッション内反復/クラウドスケジュール実行 |
| `/outsource` | 行き詰まったら専門家に委譲——コンテキストレポート + メール下書きを自動作成 |

---

## 構造

```
scripts/
└── skill-manifest.py ← SKILL.md ↔ manifest ↔ RESOLVER ↔ CLAUDE.md の整合性検査 (--check/--write)
skills/
├── manifest.json     ← スキルインベントリ（frontmatter から派生、手編集禁止）
├── RESOLVER.md       ← ルーティングの単一の真実（トリガー → スキルディスパッチテーブル）
├── _conventions/     ← 横断ルールの単一定義（ヒューマンゲート・PII・archive-only・Judge 独立性・RUN_ID・friction・context-curation）
├── sj-company/       ← すべてのスキルの入口（Step 0 が RESOLVER.md を読んでディスパッチ）
├── sj-pm/            ← 要件分析
├── sj-design/        ← UI 設計 + デザインレビュー
├── sj-seed/          ← カラット SEED デザインシステム（トークンと公式コンポーネントのみ）
├── sj-tech-lead/     ← サブエージェントオーケストレーション
├── sj-qa/            ← 独立検証
├── sj-spec/          ← 精密仕様
├── sj-investigate/   ← ルートコーズデバッグ
├── sj-cso/           ← セキュリティ監査
├── sj-ship/          ← リリース自動化
├── sj-automation/    ← PC システム自動化 + 画面 UI 自動化（`/sj-ui-auto` はトリガーエイリアス）
├── sj-marketing/     ← SNS・ブログマーケティング
├── sj-seo/           ← 検索インデックス自動化
├── sj-agent-dev/     ← エージェント設計
├── sj-agent-review/  ← エージェントレビュー
├── sj-loop/          ← ループエンジニアリング
└── sj-outsource/     ← 専門家委譲
```

---

<p align="center">
  行き詰まったら <code>/outsource</code> ——専門家が引き継ぎます。
</p>

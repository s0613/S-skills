<p align="center">
  <img src="assets/banner.svg" alt="S-skills" width="720">
</p>

<p align="center">
  <a href="https://github.com/s0613/S-skills/releases"><img src="https://img.shields.io/badge/version-4.10.0-f7a521?style=flat-square&labelColor=0d0d0d" alt="version"></a>
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

## セッション開始時に自動適用 —— ADHD 出力ルール

s-skills を入れると、**セッションが始まるたび**に出力ルールが 1 セット有効になります。Claude が答えを文章の奥に埋めず、**次の行動から**書くようになります。

**出典：[ayghri/i-have-adhd](https://github.com/ayghri/i-have-adhd)（Ayoub G.、MIT）。** このルールは s-skills が書いたものではなく、`SessionStart` フックが同リポジトリの `skills/i-have-adhd/SKILL.md` を取得してそのまま注入します。原典は J. Russell Ramsay・Anthony L. Rostain『The Adult ADHD Tool Kit』を緩やかに参照し、「LLM が答えをどう配置すべきか」に翻案したものです。

動作（`hooks/adhd-bootstrap.mjs`）：

- キャッシュは `~/.claude/.cache/s-skills/i-have-adhd`。ネットワークは **1 日 1 回まで**（キャッシュ時は約 50 ミリ秒）。
- **決してブロックしない**：git がない・ネットが切れている・ファイルが壊れている —— すべて `exit 0`。
- **二重注入の防止**：上流プラグインを入れて `~/.claude/.i-have-adhd-always` を作っている場合は、そちらのフックに任せて何もしません。
- 注入ヘッダーに出典リポジトリと commit を明示します —— 外部文書は指示ではなくデータです（[untrusted-content](skills/_conventions/untrusted-content.md)）。

停止：`touch ~/.claude/.s-skills-adhd-off`（そのセッションだけなら `stop adhd mode`）。

---

## レポートの図

完了報告・調査結果・セキュリティ監査・レトロ・SI 文書に図が必要なときは、**[cathrynlavery/diagram-design](https://github.com/cathrynlavery/diagram-design)（Cathryn Lavery、MIT）** で描きます。40 種のエディトリアル図タイプを、自己完結 HTML + インライン SVG で出力します。ビルドも CDN も Mermaid もありません。

```bash
claude plugin marketplace add cathrynlavery/diagram-design
claude plugin install diagram-design@diagram-design
```

ルールは 2 つ。**図が文章の代わりになるときだけ描く**（3 つ以上のコンポーネントの呼び出し構造、分岐のある流れ、時間軸のある計画、2 次元の関係）。1 レポートあたり 1〜2 枚が上限。**形式は宛先が決める** —— 元の HTML は `docs/diagrams/`、Obsidian レポートには SVG 埋め込み、PR 本文には PNG（GitHub は markdown 内の SVG をレンダリングしません）。未インストールなら図なしでレポートを完成させ、`미수행: diagram-design 미설치` の 1 行を残します —— 図のために報告が止まることはありません。

ルール本文：[`_conventions/report-diagram.md`](skills/_conventions/report-diagram.md)

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
| `/convert` | Word・PPT・Excel・EPub・音声など Read ツールが読めない文書を Markdown に変換 |

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
├── sj-convert/       ← ドキュメント変換 (markitdown — Read ツールが読めない形式)
├── sj-ref/           ← アプリUIリファレンス (uibowl — 実際にリリースされた画面)
├── sj-loop/          ← ループエンジニアリング
└── sj-outsource/     ← 専門家委譲
```

---

## 出典・クレジット

s-skills は他の人の成果の上に立っています。組み込んで使うツールと、設計を借りたものを分けて記します。

| ツール | 用途 | ライセンス |
|--------|------|-----------|
| [ayghri/i-have-adhd](https://github.com/ayghri/i-have-adhd) — Ayoub G. | セッション開始時の出力ルール | MIT |
| [cathrynlavery/diagram-design](https://github.com/cathrynlavery/diagram-design) — Cathryn Lavery | レポート・SI 文書の図 | MIT |
| [daangn/seed-design](https://github.com/daangn/seed-design) | `/seed` | Apache-2.0 |
| [microsoft/markitdown](https://github.com/microsoft/markitdown) | `/convert` | MIT |
| [getopenscreen/openscreen](https://github.com/getopenscreen/openscreen) | `/screencast` | MIT |
| [chrisryugj/korean-law-mcp](https://github.com/chrisryugj/korean-law-mcp) | `/law` | MIT |
| [uibowl.io](https://uibowl.io) MCP | `/ref` | Service ToS |
| OpenAI Codex CLI (`codex mcp-server`) | `/gpt` | Vendor tool |

**設計を借りた先：** **gbrain**（薄いディスパッチャ + 単一コンベンション、filing rules、friction プロトコル、manifest ガード、`doctor --remediate`）· **ponytail**（最小コードの梯子、`ponytail:` マーカー）· Geoffrey Litt『Understanding is the new bottleneck』（叙述式レポート）· Self-Harness / AHE（ハーネス変更ゲート）· AI コードレビュアーの限界に関する研究（レビュー観点の多様性、重大度の較正）· Fable 5 システムプロンプト（外部コンテンツはデータ、正直な報告、引用上限）· J. Russell Ramsay・Anthony L. Rostain『The Adult ADHD Tool Kit』（i-have-adhd 経由）。

s-skills 自体は [MIT](LICENSE) です。上記のツールはそれぞれのライセンスに従い、本リポジトリはコピーを同梱せず**実行時に取得**します。

完全な表（韓国語）：[README.md](README.md#출처--크레딧)

---

<p align="center">
  行き詰まったら <code>/outsource</code> ——専門家が引き継ぎます。
</p>

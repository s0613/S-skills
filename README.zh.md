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
  <strong>🇨🇳 中文</strong>
  &nbsp;·&nbsp;
  <a href="README.ja.md">🇯🇵 日本語</a>
</p>

<br>

<p align="center">
  <strong>一个人，也能像一家公司。</strong>
</p>

<p align="center">
  PM、设计师、开发者、QA、安全专家<br>
  在 Claude Code 中像团队一样协作。
</p>

<br>

---

## 它能做什么

S-skills 是一个**基于角色的 AI 开发编排器**。

从需求分析到设计、实现、评审、发布——用一句话描述任务，所需的专家就会被自动调度。他们像真人一样协作，只把结果交还给你。

```
/sj-company 帮我做一个登录功能
```

```
[Medium] "帮我做一个登录功能"
所需角色：database、backend、security、frontend
调度顺序：1) database  2) backend + security 并行  3) frontend
```

---

## 核心角色

| 角色 | 职责 |
|------|------|
| **PM** | 需求分析、风险评审、优先级定义 |
| **Design** | 基于参考 DNA 的 UI 设计、去除「AI 味」的检查 |
| **Tech Lead** | 并行调度专业子代理 + 整合结果 |
| **Frontend** | UI、组件、可访问性、响应式实现 |
| **Backend** | API、服务端、领域逻辑实现 |
| **Security** | OWASP Top 10 + STRIDE 实现 + 横切评审 |
| **QA** | 独立验证——不参考实现者产出，直接探查 |

---

## 有何不同

**专家级协作协议**

子代理无需经过 Tech Lead，直接在团队频道里协调。当 Database 发出「注意 nullable 列」时，Backend 直接读取并处理。

**会沉淀品味的设计系统**

被否决的方向会被封存，被认可的方向会被累积。随着时间推移，品牌识别度越来越清晰。

**保障 QA 独立性**

QA 从不阅读实现者写的摘要文档。它直接探查 PM 简报和实际文件，无偏见地进行验证。

---

## 框架设计——从 gbrain 借鉴的 6 点

我们将 [garrytan/gbrain](https://github.com/garrytan/gbrain) 经过验证的框架结构移植到了 S-skills。这是让框架在技能增多时也不崩塌的骨架。

| # | 原则 | 它做什么 |
|---|------|----------|
| 1 | **两层路由** | 触发器→技能的路由汇集于一处 [`RESOLVER.md`](skills/RESOLVER.md)。sj-company 成为一个轻薄的分发器（866→542 行），厚重的正文按需加载 |
| 2 | **横切约定统一** | 人工闸门、PII、archive-only、Judge 独立性、RUN_ID、friction、context-curation 在 [`_conventions/`](skills/_conventions) 中单一定义。从结构上消除规则散落在 N 个技能、漏掉其一的事故 |
| 3 | **摩擦循环** | 在技能运行中用一行记录摩擦与喜悦 → 每周回顾汇总后作为改进输入。「记录摩擦这件事本身必须没有摩擦」 |
| 4 | **上下文卫生** | 学习只累积通过 notability 闸门（对下个周期有用？/无法从代码获取？/可复用？）的内容，采用 `[run:RUN_ID]` 引用格式。让噪声不污染 brain |
| 5 | **manifest 一致性** | [`scripts/skill-manifest.py`](scripts/skill-manifest.py) 机器校验 frontmatter↔目录↔RESOLVER↔CLAUDE.md 版本。是守卫而非散文在阻止漂移（上线即查出 3 个真实 bug） |
| 6 | **评分修复循环** | `/docs-organize remediate` 运行修复计划直到目标分数 → 审批 → 分阶段执行并重新测量。无法自动达成的分数会停在天花板并委派 |

> 全程中**人工闸门**不变——PR 合并与生产环境部署的批准始终由人完成。*build the loop, stay the engineer.*

---

## 开始使用

```bash
claude plugin install s0613/S-skills
```

```bash
# 本地开发
git clone https://github.com/s0613/S-skills.git ~/S-skills
ln -sf ~/S-skills/skills/harness ~/.claude/skills/s-skills
```

安装后，在任意项目中：

```
/sj-company <用一句话说出你想要的>
```

---

## 主要命令

| 命令 | 说明 |
|------|------|
| `/sj-company <任务>` | **一切的起点**——描述任务，自动路由到合适的专家 |
| `/spec` | 模糊意图 → 5 阶段可执行的精确规格 |
| `/design` | 基于参考品牌 DNA 的 UI 设计——在浏览器中确认 3 个 HTML 草稿（动感/克制/平衡）后再选定方向 |
| `/design-shotgun` | 并行探索 4–6 个方向后选择 |
| `/investigate` | 先立假设 → 强制验证，禁止臆测性修改 |
| `/cso` | OWASP + STRIDE 安全审计 |
| `/ship` | 测试 → 覆盖率 → PR 自动化 |
| `/retro` | 对提交、测试、流程摩擦（friction）、成长指标的每周回顾 |
| `/sj-agent-dev` | 基于 10 轴的业务代理设计 |
| `/sj-loop` | 生成循环提示词 + 以 dry-run / 会话内重复 / 云端调度运行 |
| `/outsource` | 卡住时委派给专家——自动撰写上下文报告 + 邮件草稿 |

---

## 结构

```
scripts/
└── skill-manifest.py ← 校验 SKILL.md ↔ manifest ↔ RESOLVER ↔ CLAUDE.md 的一致性 (--check/--write)
skills/
├── manifest.json     ← 技能清单（从 frontmatter 派生，禁止手工编辑）
├── RESOLVER.md       ← 路由的单一事实来源（触发器 → 技能分发表）
├── _conventions/     ← 横切规则的单一定义（人工闸门、PII、archive-only、Judge 独立性、RUN_ID、friction、context-curation）
├── sj-company/       ← 所有技能的入口（Step 0 读取 RESOLVER.md 并分发）
├── sj-pm/            ← 需求分析
├── sj-design/        ← UI 设计 + 设计评审
├── sj-seed/          ← Karrot SEED 设计系统（仅用 token 与官方组件）
├── sj-tech-lead/     ← 子代理编排
├── sj-qa/            ← 独立验证
├── sj-spec/          ← 精确规格
├── sj-investigate/   ← 根因调试
├── sj-cso/           ← 安全审计
├── sj-ship/          ← 发布自动化
├── sj-automation/    ← PC 系统自动化 + 屏幕 UI 自动化（`/sj-ui-auto` 为触发别名）
├── sj-marketing/     ← SNS 与博客营销
├── sj-seo/           ← 搜索索引自动化
├── sj-agent-dev/     ← 代理设计
├── sj-agent-review/  ← 代理评审
├── sj-loop/          ← 循环工程
└── sj-outsource/     ← 专家委派
```

---

<p align="center">
  卡住了？<code>/outsource</code>——专家来接手。
</p>

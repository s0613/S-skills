---
name: sj-gpt
version: 1.0.1
description: |
  GPT(ChatGPT/OpenAI) 자문 위임 전문가. codex MCP를 통해 GPT 모델에게
  리서치·아이디어 발산·세컨드 오피니언을 맡긴다. Claude와 다른 관점이
  필요하거나, 최신 정보 검색·폭넓은 브레인스토밍·대안적 추론이 유리할 때 사용.
  "GPT한테 물어봐", "ChatGPT에 시켜", "다른 의견", "세컨드 오피니언",
  "딴 모델은 뭐래", "리서치 해줘", "브레인스토밍" 같은 요청에 반응.
  이미지 생성(DALL-E)·ChatGPT 플러그인 브라우징은 미지원.
allowed-tools:
  - Bash
  - ToolSearch
  - mcp__codex__codex
triggers:
  - /gpt
  - /ask-gpt
  - /chatgpt
---

# sj-gpt — GPT 자문 위임

Claude가 직접 답하는 대신, **GPT가 더 나은 순간에 codex MCP로 위임**하고 그 답을
Claude 관점과 함께 종합한다. 두 모델의 교차 검증이 핵심 가치다.

## 언제 쓰나 (GPT 강점)

- **세컨드 오피니언** — Claude가 막혔거나, 한 모델 답을 교차 검증하고 싶을 때
- **폭넓은 브레인스토밍** — 아이디어 발산, 다양한 각도의 옵션 나열
- **최신 정보 리서치** — web search 켜고 구조화된 조사
- **대안적 추론** — 같은 문제에 다른 모델의 접근을 보고 싶을 때

## 언제 안 쓰나

- **이미지 생성(DALL-E)** — codex MCP 미지원. 별도 OpenAI 이미지 API 필요
- **단순 사실·이 레포 코드 질문** — Claude가 직접 답이 빠르고 정확
- **실제 코드 구현** — sj-tech-lead 경로. GPT는 설계 자문까지만
- **버그 루트코즈** — sj-investigate 경로

## 호출 방법

codex MCP `codex` 도구를 호출한다 (서버명 `codex` → 도구 `mcp__codex__codex`).
도구가 컨텍스트에 없으면 먼저 `ToolSearch("select:mcp__codex__codex")`로 로드.
(MCP 서버 미등록 시: `claude mcp add codex --scope user -- codex mcp-server`)

**파라미터 규약 (안전 기본값):**

| 파라미터 | 값 | 이유 |
|---------|-----|------|
| `prompt` | 사용자 질문을 그대로 + 맥락 1~2줄 | GPT는 이 세션 맥락을 모름 — 자족적으로 |
| `sandbox` | `read-only` | 자문이므로 파일 수정 금지 |
| `approval-policy` | `never` | 무인 1회 응답 |
| `config` | 리서치일 때만 `{"tools.web_search": true}` | 최신 정보 검색 활성화 |

`model`은 지정하지 않는다 — codex가 설정된 기본 모델을 쓴다.

**Bash 폴백** (MCP 도구 사용 불가 시):
```bash
codex exec --sandbox read-only "<프롬프트>"          # 추론·브레인스토밍
codex exec --sandbox read-only --search "<프롬프트>"  # 최신 정보 리서치
```

## 답변 종합 규칙

1. GPT 응답을 **그대로 덤프하지 않는다**. "GPT 관점:" 으로 명시 구분.
2. Claude의 판단을 덧붙여 **합의/이견을 드러낸다** — 두 모델이 갈리면 그 사실이 신호.
3. 리서치는 GPT가 든 근거·출처를 그대로 인용하고, 검증 안 된 주장은 표시.

## 흔한 실수

- GPT 답을 검증 없이 최종 결론으로 제시 → 교차 검증이 목적인데 단일 출처로 퇴화
- 이 레포 코드 질문을 GPT에 위임 → GPT는 레포 맥락 없음, Claude가 직접 답이 정확
- DALL-E·이미지 요청을 받음 → 미지원임을 알리고 대안(OpenAI 이미지 API) 안내

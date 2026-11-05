---
name: sj-wait
version: 1.0.0
description: 잠깐, 방금 말이 안 들어왔다 — 맥락을 붙여 쉬운 말로 다시 설명하게 한다.
disable-model-invocation: true
triggers:
  - /잠깐
  - /뭐라고
  - /wait-what
# 차용: mattpocock/skills wait-what (MIT, @4ae2317). 일부러 짧다 — 길게 쓰면 모델이 그 길이를 따라간다.
# 핵심 단어는 "잠깐": 출력을 줄이라는 지시가 아니라 듣는 사람이 놓쳤다는 상태를 알려, 줄이면서 맥락을 더하게 한다.
---

잠깐, 지금 어디까지 왔는지 이해를 못 했어. 그 부분을 다시 설명해 줘: 내가 놓친 맥락을 조금 붙이고,
짧은 문장에 한 문장 한 생각으로, 프로젝트 `GLOSSARY.md`가 있으면 거기 용어로.

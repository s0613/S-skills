# 프롬프트 뼈대

대괄호는 채우는 자리. 선택 항목은 해당 없으면 통째로 뺀다 (빈 제목 남기지 않는다).

```
{N}.000 seconds.

CREATIVE MODE: {모드 1~2개}. STRUCTURE: {Multi-shot | Continuous | Hybrid}, {광고 구조}. BRAND VOICE: {형용사 2~3개}.

VISUAL STYLE: {매체, 팔레트(색 이름+역할), 배경, 재질/질감, 조명, 대비, 타이포 성격, 선 굵기, 그래픽 밀도, 카메라 감각, 분위기}. Flat 2D / 2.5D layered parallax, no true 3D perspective.

TEXT FIDELITY: Treat every text string inside quotation marks as an immutable graphic asset. Render it exactly as provided, preserving every Hangul character, spacing, punctuation, capitalization, numeral, and English spelling. {Hangul 표현 원칙 2~3줄}

REFERENCE & IDENTITY: {레퍼런스는 identity reference일 뿐 화면에 삽입하지 않음. 고정할 특징 목록}

SHOT 1 — 0.000s–{t}s  ({역할: Hook})
{배경 / 구성 / 오브젝트 / 문구 "…" / 모션 / 카메라 / 조명 / 다음 전환}

SHOT 2 — …

SHOT N — {t}s–{N}.000s  (End Card)
{최종 구도}. From {t}s to exactly {N}.000s, hold the final composition steadily. No new elements appear.

voice_over: {선택. 언어·톤·속도·Say exactly: "…"}

overall_soundscape: {선택. 모션 동기 효과음}
non_diegetic_music: {선택. 장르·BPM·에너지 곡선·마무리}

CONSTRAINTS: Keep the composition minimal and intentional. Preserve all established product and brand identity. Add no unrelated text, logos, UI, characters, or decorative objects unless specified. {필요한 것만: pseudo-text, 과한 블러, 제품 변형, 카메라 흔들림}
```

Continuous 구조는 `SHOT n` 대신 `0.000s–2.000s` 같은 시간 구간 헤더를 쓰고, 카메라 위치·공간 방향·오브젝트 연속성을 구간 사이에서 끊지 않는다.

## 예시 (일부, 10초 키네틱 타이포)

```
10.000 seconds.

CREATIVE MODE: Kinetic Typography + Product Hero (flat). STRUCTURE: Multi-shot, Typography-led. BRAND VOICE: playful, confident.
VISUAL STYLE: Flat 2.5D paper-cut layers, saturated yellow background with cobalt-blue type and off-white product silhouette, crisp hard graphic shadows, subtle grain ...

SHOT 1 — 0.000s–2.000s (Hook)
Cobalt-blue oversized Hangul "오늘, 챙겼어?" slams in with a scale punch over the yellow field ...
```

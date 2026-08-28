// 범용 포맷터 — 도메인 규칙 없음
export const formatDate = (d: Date) => d.toISOString().slice(0, 10)

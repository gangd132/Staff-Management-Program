// 날짜 유틸리티

// 오늘 날짜를 "YYYY-MM-DD" 형식으로 반환
export function getTodayString(): string {
  return new Date().toISOString().slice(0, 10)
}

// 현재 연월을 "YYYY-MM" 형식으로 반환
export function getCurrentYearMonth(): string {
  return new Date().toISOString().slice(0, 7)
}

// "YYYY-MM-DD" → "YYYY년 MM월 DD일" 형식으로 변환
export function formatDateKorean(dateStr: string): string {
  const [year, month, day] = dateStr.split('-')
  return `${year}년 ${parseInt(month)}월 ${parseInt(day)}일`
}

// "YYYY-MM" → "YYYY년 MM월" 형식으로 변환
export function formatYearMonthKorean(yearMonth: string): string {
  const [year, month] = yearMonth.split('-')
  return `${year}년 ${parseInt(month)}월`
}

// 근무시간을 "X시간 Y분" 형식으로 변환
export function formatHours(hours: number): string {
  const h = Math.floor(hours)
  const m = Math.round((hours - h) * 60)
  if (m === 0) return `${h}시간`
  return `${h}시간 ${m}분`
}

// 금액을 "X,XXX원" 형식으로 변환
export function formatMoney(amount: number): string {
  return `${amount.toLocaleString('ko-KR')}원`
}

// "HH:MM" 형식의 시간 목록 생성 (30분 단위)
export function generateTimeOptions(): string[] {
  const times: string[] = []
  for (let h = 0; h < 24; h++) {
    for (const m of [0, 30]) {
      times.push(`${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`)
    }
  }
  return times
}

// 직원 색상 팔레트
export const EMPLOYEE_COLORS = [
  { label: '빨간색', value: '#ef4444' },
  { label: '주황색', value: '#f97316' },
  { label: '노란색', value: '#eab308' },
  { label: '초록색', value: '#22c55e' },
  { label: '청록색', value: '#14b8a6' },
  { label: '파란색', value: '#3b82f6' },
  { label: '남색', value: '#6366f1' },
  { label: '보라색', value: '#a855f7' },
  { label: '분홍색', value: '#ec4899' }
]

// 색상 hex → Tailwind 호환 인라인 스타일
export function getColorStyle(color: string | null) {
  return color ? { backgroundColor: color } : { backgroundColor: '#6366f1' }
}

// yearMonth("YYYY-MM")에서 주차별 날짜 범위 반환 (7일씩 구분)
export function getWeekRanges(
  yearMonth: string
): { weekNumber: number; startDay: number; endDay: number }[] {
  const [year, month] = yearMonth.split('-').map(Number)
  const lastDay = new Date(year, month, 0).getDate()
  const ranges: { weekNumber: number; startDay: number; endDay: number }[] = []
  let day = 1
  let week = 1
  while (day <= lastDay) {
    ranges.push({ weekNumber: week, startDay: day, endDay: Math.min(day + 6, lastDay) })
    day += 7
    week++
  }
  return ranges
}

// yearMonth에서 이전/다음 달 계산
export function prevMonth(yearMonth: string): string {
  const [y, m] = yearMonth.split('-').map(Number)
  const date = new Date(y, m - 2, 1)
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
}

export function nextMonth(yearMonth: string): string {
  const [y, m] = yearMonth.split('-').map(Number)
  const date = new Date(y, m, 1)
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
}

// 클래스명 조합 헬퍼
export function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(' ')
}

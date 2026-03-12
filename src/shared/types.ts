// 메인 프로세스와 렌더러 프로세스 간 공유 타입 정의

export interface AppConfig {
  id: number
  bizName: string
  pin: string | null
  createdAt: string
}

export interface Employee {
  id: string
  name: string
  defaultStart: string | null  // "HH:MM" 형식
  color: string | null         // hex 색상 코드
  hourlyWage: number | null
  restDayHours: number | null  // 주휴수당 기준 주간 근무시간
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export interface Attendance {
  id: string
  employeeId: string
  workDate: string    // "YYYY-MM-DD" 형식
  startTime: string   // "HH:MM" 형식
  endTime: string     // "HH:MM" 형식
  hoursWorked: number // 휴게시간 공제 후 실 근무시간
  createdAt: string
  updatedAt: string
  employee?: Employee
}

export interface WeeklyStatRow {
  employee: Employee
  weeks: {
    weekNumber: number        // 1 ~ 5
    totalHours: number
    qualifiesForRestDayPay: boolean  // 주휴수당 발생 여부
    restDayPay: number
  }[]
  monthlyTotal: number
}

export interface MonthlyStatRow {
  employee: Employee
  totalHours: number
  basePay: number       // 기본급 (시급 × 근무시간)
  restDayPay: number    // 주휴수당 합계
  totalPay: number      // 예상 월급
}

// IPC 응답 공통 포맷
export interface IPCResult<T = unknown> {
  success: boolean
  data?: T
  error?: string
}

// 달력용 이벤트 타입
export interface CalendarEvent {
  id: string
  title: string
  start: string
  end: string
  backgroundColor: string
  borderColor: string
  extendedProps: {
    attendance: Attendance
    employee: Employee
  }
}

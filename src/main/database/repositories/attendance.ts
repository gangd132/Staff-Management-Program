import { getDb } from '../index'
import type { Attendance } from '../../../shared/types'
import { employeeRepository } from './employee'
import { configRepository } from './config'
import { randomUUID } from 'crypto'

// 근무시간 계산 + 휴게시간 자동 공제
export function calculateHoursWorked(
  startTime: string,
  endTime: string,
  breakDeductionEnabled = true
): number {
  const [startH, startM] = startTime.split(':').map(Number)
  const [endH, endM] = endTime.split(':').map(Number)

  let startMinutes = startH * 60 + startM
  let endMinutes = endH * 60 + endM

  // 자정 넘김 야간 근무 처리 (퇴근이 출근보다 이른 경우)
  if (endMinutes <= startMinutes) {
    endMinutes += 24 * 60
  }

  const totalHours = (endMinutes - startMinutes) / 60

  // 휴게시간 자동 공제 (설정에서 off 가능)
  let restHours = 0
  if (breakDeductionEnabled) {
    if (totalHours >= 8) {
      restHours = 1
    } else if (totalHours >= 4) {
      restHours = 0.5
    }
  }

  return Math.max(0, totalHours - restHours)
}

// DB 행 → Attendance 변환
function rowToAttendance(
  row: Record<string, unknown>,
  includeEmployee = false
): Attendance {
  const attendance: Attendance = {
    id: row.id as string,
    employeeId: row.employee_id as string,
    workDate: row.work_date as string,
    startTime: row.start_time as string,
    endTime: row.end_time as string,
    hoursWorked: row.hours_worked as number,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string
  }

  if (includeEmployee) {
    const employee = employeeRepository.findById(attendance.employeeId)
    if (employee) attendance.employee = employee
  }

  return attendance
}

export const attendanceRepository = {
  // 달력/목록용 근무기록 조회 (월별)
  findByMonth(yearMonth: string): Attendance[] {
    // yearMonth: "YYYY-MM"
    const db = getDb()
    const rows = db
      .prepare(
        `SELECT * FROM attendances
         WHERE work_date LIKE ?
         ORDER BY work_date ASC, start_time ASC`
      )
      .all(`${yearMonth}%`) as Record<string, unknown>[]
    return rows.map((row) => rowToAttendance(row, true))
  },

  // 특정 날짜의 근무기록 조회
  findByDate(workDate: string): Attendance[] {
    const db = getDb()
    const rows = db
      .prepare(
        `SELECT * FROM attendances WHERE work_date = ? ORDER BY start_time ASC`
      )
      .all(workDate) as Record<string, unknown>[]
    return rows.map((row) => rowToAttendance(row, true))
  },

  // 직원별 월간 근무기록
  findByEmployeeAndMonth(employeeId: string, yearMonth: string): Attendance[] {
    const db = getDb()
    const rows = db
      .prepare(
        `SELECT * FROM attendances
         WHERE employee_id = ? AND work_date LIKE ?
         ORDER BY work_date ASC`
      )
      .all(employeeId, `${yearMonth}%`) as Record<string, unknown>[]
    return rows.map((row) => rowToAttendance(row))
  },

  // 근무기록 저장/수정 (Upsert - 같은 직원+날짜면 업데이트)
  upsert(data: {
    employeeId: string
    workDate: string
    startTime: string
    endTime: string
  }): Attendance {
    const db = getDb()
    const now = new Date().toISOString()
    const appConfig = configRepository.get()
    const breakDeductionEnabled = appConfig?.breakDeductionEnabled ?? true
    const hoursWorked = calculateHoursWorked(
      data.startTime,
      data.endTime,
      breakDeductionEnabled
    )

    // 기존 레코드 확인
    const existing = db
      .prepare(
        'SELECT id FROM attendances WHERE employee_id = ? AND work_date = ?'
      )
      .get(data.employeeId, data.workDate) as { id: string } | undefined

    if (existing) {
      db.prepare(
        `UPDATE attendances SET
          start_time   = ?,
          end_time     = ?,
          hours_worked = ?,
          updated_at   = ?
         WHERE id = ?`
      ).run(data.startTime, data.endTime, hoursWorked, now, existing.id)

      return this.findById(existing.id)!
    } else {
      const id = randomUUID()
      db.prepare(
        `INSERT INTO attendances
          (id, employee_id, work_date, start_time, end_time, hours_worked, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
      ).run(
        id,
        data.employeeId,
        data.workDate,
        data.startTime,
        data.endTime,
        hoursWorked,
        now,
        now
      )
      return this.findById(id)!
    }
  },

  // ID로 근무기록 조회
  findById(id: string): Attendance | null {
    const db = getDb()
    const row = db
      .prepare('SELECT * FROM attendances WHERE id = ?')
      .get(id) as Record<string, unknown> | undefined
    if (!row) return null
    return rowToAttendance(row, true)
  },

  // 근무기록 삭제
  delete(id: string): boolean {
    const db = getDb()
    const result = db.prepare('DELETE FROM attendances WHERE id = ?').run(id)
    return result.changes > 0
  }
}

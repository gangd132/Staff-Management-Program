import { getDb } from '../index'
import type { Employee } from '../../../shared/types'
import { randomUUID } from 'crypto'

// DB 행 → Employee 변환
function rowToEmployee(row: Record<string, unknown>): Employee {
  return {
    id: row.id as string,
    name: row.name as string,
    defaultStart: (row.default_start as string | null) ?? null,
    color: (row.color as string | null) ?? null,
    hourlyWage: (row.hourly_wage as number | null) ?? null,
    restDayHours: (row.rest_day_hours as number | null) ?? null,
    isActive: Boolean(row.is_active),
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string
  }
}

export const employeeRepository = {
  // 직원 전체 목록 (활성 여부 필터 선택)
  findAll(onlyActive = false): Employee[] {
    const db = getDb()
    const query = onlyActive
      ? 'SELECT * FROM employees WHERE is_active = 1 ORDER BY name ASC'
      : 'SELECT * FROM employees ORDER BY is_active DESC, name ASC'
    const rows = db.prepare(query).all() as Record<string, unknown>[]
    return rows.map(rowToEmployee)
  },

  // ID로 직원 조회
  findById(id: string): Employee | null {
    const db = getDb()
    const row = db.prepare('SELECT * FROM employees WHERE id = ?').get(id) as
      | Record<string, unknown>
      | undefined
    if (!row) return null
    return rowToEmployee(row)
  },

  // 직원 추가
  create(data: {
    name: string
    defaultStart?: string | null
    color?: string | null
    hourlyWage?: number | null
    restDayHours?: number | null
  }): Employee {
    const db = getDb()
    const now = new Date().toISOString()
    const id = randomUUID()

    db.prepare(
      `INSERT INTO employees
        (id, name, default_start, color, hourly_wage, rest_day_hours, is_active, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, 1, ?, ?)`
    ).run(
      id,
      data.name,
      data.defaultStart ?? null,
      data.color ?? null,
      data.hourlyWage ?? null,
      data.restDayHours ?? null,
      now,
      now
    )

    return this.findById(id)!
  },

  // 직원 정보 수정
  update(
    id: string,
    data: Partial<{
      name: string
      defaultStart: string | null
      color: string | null
      hourlyWage: number | null
      restDayHours: number | null
      isActive: boolean
    }>
  ): Employee | null {
    const db = getDb()
    const current = this.findById(id)
    if (!current) return null

    const now = new Date().toISOString()
    db.prepare(
      `UPDATE employees SET
        name           = ?,
        default_start  = ?,
        color          = ?,
        hourly_wage    = ?,
        rest_day_hours = ?,
        is_active      = ?,
        updated_at     = ?
       WHERE id = ?`
    ).run(
      data.name ?? current.name,
      data.defaultStart !== undefined ? data.defaultStart : current.defaultStart,
      data.color !== undefined ? data.color : current.color,
      data.hourlyWage !== undefined ? data.hourlyWage : current.hourlyWage,
      data.restDayHours !== undefined ? data.restDayHours : current.restDayHours,
      data.isActive !== undefined ? (data.isActive ? 1 : 0) : current.isActive ? 1 : 0,
      now,
      id
    )

    return this.findById(id)!
  },

  // 직원 삭제 (CASCADE로 근무기록도 삭제됨)
  delete(id: string): boolean {
    const db = getDb()
    const result = db.prepare('DELETE FROM employees WHERE id = ?').run(id)
    return result.changes > 0
  }
}

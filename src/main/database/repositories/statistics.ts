import { getDb } from '../index'
import type { WeeklyStatRow, MonthlyStatRow } from '../../../shared/types'
import { employeeRepository } from './employee'

// yearMonth("YYYY-MM")에서 주차별 날짜 범위 계산 (7일씩 구분)
function getWeekRanges(yearMonth: string): { start: string; end: string }[] {
  const [year, month] = yearMonth.split('-').map(Number)
  const firstDay = new Date(year, month - 1, 1)
  const lastDay = new Date(year, month, 0)
  const totalDays = lastDay.getDate()

  const weeks: { start: string; end: string }[] = []
  let day = 1
  while (day <= totalDays) {
    const endDay = Math.min(day + 6, totalDays)
    const startStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
    const endStr = `${year}-${String(month).padStart(2, '0')}-${String(endDay).padStart(2, '0')}`
    weeks.push({ start: startStr, end: endStr })
    day += 7
  }
  return weeks
}

export const statisticsRepository = {
  // 월별 주차별 집계
  getWeeklyStats(yearMonth: string): WeeklyStatRow[] {
    const db = getDb()
    const employees = employeeRepository.findAll()
    const weekRanges = getWeekRanges(yearMonth)

    return employees.map((employee) => {
      const weeks = weekRanges.map((range, index) => {
        const rows = db
          .prepare(
            `SELECT SUM(hours_worked) as total
             FROM attendances
             WHERE employee_id = ? AND work_date >= ? AND work_date <= ?`
          )
          .get(employee.id, range.start, range.end) as { total: number | null }

        const totalHours = rows.total ?? 0
        // 주휴수당 발생 조건: 주간 근무시간 15시간 이상 (근로기준법 고정)
        const qualifiesForRestDayPay = totalHours >= 15

        // 주휴수당 = 시급 × 직원의 1일 소정 근로시간
        const dailyHours = employee.restDayHours ?? 8
        const restDayPay =
          qualifiesForRestDayPay && employee.hourlyWage
            ? employee.hourlyWage * dailyHours
            : 0

        return {
          weekNumber: index + 1,
          totalHours,
          qualifiesForRestDayPay,
          restDayPay
        }
      })

      const monthlyTotal = weeks.reduce((sum, w) => sum + w.totalHours, 0)

      return { employee, weeks, monthlyTotal }
    })
  },

  // 월별 직원별 급여 통계
  getMonthlyStats(yearMonth: string): MonthlyStatRow[] {
    const db = getDb()
    const employees = employeeRepository.findAll()
    const weekRanges = getWeekRanges(yearMonth)

    return employees.map((employee) => {
      // 월간 총 근무시간
      const totalRow = db
        .prepare(
          `SELECT SUM(hours_worked) as total
           FROM attendances
           WHERE employee_id = ? AND work_date LIKE ?`
        )
        .get(employee.id, `${yearMonth}%`) as { total: number | null }

      const totalHours = totalRow.total ?? 0
      const basePay = employee.hourlyWage ? Math.floor(totalHours * employee.hourlyWage) : 0

      // 주휴수당 합산: 주간 15시간 이상 근무한 주차마다 (시급 × 1일 소정 근로시간) 지급
      let totalRestDayPay = 0
      if (employee.hourlyWage) {
        const dailyHours = employee.restDayHours ?? 8
        for (const range of weekRanges) {
          const weekRow = db
            .prepare(
              `SELECT SUM(hours_worked) as total
               FROM attendances
               WHERE employee_id = ? AND work_date >= ? AND work_date <= ?`
            )
            .get(employee.id, range.start, range.end) as { total: number | null }

          const weekHours = weekRow.total ?? 0
          // 주간 15시간 이상이면 주휴수당 발생
          if (weekHours >= 15) {
            totalRestDayPay += employee.hourlyWage * dailyHours
          }
        }
      }

      return {
        employee,
        totalHours,
        basePay,
        restDayPay: totalRestDayPay,
        totalPay: basePay + totalRestDayPay
      }
    })
  }
}

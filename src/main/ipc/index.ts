import { ipcMain, dialog, app } from 'electron'
import * as fs from 'fs'
import * as path from 'path'
import * as bcrypt from 'bcryptjs'
import * as XLSX from 'xlsx'
import { getDbFilePath } from '../database'
import { employeeRepository } from '../database/repositories/employee'
import { attendanceRepository, calculateHoursWorked } from '../database/repositories/attendance'
import { statisticsRepository } from '../database/repositories/statistics'
import { configRepository } from '../database/repositories/config'
import type { IPCResult } from '../../shared/types'

// IPC 응답 헬퍼
function ok<T>(data: T): IPCResult<T> {
  return { success: true, data }
}
function fail(error: string): IPCResult {
  return { success: false, error }
}

export function registerIpcHandlers(): void {
  // ─────────────────────────────────────────
  // 앱 설정
  // ─────────────────────────────────────────

  ipcMain.handle('config:get', () => {
    try {
      return ok(configRepository.get())
    } catch (e) {
      return fail(String(e))
    }
  })

  ipcMain.handle('config:create', (_event, bizName: string, pin: string | null) => {
    try {
      const hashedPin = pin ? bcrypt.hashSync(pin, 10) : null
      return ok(configRepository.create(bizName, hashedPin))
    } catch (e) {
      return fail(String(e))
    }
  })

  ipcMain.handle(
    'config:update',
    (_event, data: { bizName?: string; pin?: string | null }) => {
      try {
        let pinToSave: string | null | undefined = undefined

        if (data.pin !== undefined) {
          // null이면 PIN 제거, 문자열이면 해시화
          pinToSave = data.pin ? bcrypt.hashSync(data.pin, 10) : null
        }

        return ok(configRepository.update({ bizName: data.bizName, pin: pinToSave }))
      } catch (e) {
        return fail(String(e))
      }
    }
  )

  // PIN 검증 (잠금 해제)
  ipcMain.handle('config:verifyPin', (_event, enteredPin: string) => {
    try {
      const config = configRepository.get()
      if (!config?.pin) return ok(true)
      const isValid = bcrypt.compareSync(enteredPin, config.pin)
      return ok(isValid)
    } catch (e) {
      return fail(String(e))
    }
  })

  // ─────────────────────────────────────────
  // 직원 관리
  // ─────────────────────────────────────────

  ipcMain.handle('employee:list', (_event, onlyActive?: boolean) => {
    try {
      return ok(employeeRepository.findAll(onlyActive))
    } catch (e) {
      return fail(String(e))
    }
  })

  ipcMain.handle('employee:create', (_event, data) => {
    try {
      return ok(employeeRepository.create(data))
    } catch (e) {
      return fail(String(e))
    }
  })

  ipcMain.handle('employee:update', (_event, id: string, data) => {
    try {
      const result = employeeRepository.update(id, data)
      if (!result) return fail('직원을 찾을 수 없습니다.')
      return ok(result)
    } catch (e) {
      return fail(String(e))
    }
  })

  ipcMain.handle('employee:delete', (_event, id: string) => {
    try {
      const result = employeeRepository.delete(id)
      return ok(result)
    } catch (e) {
      return fail(String(e))
    }
  })

  // ─────────────────────────────────────────
  // 근무 기록
  // ─────────────────────────────────────────

  ipcMain.handle('attendance:list', (_event, yearMonth: string) => {
    try {
      return ok(attendanceRepository.findByMonth(yearMonth))
    } catch (e) {
      return fail(String(e))
    }
  })

  ipcMain.handle('attendance:listByDate', (_event, workDate: string) => {
    try {
      return ok(attendanceRepository.findByDate(workDate))
    } catch (e) {
      return fail(String(e))
    }
  })

  ipcMain.handle('attendance:upsert', (_event, data) => {
    try {
      return ok(attendanceRepository.upsert(data))
    } catch (e) {
      return fail(String(e))
    }
  })

  ipcMain.handle('attendance:delete', (_event, id: string) => {
    try {
      return ok(attendanceRepository.delete(id))
    } catch (e) {
      return fail(String(e))
    }
  })

  // 근무시간 미리보기 계산
  ipcMain.handle(
    'attendance:calcHours',
    (_event, startTime: string, endTime: string) => {
      try {
        return ok(calculateHoursWorked(startTime, endTime))
      } catch (e) {
        return fail(String(e))
      }
    }
  )

  // ─────────────────────────────────────────
  // 통계
  // ─────────────────────────────────────────

  ipcMain.handle('statistics:weekly', (_event, yearMonth: string) => {
    try {
      return ok(statisticsRepository.getWeeklyStats(yearMonth))
    } catch (e) {
      return fail(String(e))
    }
  })

  ipcMain.handle('statistics:monthly', (_event, yearMonth: string) => {
    try {
      return ok(statisticsRepository.getMonthlyStats(yearMonth))
    } catch (e) {
      return fail(String(e))
    }
  })

  // ─────────────────────────────────────────
  // 백업 & 복원
  // ─────────────────────────────────────────

  ipcMain.handle('backup:export', async () => {
    try {
      const { canceled, filePath } = await dialog.showSaveDialog({
        title: 'DB 백업 저장',
        defaultPath: `staff-backup-${new Date().toISOString().slice(0, 10)}.sqlite`,
        filters: [{ name: 'SQLite DB', extensions: ['sqlite'] }]
      })

      if (canceled || !filePath) return ok(null)

      fs.copyFileSync(getDbFilePath(), filePath)
      return ok(filePath)
    } catch (e) {
      return fail(String(e))
    }
  })

  ipcMain.handle('backup:import', async () => {
    try {
      const { canceled, filePaths } = await dialog.showOpenDialog({
        title: '백업 파일 선택',
        filters: [{ name: 'SQLite DB', extensions: ['sqlite'] }],
        properties: ['openFile']
      })

      if (canceled || filePaths.length === 0) return ok(null)

      const sourcePath = filePaths[0]
      const destPath = getDbFilePath()
      fs.copyFileSync(sourcePath, destPath)

      return ok(sourcePath)
    } catch (e) {
      return fail(String(e))
    }
  })

  // ─────────────────────────────────────────
  // Excel 내보내기
  // ─────────────────────────────────────────

  ipcMain.handle('export:excel', async (_event, yearMonth: string) => {
    try {
      const stats = statisticsRepository.getMonthlyStats(yearMonth)
      const weeklyStats = statisticsRepository.getWeeklyStats(yearMonth)

      const workbook = XLSX.utils.book_new()

      // 월별 급여 시트
      const monthlyData = stats.map((row) => ({
        직원명: row.employee.name,
        '총 근무시간': row.totalHours.toFixed(1),
        '시급(원)': row.employee.hourlyWage ?? '-',
        '기본급(원)': row.basePay.toLocaleString(),
        '주휴수당(원)': row.restDayPay.toLocaleString(),
        '예상 월급(원)': row.totalPay.toLocaleString()
      }))
      const monthlySheet = XLSX.utils.json_to_sheet(monthlyData)
      XLSX.utils.book_append_sheet(workbook, monthlySheet, '월별 급여')

      // 주차별 집계 시트
      const weeklyRows = weeklyStats.flatMap((row) =>
        row.weeks.map((week) => ({
          직원명: row.employee.name,
          주차: `${week.weekNumber}주차`,
          '근무시간': week.totalHours.toFixed(1),
          '주휴수당 발생': week.qualifiesForRestDayPay ? 'O' : '-',
          '주휴수당(원)': week.restDayPay.toLocaleString()
        }))
      )
      const weeklySheet = XLSX.utils.json_to_sheet(weeklyRows)
      XLSX.utils.book_append_sheet(workbook, weeklySheet, '주차별 집계')

      const { canceled, filePath } = await dialog.showSaveDialog({
        title: 'Excel 저장',
        defaultPath: `급여내역-${yearMonth}.xlsx`,
        filters: [{ name: 'Excel', extensions: ['xlsx'] }]
      })

      if (canceled || !filePath) return ok(null)

      XLSX.writeFile(workbook, filePath)
      return ok(filePath)
    } catch (e) {
      return fail(String(e))
    }
  })

  // 앱 버전 조회
  ipcMain.handle('app:version', () => ok(app.getVersion()))
}

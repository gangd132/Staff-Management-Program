import { useState, useEffect, useCallback } from 'react'
import { ChevronLeft, ChevronRight, Trash2, Save, CheckCircle2 } from 'lucide-react'
import type { Employee, Attendance as AttendanceType } from '../../../shared/types'
import { useApp } from '../App'
import { getTodayString, generateTimeOptions, formatHours } from '../lib/utils'

export default function Attendance() {
  const { pageParams } = useApp()

  // pageParams로 날짜 초기값 설정
  const [selectedDate, setSelectedDate] = useState(
    pageParams.date || getTodayString()
  )
  const [employees, setEmployees] = useState<Employee[]>([])
  const [attendances, setAttendances] = useState<AttendanceType[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [breakDeductionEnabled, setBreakDeductionEnabled] = useState(true)

  // 저장 폼 상태 (직원별) — 항상 모든 직원의 폼이 존재해야 버그 방지
  const [forms, setForms] = useState<
    Record<string, { startTime: string; endTime: string; hours: number }>
  >({})
  const [savingId, setSavingId] = useState<string | null>(null)
  // 저장 완료 표시 (2초간 체크 아이콘 노출)
  const [savedId, setSavedId] = useState<string | null>(null)

  const TIME_OPTIONS = generateTimeOptions()

  // 직원 목록 + 날짜별 근무기록 함께 로드하여 폼 초기화
  const loadAll = useCallback(async (date: string) => {
    setIsLoading(true)
    try {
      const [empResult, attResult, configResult] = await Promise.all([
        window.api.employee.list(true),
        window.api.attendance.listByDate(date),
        window.api.config.get()
      ])

      const emps = empResult.success ? (empResult.data ?? []) : employees
      const atts = attResult.success ? (attResult.data ?? []) : []

      if (empResult.success) setEmployees(emps)
      setAttendances(atts)
      if (configResult.success && configResult.data) {
        setBreakDeductionEnabled(configResult.data.breakDeductionEnabled)
      }

      // 모든 직원의 폼을 직원별 defaultStart로 초기화한 뒤
      // 근무기록이 있는 직원만 저장된 값으로 덮어씌움
      const newForms: typeof forms = {}
      emps.forEach((emp) => {
        newForms[emp.id] = {
          startTime: emp.defaultStart || '09:00',
          endTime: '18:00',
          hours: 0
        }
      })
      atts.forEach((att) => {
        newForms[att.employeeId] = {
          startTime: att.startTime,
          endTime: att.endTime,
          hours: att.hoursWorked
        }
      })
      setForms(newForms)
    } finally {
      setIsLoading(false)
    }
  }, [employees])

  useEffect(() => {
    loadAll(selectedDate)
  }, [selectedDate]) // eslint-disable-line react-hooks/exhaustive-deps

  // 날짜 이동 — toISOString()은 UTC 기준이라 타임존 버그 발생하므로 로컬 포맷 사용
  const moveDate = (direction: -1 | 1) => {
    const [y, m, d] = selectedDate.split('-').map(Number)
    const date = new Date(y, m - 1, d + direction)
    const next = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
    setSelectedDate(next)
  }

  // 시간 변경 시 근무시간 즉시 계산
  const handleTimeChange = async (
    employeeId: string,
    field: 'startTime' | 'endTime',
    value: string
  ) => {
    // forms[employeeId]가 반드시 존재해야 함 (loadAll에서 모든 직원 초기화)
    // 혹시라도 없을 경우 employees에서 defaultStart를 가져와 안전하게 처리
    const employee = employees.find((e) => e.id === employeeId)
    const currentForm = forms[employeeId] ?? {
      startTime: employee?.defaultStart || '09:00',
      endTime: '18:00',
      hours: 0
    }
    const updated = { ...currentForm, [field]: value }

    // 근무시간 미리보기 계산
    const calcResult = await window.api.attendance.calcHours(
      updated.startTime,
      updated.endTime
    )
    updated.hours = calcResult.success ? (calcResult.data ?? 0) : 0

    setForms((prev) => ({ ...prev, [employeeId]: updated }))
  }

  // 근무기록 저장
  const handleSave = async (employeeId: string) => {
    const form = forms[employeeId]
    if (!form) return

    setSavingId(employeeId)
    const result = await window.api.attendance.upsert({
      employeeId,
      workDate: selectedDate,
      startTime: form.startTime,
      endTime: form.endTime
    })

    if (result.success) {
      await loadAll(selectedDate)
      // 2초간 완료 표시 후 초기화
      setSavedId(employeeId)
      setTimeout(() => setSavedId(null), 2000)
    } else {
      alert(`저장 실패: ${result.error}`)
    }
    setSavingId(null)
  }

  // 근무기록 삭제
  const handleDelete = async (employeeId: string) => {
    const att = attendances.find((a) => a.employeeId === employeeId)
    if (!att) return
    if (!confirm('이 근무 기록을 삭제하시겠습니까?')) return

    const result = await window.api.attendance.delete(att.id)
    if (result.success) {
      await loadAll(selectedDate)
    }
  }

  const getAttendance = (employeeId: string) =>
    attendances.find((a) => a.employeeId === employeeId)

  // forms는 loadAll에서 모든 직원에 대해 초기화되므로 항상 값이 존재
  // 혹시 없는 경우만 안전 폴백 제공
  const getForm = (employee: Employee) =>
    forms[employee.id] ?? {
      startTime: employee.defaultStart || '09:00',
      endTime: '18:00',
      hours: 0
    }

  return (
    <div className="p-6">
      {/* 헤더 + 날짜 선택 */}
      <div className="mb-6">
        <h1 className="mb-4 text-2xl font-bold text-gray-900">근무 입력</h1>

        <div className="flex items-center gap-3">
          <button
            onClick={() => moveDate(-1)}
            className="rounded-lg border border-gray-200 p-2 hover:bg-gray-50 transition-colors"
          >
            <ChevronLeft size={16} />
          </button>

          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="rounded-lg border border-gray-300 px-4 py-2 text-sm
                       focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
          />

          <button
            onClick={() => moveDate(1)}
            className="rounded-lg border border-gray-200 p-2 hover:bg-gray-50 transition-colors"
          >
            <ChevronRight size={16} />
          </button>

          <button
            onClick={() => setSelectedDate(getTodayString())}
            className="rounded-lg bg-indigo-50 px-3 py-2 text-sm text-indigo-600
                       hover:bg-indigo-100 transition-colors"
          >
            오늘
          </button>
        </div>
      </div>

      {/* 직원별 근무 입력 */}
      {isLoading ? (
        <div className="flex justify-center py-20">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-400 border-t-transparent" />
        </div>
      ) : employees.length === 0 ? (
        <div className="rounded-xl bg-white border border-gray-100 shadow-sm py-20 text-center">
          <p className="text-gray-400">등록된 직원이 없습니다.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {employees.map((emp) => {
            const form = getForm(emp)
            const att = getAttendance(emp.id)
            const isSaved = !!att
            const isSaving = savingId === emp.id
            const isJustSaved = savedId === emp.id

            return (
              <div
                key={emp.id}
                className={`rounded-xl bg-white border shadow-sm p-5 transition-all
                  ${isSaved ? 'border-emerald-200' : 'border-gray-100'}`}
              >
                <div className="flex items-center gap-4">
                  {/* 직원 이름 + 색상 */}
                  <div className="flex items-center gap-2.5 w-24 flex-shrink-0">
                    <div
                      className="h-3 w-3 rounded-full flex-shrink-0"
                      style={{ backgroundColor: emp.color || '#6366f1' }}
                    />
                    <span className="text-sm font-medium text-gray-900 truncate">
                      {emp.name}
                    </span>
                  </div>

                  {/* 출근 시간 */}
                  <div className="flex items-center gap-1.5">
                    <label className="text-xs text-gray-500 w-8">출근</label>
                    <select
                      value={form.startTime}
                      onChange={(e) =>
                        handleTimeChange(emp.id, 'startTime', e.target.value)
                      }
                      className="rounded-lg border border-gray-300 px-2 py-1.5 text-sm
                                 focus:border-indigo-500 focus:outline-none"
                    >
                      {TIME_OPTIONS.map((t) => (
                        <option key={t} value={t}>
                          {t}
                        </option>
                      ))}
                    </select>
                  </div>

                  <span className="text-gray-300">~</span>

                  {/* 퇴근 시간 */}
                  <div className="flex items-center gap-1.5">
                    <label className="text-xs text-gray-500 w-8">퇴근</label>
                    <select
                      value={form.endTime}
                      onChange={(e) =>
                        handleTimeChange(emp.id, 'endTime', e.target.value)
                      }
                      className="rounded-lg border border-gray-300 px-2 py-1.5 text-sm
                                 focus:border-indigo-500 focus:outline-none"
                    >
                      {TIME_OPTIONS.map((t) => (
                        <option key={t} value={t}>
                          {t}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* 근무시간 미리보기 */}
                  <div className="ml-2 rounded-md bg-gray-50 px-3 py-1.5 text-sm text-gray-600 min-w-[80px] text-center">
                    {form.hours > 0 ? (
                      <span className="font-medium text-indigo-600">
                        {formatHours(form.hours)}
                      </span>
                    ) : (
                      <span className="text-gray-300">-</span>
                    )}
                  </div>

                  {/* 휴게 공제 안내 — 자동 공제 설정이 켜진 경우에만 노출 */}
                  {breakDeductionEnabled &&
                    (() => {
                      const [sh, sm] = form.startTime.split(':').map(Number)
                      const [eh, em] = form.endTime.split(':').map(Number)
                      let startMinutes = sh * 60 + sm
                      let endMinutes = eh * 60 + em
                      if (endMinutes <= startMinutes) endMinutes += 24 * 60
                      const rawHours = (endMinutes - startMinutes) / 60

                      if (rawHours >= 8) {
                        return <span className="text-xs text-amber-500">(1시간 공제)</span>
                      }
                      if (rawHours >= 4) {
                        return <span className="text-xs text-amber-500">(30분 공제)</span>
                      }
                      return null
                    })()}

                  {/* 액션 버튼 */}
                  <div className="ml-auto flex items-center gap-2">
                    {isSaved && (
                      <button
                        onClick={() => handleDelete(emp.id)}
                        className="rounded-md p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-500"
                        title="삭제"
                      >
                        <Trash2 size={15} />
                      </button>
                    )}
                    <button
                      onClick={() => handleSave(emp.id)}
                      disabled={isSaving}
                      className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm
                                  font-medium transition-all disabled:opacity-50
                                  ${isJustSaved
                                    ? 'bg-emerald-500 text-white'
                                    : isSaved
                                      ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                                      : 'bg-indigo-600 text-white hover:bg-indigo-700'
                                  }`}
                    >
                      {isJustSaved ? (
                        <>
                          <CheckCircle2 size={13} />
                          수정 완료!
                        </>
                      ) : isSaving ? (
                        <>
                          <Save size={13} />
                          저장 중...
                        </>
                      ) : isSaved ? (
                        <>
                          <Save size={13} />
                          수정
                        </>
                      ) : (
                        <>
                          <Save size={13} />
                          저장
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

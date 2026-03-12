import { useState, useEffect, useCallback, useMemo } from 'react'
import FullCalendar from '@fullcalendar/react'
import dayGridPlugin from '@fullcalendar/daygrid'
import interactionPlugin from '@fullcalendar/interaction'
import type { DateClickArg } from '@fullcalendar/interaction'
import type { Employee, Attendance } from '../../../shared/types'
import { useApp } from '../App'
import { getCurrentYearMonth, getColorStyle, formatHours } from '../lib/utils'

export default function CalendarPage() {
  const { navigate } = useApp()
  const [currentYearMonth, setCurrentYearMonth] = useState(getCurrentYearMonth())
  const [employees, setEmployees] = useState<Employee[]>([])
  const [attendances, setAttendances] = useState<Attendance[]>([])
  const [selectedEmployees, setSelectedEmployees] = useState<Set<string>>(new Set())
  const [isLoading, setIsLoading] = useState(true)
  // 툴팁: 호버한 날짜
  const [hoveredDate, setHoveredDate] = useState<string | null>(null)

  const loadData = useCallback(async (yearMonth: string) => {
    setIsLoading(true)
    try {
      const [empResult, attResult] = await Promise.all([
        window.api.employee.list(),
        window.api.attendance.list(yearMonth)
      ])
      if (empResult.success) {
        setEmployees(empResult.data ?? [])
        setSelectedEmployees(new Set((empResult.data ?? []).map((e) => e.id)))
      }
      if (attResult.success) setAttendances(attResult.data ?? [])
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    loadData(currentYearMonth)
  }, [currentYearMonth, loadData])

  // 날짜별 근무기록 맵 생성 (필터 적용)
  // Map<dateStr, { color: string; name: string; startTime: string; endTime: string; hours: number }[]>
  const dateDotMap = useMemo(() => {
    const map = new Map<
      string,
      { employeeId: string; color: string; name: string; startTime: string; endTime: string; hours: number }[]
    >()

    attendances
      .filter((att) => att.employee && selectedEmployees.has(att.employeeId))
      .forEach((att) => {
        if (!map.has(att.workDate)) map.set(att.workDate, [])
        // 같은 날 같은 직원 중복 방지
        const list = map.get(att.workDate)!
        if (!list.find((e) => e.employeeId === att.employeeId)) {
          list.push({
            employeeId: att.employeeId,
            color: att.employee?.color || '#6366f1',
            name: att.employee?.name || '',
            startTime: att.startTime,
            endTime: att.endTime,
            hours: att.hoursWorked
          })
        }
      })
    return map
  }, [attendances, selectedEmployees])

  const handleDateClick = (info: DateClickArg) => {
    navigate('attendance', { date: info.dateStr })
  }

  const toggleEmployee = (employeeId: string) => {
    setSelectedEmployees((prev) => {
      const next = new Set(prev)
      if (next.has(employeeId)) next.delete(employeeId)
      else next.add(employeeId)
      return next
    })
  }

  return (
    <div className="flex h-full flex-col p-6">
      <div className="mb-5 flex items-start justify-between">
        <h1 className="text-2xl font-bold text-gray-900">달력</h1>

        {/* 직원별 색상 필터 */}
        <div className="flex flex-wrap gap-2 justify-end max-w-md">
          {employees.map((emp) => (
            <button
              key={emp.id}
              onClick={() => toggleEmployee(emp.id)}
              className={`flex items-center gap-1.5 rounded-full px-3 py-1 text-xs
                          border transition-all
                          ${selectedEmployees.has(emp.id)
                            ? 'border-transparent text-white'
                            : 'border-gray-300 text-gray-400 bg-white'
                          }`}
              style={selectedEmployees.has(emp.id) ? getColorStyle(emp.color) : undefined}
            >
              <span
                className="inline-block h-2 w-2 rounded-full"
                style={{ backgroundColor: emp.color || '#6366f1' }}
              />
              {emp.name}
            </button>
          ))}
        </div>
      </div>

      {/* FullCalendar는 항상 마운트 유지 — 언마운트하면 달 이동 시 초기화됨 */}
      <div className="flex-1 overflow-hidden rounded-xl bg-white border border-gray-100 shadow-sm p-4 relative">
        {/* 로딩 중일 때 오버레이만 표시 (FullCalendar 언마운트 금지) */}
        {isLoading && (
          <div className="absolute inset-0 z-10 flex items-center justify-center rounded-xl bg-white/70">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-400 border-t-transparent" />
          </div>
        )}
        <FullCalendar
            plugins={[dayGridPlugin, interactionPlugin]}
            initialView="dayGridMonth"
            locale="ko"
            headerToolbar={{
              left: 'prev,next today',
              center: 'title',
              right: ''
            }}
            events={[]}
            dateClick={handleDateClick}
            datesSet={(info) => {
              // toISOString()은 UTC 기준이라 타임존 오프셋 버그 발생 → 로컬 시간 기준으로 추출
              const d = info.view.currentStart
              const ym = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
              if (ym !== currentYearMonth) setCurrentYearMonth(ym)
            }}
            height="100%"
            buttonText={{ today: '오늘', prev: '‹', next: '›' }}
            // 날짜 셀 커스텀 렌더링 — 색점 표시
            dayCellContent={(info) => {
              // ⚠️ toISOString()은 UTC 기준이므로 로컬 날짜 포맷으로 변환해야 함
              const d = info.date
              const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
              const dots = dateDotMap.get(dateStr) || []
              const isHovered = hoveredDate === dateStr

              return (
                <div
                  style={{ position: 'relative', width: '100%' }}
                  onMouseEnter={() => setHoveredDate(dateStr)}
                  onMouseLeave={() => setHoveredDate(null)}
                >
                  {/* 날짜 숫자 — fc- 클래스 제거하여 FullCalendar 자체 색상 override 방지 */}
                  <div style={{ textAlign: 'right', padding: '2px 4px 0' }}>
                    {info.dayNumberText}
                  </div>

                  {/* 색점 영역 */}
                  {dots.length > 0 && (
                    <div
                      style={{
                        display: 'flex',
                        flexWrap: 'wrap',
                        gap: '3px',
                        padding: '3px 4px 2px'
                      }}
                    >
                      {dots.map((dot) => (
                        <span
                          key={dot.employeeId}
                          style={{
                            width: '9px',
                            height: '9px',
                            borderRadius: '50%',
                            backgroundColor: dot.color,
                            display: 'inline-block',
                            flexShrink: 0
                          }}
                        />
                      ))}
                    </div>
                  )}

                  {/* 호버 툴팁 */}
                  {isHovered && dots.length > 0 && (
                    <div
                      style={{
                        position: 'absolute',
                        zIndex: 9999,
                        left: 0,
                        top: '100%',
                        marginTop: '4px',
                        background: '#1e293b',
                        color: '#fff',
                        borderRadius: '8px',
                        padding: '8px 10px',
                        fontSize: '11px',
                        boxShadow: '0 4px 16px rgba(0,0,0,0.25)',
                        whiteSpace: 'nowrap',
                        pointerEvents: 'none'
                      }}
                    >
                      {dots.map((dot) => (
                        <div
                          key={dot.employeeId}
                          style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '2px 0' }}
                        >
                          <span
                            style={{
                              width: '7px',
                              height: '7px',
                              borderRadius: '50%',
                              backgroundColor: dot.color,
                              display: 'inline-block',
                              flexShrink: 0
                            }}
                          />
                          <span style={{ fontWeight: 600 }}>{dot.name}</span>
                          <span style={{ color: '#94a3b8' }}>{dot.startTime}~{dot.endTime}</span>
                          <span style={{ color: '#818cf8' }}>{formatHours(dot.hours)}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )
            }}
          />
      </div>
    </div>
  )
}

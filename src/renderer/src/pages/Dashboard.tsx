import { useState, useEffect, useCallback } from 'react'
import { Users, Clock, UserCheck, HardDrive, Calendar } from 'lucide-react'
import type { Employee, Attendance } from '../../../shared/types'
import { useApp } from '../App'
import { getTodayString, formatHours, formatDateKorean, getColorStyle } from '../lib/utils'

interface StatCardProps {
  icon: React.ElementType
  label: string
  value: string | number
  sub?: string
  color: string
}

function StatCard({ icon: Icon, label, value, sub, color }: StatCardProps) {
  return (
    <div className="flex items-center gap-4 rounded-xl bg-white p-5 shadow-sm border border-gray-100">
      <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${color}`}>
        <Icon size={22} className="text-white" />
      </div>
      <div>
        <p className="text-xs text-gray-500">{label}</p>
        <p className="text-2xl font-bold text-gray-900">{value}</p>
        {sub && <p className="text-xs text-gray-400">{sub}</p>}
      </div>
    </div>
  )
}

export default function Dashboard() {
  const { navigate } = useApp()
  const [employees, setEmployees] = useState<Employee[]>([])
  const [todayAttendances, setTodayAttendances] = useState<Attendance[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [lastBackupDate, setLastBackupDate] = useState<string | null>(null)

  const today = getTodayString()

  const loadData = useCallback(async () => {
    setIsLoading(true)
    try {
      const [empResult, attResult] = await Promise.all([
        window.api.employee.list(),
        window.api.attendance.listByDate(today)
      ])
      if (empResult.success) setEmployees(empResult.data ?? [])
      if (attResult.success) setTodayAttendances(attResult.data ?? [])
    } finally {
      setIsLoading(false)
    }
  }, [today])

  useEffect(() => {
    loadData()
  }, [loadData])

  const totalHoursToday = todayAttendances.reduce(
    (sum, att) => sum + att.hoursWorked,
    0
  )
  const activeEmployees = employees.filter((e) => e.isActive)

  const handleBackup = async () => {
    const result = await window.api.backup.export()
    if (result.success && result.data) {
      setLastBackupDate(today)
      alert(`백업 완료!\n저장 경로: ${result.data}`)
    } else if (result.success && result.data === null) {
      // 사용자가 취소함
    } else {
      alert('백업 중 오류가 발생했습니다.')
    }
  }

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-400 border-t-transparent" />
      </div>
    )
  }

  return (
    <div className="p-6">
      {/* 헤더 */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">대시보드</h1>
          <p className="mt-0.5 text-sm text-gray-500">{formatDateKorean(today)} 기준</p>
        </div>
        <button
          onClick={handleBackup}
          className="flex items-center gap-2 rounded-lg bg-white border border-gray-200
                     px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors shadow-sm"
        >
          <HardDrive size={15} />
          데이터 백업
          {lastBackupDate && (
            <span className="ml-1 text-xs text-gray-400">({lastBackupDate})</span>
          )}
        </button>
      </div>

      {/* 통계 카드 */}
      <div className="mb-6 grid grid-cols-3 gap-4">
        <StatCard
          icon={Users}
          label="등록 직원"
          value={activeEmployees.length}
          sub={`전체 ${employees.length}명`}
          color="bg-indigo-500"
        />
        <StatCard
          icon={Clock}
          label="오늘 총 근무시간"
          value={formatHours(totalHoursToday)}
          color="bg-emerald-500"
        />
        <StatCard
          icon={UserCheck}
          label="오늘 근무자"
          value={todayAttendances.length}
          sub="명"
          color="bg-amber-500"
        />
      </div>

      {/* 오늘 근무자 목록 */}
      <div className="rounded-xl bg-white border border-gray-100 shadow-sm">
        <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
          <h2 className="font-semibold text-gray-900">오늘 근무자</h2>
          <button
            onClick={() => navigate('attendance', { date: today })}
            className="flex items-center gap-1.5 text-xs text-indigo-600 hover:text-indigo-700"
          >
            <Calendar size={13} />
            근무 입력하기
          </button>
        </div>

        {todayAttendances.length === 0 ? (
          <div className="py-12 text-center">
            <p className="text-sm text-gray-400">오늘 근무 기록이 없습니다.</p>
            <button
              onClick={() => navigate('attendance', { date: today })}
              className="mt-3 rounded-lg bg-indigo-50 px-4 py-2 text-sm text-indigo-600
                         hover:bg-indigo-100 transition-colors"
            >
              근무 입력하기
            </button>
          </div>
        ) : (
          <ul className="divide-y divide-gray-50">
            {todayAttendances.map((att) => (
              <li key={att.id} className="flex items-center gap-3 px-5 py-3.5">
                <div
                  className="h-2.5 w-2.5 rounded-full flex-shrink-0"
                  style={getColorStyle(att.employee?.color ?? null)}
                />
                <span className="font-medium text-gray-900 text-sm">
                  {att.employee?.name ?? '알 수 없음'}
                </span>
                <span className="text-gray-400 text-sm">
                  {att.startTime} ~ {att.endTime}
                </span>
                <span className="ml-auto rounded-md bg-gray-100 px-2 py-0.5 text-xs text-gray-600">
                  {formatHours(att.hoursWorked)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}

import { useState, useEffect, useCallback } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import type { WeeklyStatRow } from '../../../shared/types'
import {
  getCurrentYearMonth,
  formatYearMonthKorean,
  prevMonth,
  nextMonth,
  formatHours,
  formatMoney,
  getColorStyle,
  getWeekRanges
} from '../lib/utils'

export default function WeeklyStats() {
  const [yearMonth, setYearMonth] = useState(getCurrentYearMonth())
  const [stats, setStats] = useState<WeeklyStatRow[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [weekCount, setWeekCount] = useState(4)

  const loadStats = useCallback(async (ym: string) => {
    setIsLoading(true)
    const result = await window.api.statistics.weekly(ym)
    if (result.success) {
      const data = result.data ?? []
      setStats(data)
      // 최대 주차 수 계산
      const maxWeeks = Math.max(...data.map((row) => row.weeks.length), 4)
      setWeekCount(maxWeeks)
    }
    setIsLoading(false)
  }, [])

  useEffect(() => {
    loadStats(yearMonth)
  }, [yearMonth, loadStats])

  const activeStats = stats.filter((row) => row.monthlyTotal > 0 || row.employee.isActive)
  // 현재 월의 주차별 날짜 범위
  const weekRanges = getWeekRanges(yearMonth)

  return (
    <div className="p-6">
      {/* 헤더 */}
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">주간 집계</h1>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setYearMonth(prevMonth(yearMonth))}
            className="rounded-lg border border-gray-200 p-2 hover:bg-gray-50 transition-colors"
          >
            <ChevronLeft size={16} />
          </button>
          <span className="w-32 text-center text-sm font-medium text-gray-700">
            {formatYearMonthKorean(yearMonth)}
          </span>
          <button
            onClick={() => setYearMonth(nextMonth(yearMonth))}
            className="rounded-lg border border-gray-200 p-2 hover:bg-gray-50 transition-colors"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-20">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-400 border-t-transparent" />
        </div>
      ) : activeStats.length === 0 ? (
        <div className="rounded-xl bg-white border border-gray-100 shadow-sm py-20 text-center">
          <p className="text-gray-400">이 달의 근무 기록이 없습니다.</p>
        </div>
      ) : (
        <div className="rounded-xl bg-white border border-gray-100 shadow-sm overflow-x-auto">
          <table className="w-full min-w-[600px]">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                <th className="px-5 py-3 text-left text-xs font-medium text-gray-500">
                  직원
                </th>
                {Array.from({ length: weekCount }).map((_, i) => {
                  const range = weekRanges[i]
                  return (
                    <th
                      key={i}
                      className="px-4 py-3 text-center text-xs font-medium text-gray-500"
                    >
                      <div>{i + 1}주차</div>
                      {range && (
                        <div className="mt-0.5 text-gray-400 font-normal">
                          {range.startDay}일~{range.endDay}일
                        </div>
                      )}
                    </th>
                  )
                })}
                <th className="px-5 py-3 text-right text-xs font-medium text-gray-500">
                  월 합계
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {activeStats.map((row) => (
                <tr key={row.employee.id} className="hover:bg-gray-50">
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-2">
                      <div
                        className="h-2.5 w-2.5 rounded-full flex-shrink-0"
                        style={getColorStyle(row.employee.color)}
                      />
                      <span className="text-sm font-medium text-gray-900">
                        {row.employee.name}
                      </span>
                    </div>
                  </td>
                  {Array.from({ length: weekCount }).map((_, i) => {
                    const week = row.weeks[i]
                    if (!week) {
                      return <td key={i} className="px-4 py-4 text-center text-sm text-gray-300">-</td>
                    }
                    return (
                      <td key={i} className="px-4 py-4 text-center">
                        <div className="text-sm text-gray-700">
                          {week.totalHours > 0 ? formatHours(week.totalHours) : (
                            <span className="text-gray-300">-</span>
                          )}
                        </div>
                        {week.qualifiesForRestDayPay && (
                          <div className="mt-1 flex justify-center">
                            <span className="inline-flex items-center rounded-full bg-amber-100
                                            px-2 py-0.5 text-xs font-medium text-amber-700">
                              주휴
                              {week.restDayPay > 0 && (
                                <span className="ml-1 text-amber-500">
                                  +{formatMoney(week.restDayPay)}
                                </span>
                              )}
                            </span>
                          </div>
                        )}
                      </td>
                    )
                  })}
                  <td className="px-5 py-4 text-right">
                    <span className="text-sm font-semibold text-indigo-600">
                      {formatHours(row.monthlyTotal)}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>

            {/* 합계 행 */}
            <tfoot>
              <tr className="border-t border-gray-200 bg-gray-50">
                <td className="px-5 py-3 text-xs font-medium text-gray-500">합계</td>
                {Array.from({ length: weekCount }).map((_, i) => {
                  const totalHours = activeStats.reduce(
                    (sum, row) => sum + (row.weeks[i]?.totalHours ?? 0),
                    0
                  )
                  const range = weekRanges[i]
                  return (
                    <td key={i} className="px-4 py-3 text-center text-xs font-medium text-gray-600">
                      <div>{totalHours > 0 ? formatHours(totalHours) : '-'}</div>
                      {range && (
                        <div className="mt-0.5 font-normal text-gray-400">
                          {range.startDay}~{range.endDay}일
                        </div>
                      )}
                    </td>
                  )
                })}
                <td className="px-5 py-3 text-right text-xs font-medium text-indigo-600">
                  {formatHours(
                    activeStats.reduce((sum, row) => sum + row.monthlyTotal, 0)
                  )}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      )}

      {/* 주휴수당 안내 */}
      <div className="mt-4 rounded-lg bg-amber-50 border border-amber-200 px-4 py-3">
        <p className="text-xs text-amber-700">
          <strong>주휴수당 발생 조건:</strong> 주간 근무시간 <strong>15시간 이상</strong>인 주차에 발생합니다.
          &nbsp;·&nbsp;
          <strong>주휴수당 금액:</strong> 시급 × <strong>1일 소정 근로시간</strong> (직원별 설정값)
        </p>
      </div>
    </div>
  )
}

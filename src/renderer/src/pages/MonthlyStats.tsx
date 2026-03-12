import { useState, useEffect, useCallback } from 'react'
import { ChevronLeft, ChevronRight, Download, Printer } from 'lucide-react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts'
import type { MonthlyStatRow } from '../../../shared/types'
import {
  getCurrentYearMonth,
  formatYearMonthKorean,
  prevMonth,
  nextMonth,
  formatHours,
  formatMoney,
  getColorStyle
} from '../lib/utils'

export default function MonthlyStats() {
  const [yearMonth, setYearMonth] = useState(getCurrentYearMonth())
  const [stats, setStats] = useState<MonthlyStatRow[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isExporting, setIsExporting] = useState(false)

  const loadStats = useCallback(async (ym: string) => {
    setIsLoading(true)
    const result = await window.api.statistics.monthly(ym)
    if (result.success) setStats(result.data ?? [])
    setIsLoading(false)
  }, [])

  useEffect(() => {
    loadStats(yearMonth)
  }, [yearMonth, loadStats])

  const activeStats = stats.filter(
    (row) => row.totalHours > 0 || row.employee.isActive
  )

  // 차트 데이터 (시급 설정된 직원만)
  const chartData = activeStats
    .filter((row) => row.totalHours > 0)
    .map((row) => ({
      name: row.employee.name,
      기본급: row.basePay,
      주휴수당: row.restDayPay,
      fill: row.employee.color || '#6366f1'
    }))

  const handleExcelExport = async () => {
    setIsExporting(true)
    const result = await window.api.export.excel(yearMonth)
    if (result.success && result.data) {
      alert(`Excel 저장 완료!\n${result.data}`)
    } else if (!result.success) {
      alert(`내보내기 실패: ${result.error}`)
    }
    setIsExporting(false)
  }

  const handlePrint = () => {
    window.print()
  }

  const totalBasePay = activeStats.reduce((sum, row) => sum + row.basePay, 0)
  const totalRestPay = activeStats.reduce((sum, row) => sum + row.restDayPay, 0)
  const totalPay = activeStats.reduce((sum, row) => sum + row.totalPay, 0)

  return (
    <div className="p-6 print:p-4">
      {/* 헤더 */}
      <div className="mb-6 flex items-center justify-between print:hidden">
        <h1 className="text-2xl font-bold text-gray-900">월별 통계</h1>

        <div className="flex items-center gap-3">
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

          <button
            onClick={handlePrint}
            className="flex items-center gap-2 rounded-lg border border-gray-200
                       px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
          >
            <Printer size={15} />
            인쇄
          </button>
          <button
            onClick={handleExcelExport}
            disabled={isExporting}
            className="flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2
                       text-sm font-medium text-white hover:bg-emerald-700 transition-colors
                       disabled:opacity-50"
          >
            <Download size={15} />
            {isExporting ? '내보내는 중...' : 'Excel 내보내기'}
          </button>
        </div>
      </div>

      {/* 인쇄용 헤더 */}
      <div className="mb-4 hidden print:block">
        <h1 className="text-xl font-bold text-gray-900">
          {formatYearMonthKorean(yearMonth)} 급여 내역
        </h1>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-20">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-400 border-t-transparent" />
        </div>
      ) : (
        <>
          {/* 차트 */}
          {chartData.length > 0 && (
            <div className="mb-6 rounded-xl bg-white border border-gray-100 shadow-sm p-5 print:hidden">
              <h2 className="mb-4 text-sm font-semibold text-gray-700">직원별 급여 현황</h2>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={chartData} margin={{ top: 0, right: 20, left: 20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                  <YAxis
                    tick={{ fontSize: 11 }}
                    tickFormatter={(v) => `${(v / 10000).toFixed(0)}만`}
                  />
                  <Tooltip
                    formatter={(value: number) => formatMoney(value)}
                    labelFormatter={(label) => `직원: ${label}`}
                  />
                  <Legend />
                  <Bar dataKey="기본급" fill="#6366f1" radius={[3, 3, 0, 0]} />
                  <Bar dataKey="주휴수당" fill="#f59e0b" radius={[3, 3, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* 급여 테이블 */}
          {activeStats.length === 0 ? (
            <div className="rounded-xl bg-white border border-gray-100 shadow-sm py-20 text-center">
              <p className="text-gray-400">이 달의 근무 기록이 없습니다.</p>
            </div>
          ) : (
            <div className="rounded-xl bg-white border border-gray-100 shadow-sm overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50">
                    <th className="px-5 py-3 text-left text-xs font-medium text-gray-500">직원</th>
                    <th className="px-5 py-3 text-right text-xs font-medium text-gray-500">총 근무시간</th>
                    <th className="px-5 py-3 text-right text-xs font-medium text-gray-500">시급</th>
                    <th className="px-5 py-3 text-right text-xs font-medium text-gray-500">기본급</th>
                    <th className="px-5 py-3 text-right text-xs font-medium text-gray-500">주휴수당</th>
                    <th className="px-5 py-3 text-right text-xs font-medium text-gray-500">예상 월급</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {activeStats.map((row) => (
                    <tr key={row.employee.id} className="hover:bg-gray-50">
                      <td className="px-5 py-3.5">
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
                      <td className="px-5 py-3.5 text-right text-sm text-gray-700">
                        {row.totalHours > 0 ? formatHours(row.totalHours) : '-'}
                      </td>
                      <td className="px-5 py-3.5 text-right text-sm text-gray-600">
                        {row.employee.hourlyWage
                          ? `${row.employee.hourlyWage.toLocaleString()}원`
                          : '-'}
                      </td>
                      <td className="px-5 py-3.5 text-right text-sm text-gray-700">
                        {row.basePay > 0 ? formatMoney(row.basePay) : '-'}
                      </td>
                      <td className="px-5 py-3.5 text-right text-sm">
                        {row.restDayPay > 0 ? (
                          <span className="text-amber-600 font-medium">
                            {formatMoney(row.restDayPay)}
                          </span>
                        ) : (
                          <span className="text-gray-300">-</span>
                        )}
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        {row.totalPay > 0 ? (
                          <span className="text-sm font-bold text-indigo-600">
                            {formatMoney(row.totalPay)}
                          </span>
                        ) : (
                          <span className="text-sm text-gray-300">-</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>

                {/* 합계 행 */}
                <tfoot>
                  <tr className="border-t-2 border-gray-200 bg-indigo-50">
                    <td className="px-5 py-3 text-sm font-semibold text-gray-700">합계</td>
                    <td className="px-5 py-3 text-right text-sm font-semibold text-gray-700">
                      {formatHours(activeStats.reduce((s, r) => s + r.totalHours, 0))}
                    </td>
                    <td className="px-5 py-3" />
                    <td className="px-5 py-3 text-right text-sm font-semibold text-gray-700">
                      {totalBasePay > 0 ? formatMoney(totalBasePay) : '-'}
                    </td>
                    <td className="px-5 py-3 text-right text-sm font-semibold text-amber-600">
                      {totalRestPay > 0 ? formatMoney(totalRestPay) : '-'}
                    </td>
                    <td className="px-5 py-3 text-right text-sm font-bold text-indigo-700">
                      {totalPay > 0 ? formatMoney(totalPay) : '-'}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          )}
        </>
      )}
    </div>
  )
}

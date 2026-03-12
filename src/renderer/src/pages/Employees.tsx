import { useState, useEffect, useCallback } from 'react'
import { Plus, Pencil, Trash2, UserX, UserCheck, X } from 'lucide-react'
import type { Employee } from '../../../shared/types'
import { EMPLOYEE_COLORS } from '../lib/utils'

interface EmployeeFormData {
  name: string
  defaultStart: string
  color: string
  hourlyWage: string
  restDayHours: string
}

const DEFAULT_FORM: EmployeeFormData = {
  name: '',
  defaultStart: '09:00',
  color: '#6366f1',
  hourlyWage: '',
  restDayHours: '8'
}

// 직원 추가/수정 모달
function EmployeeModal({
  employee,
  onSave,
  onClose
}: {
  employee?: Employee
  onSave: (data: EmployeeFormData) => Promise<void>
  onClose: () => void
}) {
  const [form, setForm] = useState<EmployeeFormData>(
    employee
      ? {
          name: employee.name,
          defaultStart: employee.defaultStart || '09:00',
          color: employee.color || '#6366f1',
          hourlyWage: employee.hourlyWage ? String(employee.hourlyWage) : '',
          restDayHours: employee.restDayHours ? String(employee.restDayHours) : '15'
        }
      : DEFAULT_FORM
  )
  const [error, setError] = useState('')
  const [isSaving, setIsSaving] = useState(false)

  const handleSave = async () => {
    if (!form.name.trim()) {
      setError('직원명을 입력해주세요.')
      return
    }
    setError('')
    setIsSaving(true)
    try {
      await onSave(form)
    } catch (e) {
      setError('저장 중 오류가 발생했습니다.')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="w-full max-w-md rounded-xl bg-white shadow-2xl">
        {/* 모달 헤더 */}
        <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
          <h3 className="font-semibold text-gray-900">
            {employee ? '직원 수정' : '직원 추가'}
          </h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X size={18} />
          </button>
        </div>

        <div className="p-6 space-y-4">
          {/* 직원명 */}
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-700">
              직원명 *
            </label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="이름 입력"
              maxLength={10}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm
                         focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
              autoFocus
            />
          </div>

          {/* 기본 출근 시간 + 시급 */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-700">
                기본 출근시간
              </label>
              <input
                type="time"
                value={form.defaultStart}
                onChange={(e) => setForm({ ...form, defaultStart: e.target.value })}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm
                           focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-700">
                시급 (원)
              </label>
              <input
                type="number"
                value={form.hourlyWage}
                onChange={(e) => setForm({ ...form, hourlyWage: e.target.value })}
                placeholder="예: 10030"
                min={0}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm
                           focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
              />
            </div>
          </div>

          {/* 1일 소정 근로시간 (주휴수당 계산 기준) */}
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-700">
              1일 소정 근로시간 (시간)
            </label>
            <input
              type="number"
              value={form.restDayHours}
              onChange={(e) => setForm({ ...form, restDayHours: e.target.value })}
              placeholder="예: 8"
              min={1}
              max={12}
              step={0.5}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm
                         focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
            />
            <p className="mt-1 text-xs text-gray-400">
              주 15시간 이상 근무 시 주휴수당 발생 →{' '}
              <strong>시급 × {form.restDayHours || '?'}시간</strong>
              {form.hourlyWage && form.restDayHours
                ? ` = ${(
                    parseInt(form.hourlyWage) * parseFloat(form.restDayHours)
                  ).toLocaleString()}원/주`
                : ''}
            </p>
          </div>

          {/* 색상 선택 */}
          <div>
            <label className="mb-2 block text-xs font-medium text-gray-700">
              태그 색상
            </label>
            <div className="flex flex-wrap gap-2">
              {EMPLOYEE_COLORS.map((c) => (
                <button
                  key={c.value}
                  onClick={() => setForm({ ...form, color: c.value })}
                  className={`h-7 w-7 rounded-full border-2 transition-all
                    ${form.color === c.value ? 'border-gray-800 scale-110' : 'border-transparent'}`}
                  style={{ backgroundColor: c.value }}
                  title={c.label}
                />
              ))}
            </div>
          </div>

          {error && <p className="text-xs text-red-500">{error}</p>}
        </div>

        <div className="flex gap-3 border-t border-gray-100 px-6 py-4">
          <button
            onClick={onClose}
            className="flex-1 rounded-lg border border-gray-300 py-2 text-sm
                       text-gray-700 hover:bg-gray-50 transition-colors"
          >
            취소
          </button>
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="flex-1 rounded-lg bg-indigo-600 py-2 text-sm font-medium
                       text-white hover:bg-indigo-700 transition-colors
                       disabled:opacity-50"
          >
            {isSaving ? '저장 중...' : '저장'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default function Employees() {
  const [employees, setEmployees] = useState<Employee[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingEmployee, setEditingEmployee] = useState<Employee | undefined>()
  const [showInactive, setShowInactive] = useState(false)

  const loadEmployees = useCallback(async () => {
    setIsLoading(true)
    const result = await window.api.employee.list()
    if (result.success) setEmployees(result.data ?? [])
    setIsLoading(false)
  }, [])

  useEffect(() => {
    loadEmployees()
  }, [loadEmployees])

  const handleSave = async (form: EmployeeFormData) => {
    const data = {
      name: form.name.trim(),
      defaultStart: form.defaultStart || null,
      color: form.color || null,
      hourlyWage: form.hourlyWage ? parseInt(form.hourlyWage) : null,
      restDayHours: form.restDayHours ? parseFloat(form.restDayHours) : null
    }

    if (editingEmployee) {
      const result = await window.api.employee.update(editingEmployee.id, data)
      if (!result.success) throw new Error(result.error)
    } else {
      const result = await window.api.employee.create(data)
      if (!result.success) throw new Error(result.error)
    }

    setShowModal(false)
    setEditingEmployee(undefined)
    loadEmployees()
  }

  const handleToggleActive = async (employee: Employee) => {
    const confirmMsg = employee.isActive
      ? `${employee.name} 직원을 비활성화하시겠습니까?\n(근무기록은 유지됩니다)`
      : `${employee.name} 직원을 복원하시겠습니까?`

    if (!confirm(confirmMsg)) return

    await window.api.employee.update(employee.id, { isActive: !employee.isActive })
    loadEmployees()
  }

  const handleDelete = async (employee: Employee) => {
    if (!confirm(`${employee.name} 직원을 삭제하시겠습니까?\n모든 근무 기록도 함께 삭제됩니다.`))
      return

    const result = await window.api.employee.delete(employee.id)
    if (result.success) {
      loadEmployees()
    } else {
      alert('삭제 중 오류가 발생했습니다.')
    }
  }

  const displayedEmployees = showInactive
    ? employees
    : employees.filter((e) => e.isActive)

  return (
    <div className="p-6">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">직원 관리</h1>
        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
            <input
              type="checkbox"
              checked={showInactive}
              onChange={(e) => setShowInactive(e.target.checked)}
              className="rounded border-gray-300 accent-indigo-600"
            />
            퇴사 직원 포함
          </label>
          <button
            onClick={() => {
              setEditingEmployee(undefined)
              setShowModal(true)
            }}
            className="flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2
                       text-sm font-medium text-white hover:bg-indigo-700 transition-colors"
          >
            <Plus size={15} />
            직원 추가
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-20">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-400 border-t-transparent" />
        </div>
      ) : displayedEmployees.length === 0 ? (
        <div className="rounded-xl bg-white border border-gray-100 shadow-sm py-20 text-center">
          <p className="text-gray-400">등록된 직원이 없습니다.</p>
          <button
            onClick={() => setShowModal(true)}
            className="mt-4 rounded-lg bg-indigo-50 px-4 py-2 text-sm text-indigo-600
                       hover:bg-indigo-100 transition-colors"
          >
            직원 추가하기
          </button>
        </div>
      ) : (
        <div className="rounded-xl bg-white border border-gray-100 shadow-sm overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                <th className="px-5 py-3 text-left text-xs font-medium text-gray-500">직원명</th>
                <th className="px-5 py-3 text-left text-xs font-medium text-gray-500">기본 출근</th>
                <th className="px-5 py-3 text-left text-xs font-medium text-gray-500">시급</th>
                <th className="px-5 py-3 text-left text-xs font-medium text-gray-500">1일 소정 근로시간</th>
                <th className="px-5 py-3 text-left text-xs font-medium text-gray-500">상태</th>
                <th className="px-5 py-3 text-right text-xs font-medium text-gray-500">관리</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {displayedEmployees.map((emp) => (
                <tr key={emp.id} className={`hover:bg-gray-50 ${!emp.isActive ? 'opacity-50' : ''}`}>
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-2.5">
                      <div
                        className="h-3 w-3 rounded-full flex-shrink-0"
                        style={{ backgroundColor: emp.color || '#6366f1' }}
                      />
                      <span className="text-sm font-medium text-gray-900">{emp.name}</span>
                    </div>
                  </td>
                  <td className="px-5 py-3.5 text-sm text-gray-600">
                    {emp.defaultStart || '-'}
                  </td>
                  <td className="px-5 py-3.5 text-sm text-gray-600">
                    {emp.hourlyWage ? `${emp.hourlyWage.toLocaleString()}원` : '-'}
                  </td>
                  <td className="px-5 py-3.5 text-sm text-gray-600">
                    {emp.restDayHours ? (
                      <span>
                        {emp.restDayHours}시간
                        {emp.hourlyWage && (
                          <span className="ml-1 text-xs text-amber-600">
                            ({(emp.hourlyWage * emp.restDayHours).toLocaleString()}원/주)
                          </span>
                        )}
                      </span>
                    ) : '-'}
                  </td>
                  <td className="px-5 py-3.5">
                    <span
                      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium
                        ${emp.isActive
                          ? 'bg-emerald-50 text-emerald-700'
                          : 'bg-gray-100 text-gray-500'
                        }`}
                    >
                      {emp.isActive ? '재직중' : '퇴사'}
                    </span>
                  </td>
                  <td className="px-5 py-3.5">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => {
                          setEditingEmployee(emp)
                          setShowModal(true)
                        }}
                        className="rounded-md p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-700"
                        title="수정"
                      >
                        <Pencil size={14} />
                      </button>
                      <button
                        onClick={() => handleToggleActive(emp)}
                        className="rounded-md p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-700"
                        title={emp.isActive ? '비활성화' : '복원'}
                      >
                        {emp.isActive ? <UserX size={14} /> : <UserCheck size={14} />}
                      </button>
                      <button
                        onClick={() => handleDelete(emp)}
                        className="rounded-md p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-500"
                        title="삭제"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showModal && (
        <EmployeeModal
          employee={editingEmployee}
          onSave={handleSave}
          onClose={() => {
            setShowModal(false)
            setEditingEmployee(undefined)
          }}
        />
      )}
    </div>
  )
}

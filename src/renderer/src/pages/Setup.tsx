import { useState } from 'react'
import type { AppConfig } from '../../../shared/types'
import { Building2, Lock, ChevronRight } from 'lucide-react'

interface SetupProps {
  onComplete: (config: AppConfig) => void
}

export default function Setup({ onComplete }: SetupProps) {
  const [step, setStep] = useState<1 | 2>(1)
  const [bizName, setBizName] = useState('')
  const [usePin, setUsePin] = useState(false)
  const [pin, setPin] = useState('')
  const [pinConfirm, setPinConfirm] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const handleStep1 = () => {
    if (!bizName.trim()) {
      setError('사업장명을 입력해주세요.')
      return
    }
    setError('')
    setStep(2)
  }

  const handleComplete = async () => {
    if (usePin) {
      if (pin.length < 4) {
        setError('PIN은 4자리 이상 입력해주세요.')
        return
      }
      if (pin !== pinConfirm) {
        setError('PIN이 일치하지 않습니다.')
        return
      }
    }

    setError('')
    setIsLoading(true)

    try {
      const result = await window.api.config.create(
        bizName.trim(),
        usePin ? pin : null
      )
      if (result.success && result.data) {
        onComplete(result.data)
      } else {
        setError(result.error || '설정 저장에 실패했습니다.')
      }
    } catch {
      setError('오류가 발생했습니다. 다시 시도해주세요.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex h-screen items-center justify-center bg-slate-800">
      <div className="w-full max-w-md rounded-xl bg-white p-8 shadow-2xl">
        {/* 헤더 */}
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-indigo-600">
            <span className="text-3xl font-bold text-white">근</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">직원 근무 관리</h1>
          <p className="mt-1 text-sm text-gray-500">초기 설정을 완료해주세요</p>
        </div>

        {/* 진행 단계 표시 */}
        <div className="mb-8 flex items-center gap-2">
          <div
            className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold
              ${step >= 1 ? 'bg-indigo-600 text-white' : 'bg-gray-200 text-gray-500'}`}
          >
            1
          </div>
          <div className={`h-0.5 flex-1 ${step >= 2 ? 'bg-indigo-600' : 'bg-gray-200'}`} />
          <div
            className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold
              ${step >= 2 ? 'bg-indigo-600 text-white' : 'bg-gray-200 text-gray-500'}`}
          >
            2
          </div>
        </div>

        {/* Step 1: 사업장명 입력 */}
        {step === 1 && (
          <div>
            <label className="mb-1.5 flex items-center gap-2 text-sm font-medium text-gray-700">
              <Building2 size={15} />
              사업장명
            </label>
            <input
              type="text"
              value={bizName}
              onChange={(e) => setBizName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleStep1()}
              placeholder="예: 홍길동 카페"
              maxLength={30}
              className="w-full rounded-lg border border-gray-300 px-4 py-3 text-sm
                         focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
              autoFocus
            />
            {error && <p className="mt-2 text-xs text-red-500">{error}</p>}
            <button
              onClick={handleStep1}
              className="mt-6 flex w-full items-center justify-center gap-2 rounded-lg
                         bg-indigo-600 py-3 text-sm font-medium text-white hover:bg-indigo-700
                         transition-colors"
            >
              다음
              <ChevronRight size={16} />
            </button>
          </div>
        )}

        {/* Step 2: PIN 설정 */}
        {step === 2 && (
          <div>
            <label className="mb-1.5 flex items-center gap-2 text-sm font-medium text-gray-700">
              <Lock size={15} />
              잠금 PIN 설정 (선택)
            </label>
            <p className="mb-4 text-xs text-gray-500">
              앱 실행 시 PIN을 요구합니다. 설정하지 않아도 됩니다.
            </p>

            <label className="mb-4 flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={usePin}
                onChange={(e) => setUsePin(e.target.checked)}
                className="h-4 w-4 rounded border-gray-300 accent-indigo-600"
              />
              <span className="text-sm text-gray-700">잠금 PIN 사용하기</span>
            </label>

            {usePin && (
              <div className="space-y-3">
                <input
                  type="password"
                  value={pin}
                  onChange={(e) => setPin(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder="PIN 입력 (4~6자리 숫자)"
                  className="w-full rounded-lg border border-gray-300 px-4 py-3 text-sm
                             focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200
                             tracking-widest text-center text-lg"
                />
                <input
                  type="password"
                  value={pinConfirm}
                  onChange={(e) => setPinConfirm(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  onKeyDown={(e) => e.key === 'Enter' && handleComplete()}
                  placeholder="PIN 확인"
                  className="w-full rounded-lg border border-gray-300 px-4 py-3 text-sm
                             focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200
                             tracking-widest text-center text-lg"
                />
              </div>
            )}

            {error && <p className="mt-2 text-xs text-red-500">{error}</p>}

            <div className="mt-6 flex gap-3">
              <button
                onClick={() => setStep(1)}
                className="flex-1 rounded-lg border border-gray-300 py-3 text-sm
                           font-medium text-gray-700 hover:bg-gray-50 transition-colors"
              >
                이전
              </button>
              <button
                onClick={handleComplete}
                disabled={isLoading}
                className="flex-1 rounded-lg bg-indigo-600 py-3 text-sm font-medium
                           text-white hover:bg-indigo-700 transition-colors
                           disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? '설정 중...' : '시작하기'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

import { useState, useRef, useEffect } from 'react'
import { Lock, Delete } from 'lucide-react'

interface LockProps {
  onUnlocked: () => void
}

const PIN_PAD = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', '←']

export default function LockScreen({ onUnlocked }: LockProps) {
  const [pin, setPin] = useState('')
  const [error, setError] = useState('')
  const [isShaking, setIsShaking] = useState(false)
  const MAX_PIN_LENGTH = 6

  useEffect(() => {
    // PIN이 4자리 이상이면 자동 검증
    if (pin.length >= 4) {
      verifyPin(pin)
    }
  }, [pin])

  const verifyPin = async (enteredPin: string) => {
    const result = await window.api.config.verifyPin(enteredPin)
    if (result.success && result.data) {
      onUnlocked()
    } else {
      // 틀린 경우 흔들기 애니메이션
      setIsShaking(true)
      setError('PIN이 올바르지 않습니다.')
      setTimeout(() => {
        setIsShaking(false)
        setPin('')
        setError('')
      }, 600)
    }
  }

  const handlePadPress = (key: string) => {
    if (key === '←') {
      setPin((prev) => prev.slice(0, -1))
      setError('')
    } else if (key !== '' && pin.length < MAX_PIN_LENGTH) {
      setPin((prev) => prev + key)
    }
  }

  return (
    <div className="flex h-screen flex-col items-center justify-center bg-slate-800">
      <div className="w-full max-w-xs">
        {/* 아이콘 */}
        <div className="mb-6 text-center">
          <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-slate-600">
            <Lock size={24} className="text-slate-300" />
          </div>
          <h2 className="text-xl font-semibold text-white">잠금 해제</h2>
          <p className="mt-1 text-sm text-slate-400">PIN을 입력해주세요</p>
        </div>

        {/* PIN 입력 표시 */}
        <div
          className={`mb-8 flex justify-center gap-3 ${isShaking ? 'animate-bounce' : ''}`}
        >
          {Array.from({ length: MAX_PIN_LENGTH }).map((_, i) => (
            <div
              key={i}
              className={`h-3 w-3 rounded-full transition-all duration-150
                ${i < pin.length ? 'bg-indigo-400 scale-110' : 'bg-slate-600'}`}
            />
          ))}
        </div>

        {error && (
          <p className="mb-4 text-center text-xs text-red-400">{error}</p>
        )}

        {/* 숫자 패드 */}
        <div className="grid grid-cols-3 gap-3">
          {PIN_PAD.map((key, index) => (
            <button
              key={index}
              onClick={() => handlePadPress(key)}
              disabled={key === ''}
              className={`
                h-14 rounded-xl text-xl font-medium transition-all duration-100
                ${key === '' ? 'invisible' : ''}
                ${key === '←'
                  ? 'bg-slate-700 text-slate-300 hover:bg-slate-600 active:scale-95'
                  : 'bg-slate-700 text-white hover:bg-slate-600 active:scale-95'
                }
              `}
            >
              {key === '←' ? <Delete size={20} className="mx-auto" /> : key}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

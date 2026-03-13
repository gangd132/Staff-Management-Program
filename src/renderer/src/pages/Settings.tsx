import { useState, useEffect } from 'react'
import {
  Building2,
  Lock,
  HardDrive,
  Upload,
  Trash2,
  Info,
  Eye,
  EyeOff,
  RefreshCw,
  Download,
  CheckCircle2,
  AlertCircle
} from 'lucide-react'
import type { AppConfig } from '../../../shared/types'

// 업데이트 상태 타입
type UpdateStatus =
  | 'idle'           // 대기
  | 'checking'       // 확인 중
  | 'available'      // 새 버전 있음
  | 'not-available'  // 최신 버전
  | 'downloading'    // 다운로드 중
  | 'downloaded'     // 다운로드 완료 (설치 대기)
  | 'error'          // 오류

interface SettingsProps {
  onConfigUpdate: (config: AppConfig) => void
}

function SettingSection({
  title,
  children
}: {
  title: string
  children: React.ReactNode
}) {
  return (
    <div className="rounded-xl bg-white border border-gray-100 shadow-sm overflow-hidden">
      <div className="border-b border-gray-100 bg-gray-50 px-5 py-3">
        <h3 className="text-sm font-semibold text-gray-700">{title}</h3>
      </div>
      <div className="p-5">{children}</div>
    </div>
  )
}

export default function Settings({ onConfigUpdate }: SettingsProps) {
  const [config, setConfig] = useState<AppConfig | null>(null)
  const [bizName, setBizName] = useState('')
  const [breakDeductionEnabled, setBreakDeductionEnabled] = useState(true)
  const [isSavingBreakDeduction, setIsSavingBreakDeduction] = useState(false)
  const [appVersion, setAppVersion] = useState('')
  const [isSavingBiz, setIsSavingBiz] = useState(false)

  // 업데이트 상태
  const [updateStatus, setUpdateStatus] = useState<UpdateStatus>('idle')
  const [updateInfo, setUpdateInfo] = useState<{
    version?: string
    percent?: number
    error?: string
  }>({})

  // PIN 관련
  const [pinMode, setPinMode] = useState<'view' | 'change' | 'remove'>('view')
  const [newPin, setNewPin] = useState('')
  const [newPinConfirm, setNewPinConfirm] = useState('')
  const [pinError, setPinError] = useState('')
  const [showPin, setShowPin] = useState(false)
  const [isSavingPin, setIsSavingPin] = useState(false)

  useEffect(() => {
    loadConfig()
    window.api.app.version().then((r) => {
      if (r.success) setAppVersion(r.data ?? '')
    })

    // 업데이트 이벤트 구독
    window.api.updater.on('update:checking', () => {
      setUpdateStatus('checking')
    })
    window.api.updater.on('update:available', (data) => {
      const info = data as { version: string }
      setUpdateStatus('available')
      setUpdateInfo({ version: info?.version })
    })
    window.api.updater.on('update:not-available', (data) => {
      const info = data as { version: string }
      setUpdateStatus('not-available')
      setUpdateInfo({ version: info?.version })
    })
    window.api.updater.on('update:download-progress', (data) => {
      const progress = data as { percent: number }
      setUpdateStatus('downloading')
      setUpdateInfo((prev) => ({ ...prev, percent: progress?.percent }))
    })
    window.api.updater.on('update:downloaded', (data) => {
      const info = data as { version: string }
      setUpdateStatus('downloaded')
      setUpdateInfo({ version: info?.version })
    })
    window.api.updater.on('update:error', (data) => {
      const err = data as { message: string }
      setUpdateStatus('error')
      setUpdateInfo({ error: err?.message })
    })

    return () => {
      // 컴포넌트 언마운트 시 리스너 해제
      const channels = [
        'update:checking',
        'update:available',
        'update:not-available',
        'update:download-progress',
        'update:downloaded',
        'update:error'
      ]
      channels.forEach((ch) => window.api.updater.off(ch))
    }
  }, [])

  const loadConfig = async () => {
    const result = await window.api.config.get()
    if (result.success && result.data) {
      setConfig(result.data)
      setBizName(result.data.bizName)
      setBreakDeductionEnabled(result.data.breakDeductionEnabled)
    }
  }

  // 근무시간 자동 공제 on/off 저장
  const handleToggleBreakDeduction = async (enabled: boolean) => {
    setBreakDeductionEnabled(enabled)
    setIsSavingBreakDeduction(true)

    const result = await window.api.config.update({
      breakDeductionEnabled: enabled
    })

    if (result.success && result.data) {
      setConfig(result.data)
      onConfigUpdate(result.data)
      setBreakDeductionEnabled(result.data.breakDeductionEnabled)
    } else {
      // 저장 실패 시 기존 설정값으로 복구
      setBreakDeductionEnabled(config?.breakDeductionEnabled ?? true)
      alert(`설정 저장 실패: ${result.error}`)
    }

    setIsSavingBreakDeduction(false)
  }

  // 업데이트 확인
  const handleCheckUpdate = async () => {
    setUpdateStatus('checking')
    setUpdateInfo({})
    await window.api.updater.check()
  }

  // 업데이트 다운로드
  const handleDownloadUpdate = async () => {
    setUpdateStatus('downloading')
    await window.api.updater.download()
  }

  // 업데이트 설치 (앱 재시작)
  const handleInstallUpdate = async () => {
    await window.api.updater.install()
  }

  // 사업장명 저장
  const handleSaveBizName = async () => {
    if (!bizName.trim()) return
    setIsSavingBiz(true)
    const result = await window.api.config.update({ bizName: bizName.trim() })
    if (result.success && result.data) {
      setConfig(result.data)
      onConfigUpdate(result.data)
      alert('사업장명이 변경되었습니다.')
    }
    setIsSavingBiz(false)
  }

  // PIN 설정/변경
  const handleSavePin = async () => {
    if (newPin.length < 4) {
      setPinError('PIN은 4자리 이상 입력해주세요.')
      return
    }
    if (newPin !== newPinConfirm) {
      setPinError('PIN이 일치하지 않습니다.')
      return
    }

    setIsSavingPin(true)
    const result = await window.api.config.update({ pin: newPin })
    if (result.success && result.data) {
      setConfig(result.data)
      onConfigUpdate(result.data)
      setPinMode('view')
      setNewPin('')
      setNewPinConfirm('')
      setPinError('')
      alert('PIN이 설정되었습니다.')
    }
    setIsSavingPin(false)
  }

  // PIN 해제
  const handleRemovePin = async () => {
    if (!confirm('잠금 PIN을 해제하시겠습니까?')) return

    const result = await window.api.config.update({ pin: null })
    if (result.success && result.data) {
      setConfig(result.data)
      onConfigUpdate(result.data)
      alert('PIN이 해제되었습니다.')
    }
  }

  // 데이터 백업
  const handleBackup = async () => {
    const result = await window.api.backup.export()
    if (result.success && result.data) {
      alert(`백업 완료!\n저장 경로: ${result.data}`)
    } else if (!result.success) {
      alert(`백업 실패: ${result.error}`)
    }
  }

  // 데이터 복원
  const handleRestore = async () => {
    if (!confirm('백업 파일로 데이터를 복원하시겠습니까?\n현재 데이터가 백업 파일로 대체됩니다.'))
      return

    const result = await window.api.backup.import()
    if (result.success && result.data) {
      alert('복원 완료! 앱을 재시작하면 복원된 데이터가 적용됩니다.')
    } else if (!result.success) {
      alert(`복원 실패: ${result.error}`)
    }
  }

  // 데이터 초기화
  const handleReset = async () => {
    const confirmed1 = confirm(
      '⚠️ 모든 데이터를 삭제하시겠습니까?\n이 작업은 되돌릴 수 없습니다.'
    )
    if (!confirmed1) return

    const confirmText = prompt('초기화를 진행하려면 "초기화"를 입력하세요:')
    if (confirmText !== '초기화') {
      alert('취소되었습니다.')
      return
    }

    // TODO: 데이터 초기화 IPC 핸들러 호출
    alert('초기화 기능은 준비 중입니다.')
  }

  return (
    <div className="p-6">
      <h1 className="mb-6 text-2xl font-bold text-gray-900">설정</h1>

      <div className="space-y-4 max-w-xl">
        {/* 사업장명 */}
        <SettingSection title="사업장 정보">
          <label className="mb-1.5 flex items-center gap-2 text-sm font-medium text-gray-700">
            <Building2 size={14} />
            사업장명
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              value={bizName}
              onChange={(e) => setBizName(e.target.value)}
              maxLength={30}
              className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm
                         focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
            />
            <button
              onClick={handleSaveBizName}
              disabled={isSavingBiz || !bizName.trim() || bizName === config?.bizName}
              className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white
                         hover:bg-indigo-700 transition-colors disabled:opacity-50"
            >
              {isSavingBiz ? '저장 중...' : '저장'}
            </button>
          </div>
        </SettingSection>

        {/* 근무시간 자동 공제 설정 */}
        <SettingSection title="근무시간 설정">
          <div className="flex items-center justify-between rounded-lg bg-gray-50 px-4 py-3">
            <div>
              <p className="text-sm font-medium text-gray-700">휴게시간 자동 공제</p>
              <p className="text-xs text-gray-400">
                4시간 이상 30분, 8시간 이상 1시간 자동 공제
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => handleToggleBreakDeduction(!breakDeductionEnabled)}
                disabled={isSavingBreakDeduction}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors
                  ${breakDeductionEnabled ? 'bg-indigo-600' : 'bg-gray-300'}
                  ${isSavingBreakDeduction ? 'opacity-60 cursor-not-allowed' : ''}`}
                title="휴게시간 자동 공제 on/off"
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform
                    ${breakDeductionEnabled ? 'translate-x-6' : 'translate-x-1'}`}
                />
              </button>
              <span className="text-sm font-medium text-gray-600 min-w-[2.5rem]">
                {breakDeductionEnabled ? 'ON' : 'OFF'}
              </span>
            </div>
          </div>
        </SettingSection>

        {/* PIN 잠금 */}
        <SettingSection title="잠금 PIN">
          <div className="flex items-center gap-3 mb-4">
            <Lock size={14} className="text-gray-500" />
            <span className="text-sm text-gray-700">
              현재 상태:{' '}
              <span
                className={`font-medium ${config?.pin ? 'text-emerald-600' : 'text-gray-400'}`}
              >
                {config?.pin ? 'PIN 설정됨' : '미설정'}
              </span>
            </span>
          </div>

          {pinMode === 'view' && (
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setPinMode('change')}
                className="rounded-lg bg-indigo-50 px-3 py-2 text-sm text-indigo-600
                           hover:bg-indigo-100 transition-colors"
              >
                {config?.pin ? 'PIN 변경' : 'PIN 설정'}
              </button>
              {config?.pin && (
                <button
                  onClick={handleRemovePin}
                  className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600
                             hover:bg-red-100 transition-colors"
                >
                  PIN 해제
                </button>
              )}
            </div>
          )}

          {pinMode === 'change' && (
            <div className="space-y-3">
              <div className="relative">
                <input
                  type={showPin ? 'text' : 'password'}
                  value={newPin}
                  onChange={(e) =>
                    setNewPin(e.target.value.replace(/\D/g, '').slice(0, 6))
                  }
                  placeholder="새 PIN (4~6자리 숫자)"
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 pr-10 text-sm
                             focus:border-indigo-500 focus:outline-none tracking-widest text-center"
                />
                <button
                  onClick={() => setShowPin(!showPin)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
                >
                  {showPin ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
              <input
                type="password"
                value={newPinConfirm}
                onChange={(e) =>
                  setNewPinConfirm(e.target.value.replace(/\D/g, '').slice(0, 6))
                }
                placeholder="PIN 확인"
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm
                           focus:border-indigo-500 focus:outline-none tracking-widest text-center"
              />
              {pinError && <p className="text-xs text-red-500">{pinError}</p>}
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setPinMode('view')
                    setNewPin('')
                    setNewPinConfirm('')
                    setPinError('')
                  }}
                  className="flex-1 rounded-lg border border-gray-300 py-2 text-sm
                             text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  취소
                </button>
                <button
                  onClick={handleSavePin}
                  disabled={isSavingPin}
                  className="flex-1 rounded-lg bg-indigo-600 py-2 text-sm font-medium
                             text-white hover:bg-indigo-700 transition-colors disabled:opacity-50"
                >
                  {isSavingPin ? '저장 중...' : '저장'}
                </button>
              </div>
            </div>
          )}
        </SettingSection>

        {/* 데이터 관리 */}
        <SettingSection title="데이터 관리">
          <div className="space-y-3">
            <div className="flex items-center justify-between rounded-lg bg-gray-50 px-4 py-3">
              <div>
                <p className="text-sm font-medium text-gray-700">데이터 백업</p>
                <p className="text-xs text-gray-400">DB 파일을 원하는 위치에 저장</p>
              </div>
              <button
                onClick={handleBackup}
                className="flex items-center gap-2 rounded-lg bg-white border border-gray-200
                           px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50 shadow-sm transition-colors"
              >
                <HardDrive size={14} />
                백업
              </button>
            </div>

            <div className="flex items-center justify-between rounded-lg bg-gray-50 px-4 py-3">
              <div>
                <p className="text-sm font-medium text-gray-700">데이터 복원</p>
                <p className="text-xs text-gray-400">백업 파일로 데이터 복원</p>
              </div>
              <button
                onClick={handleRestore}
                className="flex items-center gap-2 rounded-lg bg-white border border-gray-200
                           px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50 shadow-sm transition-colors"
              >
                <Upload size={14} />
                복원
              </button>
            </div>

            <div className="flex items-center justify-between rounded-lg bg-red-50 border border-red-100 px-4 py-3">
              <div>
                <p className="text-sm font-medium text-red-700">데이터 초기화</p>
                <p className="text-xs text-red-400">모든 데이터 삭제 (되돌릴 수 없음)</p>
              </div>
              <button
                onClick={handleReset}
                className="flex items-center gap-2 rounded-lg bg-white border border-red-200
                           px-3 py-1.5 text-sm text-red-600 hover:bg-red-50 shadow-sm transition-colors"
              >
                <Trash2 size={14} />
                초기화
              </button>
            </div>
          </div>
        </SettingSection>

        {/* 앱 정보 & 업데이트 */}
        <SettingSection title="앱 정보 및 업데이트">
          {/* 버전 정보 */}
          <div className="mb-4 flex items-center gap-2 text-sm text-gray-600">
            <Info size={14} className="text-gray-400" />
            <span>직원 근무 관리 Desktop Edition</span>
            <span className="rounded-md bg-gray-100 px-2 py-0.5 text-xs text-gray-500">
              v{appVersion || '1.0.0'}
            </span>
          </div>

          {/* 업데이트 상태 메시지 */}
          {updateStatus === 'not-available' && (
            <div className="mb-3 flex items-center gap-2 rounded-lg bg-green-50 border border-green-100 px-4 py-3 text-sm text-green-700">
              <CheckCircle2 size={16} className="shrink-0" />
              <span>현재 최신 버전입니다 (v{updateInfo.version})</span>
            </div>
          )}
          {updateStatus === 'available' && (
            <div className="mb-3 flex items-center justify-between rounded-lg bg-blue-50 border border-blue-100 px-4 py-3">
              <div className="flex items-center gap-2 text-sm text-blue-700">
                <Download size={16} className="shrink-0" />
                <span>새 버전이 있습니다 — v{updateInfo.version}</span>
              </div>
              <button
                onClick={handleDownloadUpdate}
                className="flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-700 transition-colors"
              >
                <Download size={13} />
                다운로드
              </button>
            </div>
          )}
          {updateStatus === 'downloading' && (
            <div className="mb-3 rounded-lg bg-blue-50 border border-blue-100 px-4 py-3">
              <div className="mb-2 flex items-center justify-between text-sm text-blue-700">
                <span className="flex items-center gap-2">
                  <RefreshCw size={14} className="animate-spin" />
                  다운로드 중...
                </span>
                <span className="font-medium">{updateInfo.percent ?? 0}%</span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-blue-200">
                <div
                  className="h-full rounded-full bg-blue-500 transition-all duration-300"
                  style={{ width: `${updateInfo.percent ?? 0}%` }}
                />
              </div>
            </div>
          )}
          {updateStatus === 'downloaded' && (
            <div className="mb-3 flex items-center justify-between rounded-lg bg-green-50 border border-green-100 px-4 py-3">
              <div className="flex items-center gap-2 text-sm text-green-700">
                <CheckCircle2 size={16} className="shrink-0" />
                <span>v{updateInfo.version} 다운로드 완료. 지금 설치할까요?</span>
              </div>
              <button
                onClick={handleInstallUpdate}
                className="flex items-center gap-1.5 rounded-lg bg-green-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-green-700 transition-colors"
              >
                지금 설치
              </button>
            </div>
          )}
          {updateStatus === 'error' && (
            <div className="mb-3 flex items-center gap-2 rounded-lg bg-red-50 border border-red-100 px-4 py-3 text-sm text-red-700">
              <AlertCircle size={16} className="shrink-0" />
              <span className="break-all">업데이트 오류: {updateInfo.error}</span>
            </div>
          )}

          {/* 업데이트 확인 버튼 */}
          <div className="flex items-center justify-between rounded-lg bg-gray-50 px-4 py-3">
            <div>
              <p className="text-sm font-medium text-gray-700">업데이트 확인</p>
              <p className="text-xs text-gray-400">GitHub에서 최신 버전을 확인합니다</p>
            </div>
            <button
              onClick={handleCheckUpdate}
              disabled={updateStatus === 'checking' || updateStatus === 'downloading'}
              className="flex items-center gap-2 rounded-lg bg-white border border-gray-200
                         px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50 shadow-sm
                         transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <RefreshCw
                size={14}
                className={updateStatus === 'checking' ? 'animate-spin' : ''}
              />
              {updateStatus === 'checking' ? '확인 중...' : '업데이트 확인'}
            </button>
          </div>
        </SettingSection>
      </div>
    </div>
  )
}

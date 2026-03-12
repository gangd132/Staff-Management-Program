import { useState, useEffect, createContext, useContext } from 'react'
import type { AppConfig } from '../../shared/types'
import Layout from './components/Layout'
import Setup from './pages/Setup'
import Lock from './pages/Lock'
import Dashboard from './pages/Dashboard'
import CalendarPage from './pages/CalendarPage'
import Employees from './pages/Employees'
import Attendance from './pages/Attendance'
import WeeklyStats from './pages/WeeklyStats'
import MonthlyStats from './pages/MonthlyStats'
import Settings from './pages/Settings'

export type PageType =
  | 'dashboard'
  | 'calendar'
  | 'employees'
  | 'attendance'
  | 'weekly'
  | 'monthly'
  | 'settings'

// 앱 전역 컨텍스트
interface AppContextValue {
  config: AppConfig | null
  setConfig: (config: AppConfig | null) => void
  currentPage: PageType
  navigate: (page: PageType, params?: Record<string, string>) => void
  pageParams: Record<string, string>
}

const AppContext = createContext<AppContextValue>({} as AppContextValue)
export const useApp = () => useContext(AppContext)

type AppScreen = 'loading' | 'setup' | 'lock' | 'main'

export default function App() {
  const [screen, setScreen] = useState<AppScreen>('loading')
  const [config, setConfig] = useState<AppConfig | null>(null)
  const [currentPage, setCurrentPage] = useState<PageType>('dashboard')
  const [pageParams, setPageParams] = useState<Record<string, string>>({})

  // 앱 시작 시 설정 확인
  useEffect(() => {
    async function checkConfig() {
      const result = await window.api.config.get()
      if (!result.success || !result.data) {
        setScreen('setup')
      } else {
        setConfig(result.data)
        if (result.data.pin) {
          setScreen('lock')
        } else {
          setScreen('main')
        }
      }
    }
    checkConfig()
  }, [])

  const navigate = (page: PageType, params: Record<string, string> = {}) => {
    setPageParams(params)
    setCurrentPage(page)
  }

  const handleSetupComplete = (newConfig: AppConfig) => {
    setConfig(newConfig)
    setScreen('main')
  }

  const handleUnlocked = () => {
    setScreen('main')
  }

  const handleConfigUpdate = (updated: AppConfig) => {
    setConfig(updated)
  }

  if (screen === 'loading') {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-800">
        <div className="text-center">
          <div className="mb-3 h-10 w-10 animate-spin rounded-full border-4 border-indigo-400 border-t-transparent mx-auto" />
          <p className="text-slate-300 text-sm">불러오는 중...</p>
        </div>
      </div>
    )
  }

  if (screen === 'setup') {
    return <Setup onComplete={handleSetupComplete} />
  }

  if (screen === 'lock') {
    return <Lock onUnlocked={handleUnlocked} />
  }

  const pageComponents: Record<PageType, JSX.Element> = {
    dashboard: <Dashboard />,
    calendar: <CalendarPage />,
    employees: <Employees />,
    attendance: <Attendance />,
    weekly: <WeeklyStats />,
    monthly: <MonthlyStats />,
    settings: <Settings onConfigUpdate={handleConfigUpdate} />
  }

  return (
    <AppContext.Provider
      value={{ config, setConfig, currentPage, navigate, pageParams }}
    >
      <Layout currentPage={currentPage} navigate={navigate}>
        {pageComponents[currentPage]}
      </Layout>
    </AppContext.Provider>
  )
}

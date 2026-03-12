import {
  LayoutDashboard,
  Calendar,
  Users,
  ClipboardPen,
  BarChart2,
  TrendingUp,
  Settings
} from 'lucide-react'
import type { PageType } from '../App'
import { useApp } from '../App'

interface NavItem {
  page: PageType
  label: string
  icon: React.ElementType
}

const NAV_ITEMS: NavItem[] = [
  { page: 'dashboard', label: '대시보드', icon: LayoutDashboard },
  { page: 'calendar', label: '달력', icon: Calendar },
  { page: 'employees', label: '직원 관리', icon: Users },
  { page: 'attendance', label: '근무 입력', icon: ClipboardPen },
  { page: 'weekly', label: '주간 집계', icon: BarChart2 },
  { page: 'monthly', label: '월별 통계', icon: TrendingUp }
]

interface SidebarProps {
  currentPage: PageType
  navigate: (page: PageType) => void
}

export default function Sidebar({ currentPage, navigate }: SidebarProps) {
  const { config } = useApp()

  return (
    <aside className="flex h-full w-56 flex-col bg-slate-800">
      {/* 앱 헤더 */}
      <div className="flex h-14 items-center px-4 border-b border-slate-700">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-md bg-indigo-500">
            <span className="text-xs font-bold text-white">근</span>
          </div>
          <span className="text-sm font-semibold text-white truncate max-w-[120px]">
            {config?.bizName || '직원 근무 관리'}
          </span>
        </div>
      </div>

      {/* 네비게이션 */}
      <nav className="flex-1 overflow-y-auto py-3 px-2">
        <ul className="space-y-0.5">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon
            const isActive = currentPage === item.page
            return (
              <li key={item.page}>
                <button
                  onClick={() => navigate(item.page)}
                  className={`
                    flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-sm
                    transition-colors duration-100
                    ${
                      isActive
                        ? 'bg-indigo-600 text-white font-medium'
                        : 'text-slate-300 hover:bg-slate-700 hover:text-white'
                    }
                  `}
                >
                  <Icon size={16} />
                  {item.label}
                </button>
              </li>
            )
          })}
        </ul>
      </nav>

      {/* 하단 설정 버튼 */}
      <div className="border-t border-slate-700 p-2">
        <button
          onClick={() => navigate('settings')}
          className={`
            flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-sm
            transition-colors duration-100
            ${
              currentPage === 'settings'
                ? 'bg-indigo-600 text-white font-medium'
                : 'text-slate-400 hover:bg-slate-700 hover:text-white'
            }
          `}
        >
          <Settings size={16} />
          설정
        </button>
      </div>
    </aside>
  )
}

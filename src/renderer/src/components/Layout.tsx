import type { ReactNode } from 'react'
import type { PageType } from '../App'
import Sidebar from './Sidebar'

interface LayoutProps {
  children: ReactNode
  currentPage: PageType
  navigate: (page: PageType) => void
}

export default function Layout({ children, currentPage, navigate }: LayoutProps) {
  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      <Sidebar currentPage={currentPage} navigate={navigate} />
      <main className="flex-1 overflow-y-auto">
        {children}
      </main>
    </div>
  )
}

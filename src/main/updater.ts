import { autoUpdater } from 'electron-updater'
import { BrowserWindow, ipcMain } from 'electron'

// 자동 다운로드 비활성 (사용자가 직접 다운로드 선택)
autoUpdater.autoDownload = false
// 앱 종료 시 자동 설치
autoUpdater.autoInstallOnAppQuit = true

// 렌더러로 업데이트 상태 전달 헬퍼
function sendToRenderer(window: BrowserWindow, channel: string, data?: unknown) {
  if (window && !window.isDestroyed()) {
    window.webContents.send(channel, data)
  }
}

export function setupAutoUpdater(mainWindow: BrowserWindow): void {
  // ── 업데이트 이벤트 리스너 ──────────────────────────────

  // 업데이트 확인 중
  autoUpdater.on('checking-for-update', () => {
    sendToRenderer(mainWindow, 'update:checking')
  })

  // 새 버전 발견
  autoUpdater.on('update-available', (info) => {
    sendToRenderer(mainWindow, 'update:available', {
      version: info.version,
      releaseDate: info.releaseDate,
      releaseNotes: info.releaseNotes
    })
  })

  // 이미 최신 버전
  autoUpdater.on('update-not-available', (info) => {
    sendToRenderer(mainWindow, 'update:not-available', { version: info.version })
  })

  // 다운로드 진행률
  autoUpdater.on('download-progress', (progress) => {
    sendToRenderer(mainWindow, 'update:download-progress', {
      percent: Math.floor(progress.percent),
      transferred: progress.transferred,
      total: progress.total,
      bytesPerSecond: progress.bytesPerSecond
    })
  })

  // 다운로드 완료
  autoUpdater.on('update-downloaded', (info) => {
    sendToRenderer(mainWindow, 'update:downloaded', { version: info.version })
  })

  // 오류
  autoUpdater.on('error', (err) => {
    sendToRenderer(mainWindow, 'update:error', { message: err.message })
    console.error('[Updater] 업데이트 오류:', err)
  })

  // ── IPC 핸들러 ─────────────────────────────────────────

  // 업데이트 확인 요청
  ipcMain.handle('update:check', async () => {
    try {
      await autoUpdater.checkForUpdates()
      return { success: true }
    } catch (e) {
      return { success: false, error: String(e) }
    }
  })

  // 업데이트 다운로드 시작
  ipcMain.handle('update:download', async () => {
    try {
      await autoUpdater.downloadUpdate()
      return { success: true }
    } catch (e) {
      return { success: false, error: String(e) }
    }
  })

  // 앱 재시작 후 업데이트 설치
  ipcMain.handle('update:install', () => {
    autoUpdater.quitAndInstall(false, true)
  })
}

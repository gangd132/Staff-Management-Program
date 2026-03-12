import Database from 'better-sqlite3'
import { app } from 'electron'
import * as path from 'path'
import * as fs from 'fs'
import { runMigrations } from './migrations'

let dbInstance: Database.Database | null = null

// 앱 데이터 디렉토리에 SQLite 파일 저장
function getDbPath(): string {
  const userDataPath = app.getPath('userData')
  // 디렉토리가 없으면 생성
  if (!fs.existsSync(userDataPath)) {
    fs.mkdirSync(userDataPath, { recursive: true })
  }
  return path.join(userDataPath, 'db.sqlite')
}

// 데이터베이스 초기화 (앱 시작 시 1회 호출)
export function initDatabase(): Database.Database {
  if (dbInstance) return dbInstance

  const dbPath = getDbPath()
  console.log(`[DB] 데이터베이스 경로: ${dbPath}`)

  dbInstance = new Database(dbPath)

  // WAL 모드로 성능 향상 (읽기/쓰기 동시 처리)
  dbInstance.pragma('journal_mode = WAL')
  dbInstance.pragma('foreign_keys = ON')

  // 마이그레이션 실행
  runMigrations(dbInstance)

  return dbInstance
}

// 데이터베이스 인스턴스 반환 (초기화 후 사용)
export function getDb(): Database.Database {
  if (!dbInstance) {
    throw new Error('[DB] 데이터베이스가 초기화되지 않았습니다.')
  }
  return dbInstance
}

// 데이터베이스 파일 경로 반환 (백업용)
export function getDbFilePath(): string {
  return getDbPath()
}

// 데이터베이스 연결 종료 (앱 종료 시)
export function closeDatabase(): void {
  if (dbInstance) {
    dbInstance.close()
    dbInstance = null
  }
}

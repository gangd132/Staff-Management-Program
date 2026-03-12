import type Database from 'better-sqlite3'

// 초기 스키마 생성 SQL
const INITIAL_SCHEMA = `
  -- 스키마 버전 관리 테이블
  CREATE TABLE IF NOT EXISTS schema_version (
    version INTEGER PRIMARY KEY
  );

  -- 앱 설정 테이블 (사용자 1명이므로 id=1 고정)
  CREATE TABLE IF NOT EXISTS app_config (
    id         INTEGER PRIMARY KEY DEFAULT 1,
    biz_name   TEXT    NOT NULL DEFAULT '내 사업장',
    pin        TEXT,
    created_at TEXT    NOT NULL
  );

  -- 직원 테이블
  CREATE TABLE IF NOT EXISTS employees (
    id             TEXT    PRIMARY KEY,
    name           TEXT    NOT NULL,
    default_start  TEXT,
    color          TEXT,
    hourly_wage    INTEGER,
    rest_day_hours INTEGER,
    is_active      INTEGER NOT NULL DEFAULT 1,
    created_at     TEXT    NOT NULL,
    updated_at     TEXT    NOT NULL
  );

  -- 근무 기록 테이블
  CREATE TABLE IF NOT EXISTS attendances (
    id           TEXT    PRIMARY KEY,
    employee_id  TEXT    NOT NULL,
    work_date    TEXT    NOT NULL,
    start_time   TEXT    NOT NULL,
    end_time     TEXT    NOT NULL,
    hours_worked REAL    NOT NULL,
    created_at   TEXT    NOT NULL,
    updated_at   TEXT    NOT NULL,
    FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE,
    UNIQUE (employee_id, work_date)
  );
`

const CURRENT_SCHEMA_VERSION = 1

export function runMigrations(db: Database.Database): void {
  // 마이그레이션 테이블 포함한 초기 스키마 실행
  db.exec(INITIAL_SCHEMA)

  const versionRow = db.prepare('SELECT version FROM schema_version').get() as
    | { version: number }
    | undefined

  const currentVersion = versionRow?.version ?? 0

  // 버전별 마이그레이션 실행 (향후 컬럼 추가 시 여기에 추가)
  if (currentVersion < 1) {
    // 버전 1: 초기 스키마 (이미 위에서 생성됨)
    db.prepare('INSERT OR REPLACE INTO schema_version (version) VALUES (?)').run(1)
  }

  if (currentVersion < CURRENT_SCHEMA_VERSION) {
    console.log(`[DB] 마이그레이션 완료: v${currentVersion} → v${CURRENT_SCHEMA_VERSION}`)
  }
}

import { getDb } from '../index'
import type { AppConfig } from '../../../shared/types'

// DB 행 → AppConfig 변환
function rowToConfig(row: Record<string, unknown>): AppConfig {
  return {
    id: row.id as number,
    bizName: row.biz_name as string,
    pin: (row.pin as string | null) ?? null,
    createdAt: row.created_at as string
  }
}

export const configRepository = {
  // 앱 설정 조회 (없으면 null)
  get(): AppConfig | null {
    const db = getDb()
    const row = db.prepare('SELECT * FROM app_config WHERE id = 1').get() as
      | Record<string, unknown>
      | undefined
    if (!row) return null
    return rowToConfig(row)
  },

  // 초기 설정 생성 (최초 실행 시)
  create(bizName: string, pin: string | null): AppConfig {
    const db = getDb()
    const now = new Date().toISOString()
    db.prepare(
      'INSERT INTO app_config (id, biz_name, pin, created_at) VALUES (1, ?, ?, ?)'
    ).run(bizName, pin, now)
    return { id: 1, bizName, pin, createdAt: now }
  },

  // 설정 업데이트
  update(data: Partial<Pick<AppConfig, 'bizName' | 'pin'>>): AppConfig | null {
    const db = getDb()
    const current = this.get()
    if (!current) return null

    const newBizName = data.bizName ?? current.bizName
    // pin이 명시적으로 null이면 해제, undefined면 기존값 유지
    const newPin = data.pin !== undefined ? data.pin : current.pin

    db.prepare('UPDATE app_config SET biz_name = ?, pin = ? WHERE id = 1').run(
      newBizName,
      newPin
    )
    return { ...current, bizName: newBizName, pin: newPin }
  }
}

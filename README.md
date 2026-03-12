# 직원 근무 관리 - Desktop Edition

소규모 사업장을 위한 **완전 오프라인** 설치형 직원 근무 관리 프로그램

---

## 기술 스택

| 구분 | 기술 |
|------|------|
| UI | Electron + React + Vite + TypeScript |
| 스타일 | Tailwind CSS |
| 데이터베이스 | SQLite (better-sqlite3) |
| 달력 | FullCalendar |
| 차트 | Recharts |
| 아이콘 | lucide-react |

---

## 설치 및 실행

### 1. 패키지 설치

```bash
# better-sqlite3는 네이티브 모듈이므로 --ignore-scripts 필요
npm install --ignore-scripts

# Electron용으로 재빌드
npx electron-rebuild -f -w better-sqlite3
```

> **참고**: `npm install --ignore-scripts` 이후에는 `electron-rebuild`가 자동으로 실행됩니다.

### 2. 개발 서버 실행

```bash
npm run dev
```

### 3. 배포 빌드

```bash
# Windows (.exe)
npm run build:win

# macOS (.dmg)
npm run build:mac
```

---

## 주요 기능

| 기능 | 설명 |
|------|------|
| **대시보드** | 오늘 근무자, 총 근무시간, 직원 수 요약 |
| **달력** | 월간 근무 현황 (직원별 색상 필터) |
| **직원 관리** | 직원 추가/수정/삭제/비활성화, 시급 설정 |
| **근무 입력** | 날짜별 출퇴근 시간 입력 (30분 단위), 실시간 미리보기 |
| **주간 집계** | 주차별 근무시간 + 주휴수당 발생 여부 |
| **월별 통계** | 기본급/주휴수당/예상월급, 차트, Excel 내보내기 |
| **설정** | 사업장명, PIN 잠금, 데이터 백업/복원 |

---

## 데이터 저장 위치

| OS | 경로 |
|----|------|
| **macOS** | `~/Library/Application Support/staff-management-program/db.sqlite` |
| **Windows** | `C:\Users\[사용자]\AppData\Roaming\staff-management-program\db.sqlite` |

---

## 휴게시간 자동 공제 규칙 (근로기준법)

| 근무시간 | 휴게 공제 |
|----------|-----------|
| 4시간 미만 | 없음 |
| 4시간 이상 ~ 8시간 미만 | 30분 |
| 8시간 이상 | 1시간 |

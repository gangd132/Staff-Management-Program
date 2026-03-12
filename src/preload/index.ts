import { contextBridge, ipcRenderer } from 'electron'
import type {
  IPCResult,
  AppConfig,
  Employee,
  Attendance,
  WeeklyStatRow,
  MonthlyStatRow
} from '../shared/types'

// 렌더러 프로세스에서 안전하게 사용할 수 있는 API 노출
const api = {
  config: {
    get: (): Promise<IPCResult<AppConfig | null>> =>
      ipcRenderer.invoke('config:get'),
    create: (bizName: string, pin: string | null): Promise<IPCResult<AppConfig>> =>
      ipcRenderer.invoke('config:create', bizName, pin),
    update: (data: {
      bizName?: string
      pin?: string | null
    }): Promise<IPCResult<AppConfig>> => ipcRenderer.invoke('config:update', data),
    verifyPin: (pin: string): Promise<IPCResult<boolean>> =>
      ipcRenderer.invoke('config:verifyPin', pin)
  },

  employee: {
    list: (onlyActive?: boolean): Promise<IPCResult<Employee[]>> =>
      ipcRenderer.invoke('employee:list', onlyActive),
    create: (data: {
      name: string
      defaultStart?: string | null
      color?: string | null
      hourlyWage?: number | null
      restDayHours?: number | null
    }): Promise<IPCResult<Employee>> => ipcRenderer.invoke('employee:create', data),
    update: (
      id: string,
      data: Partial<{
        name: string
        defaultStart: string | null
        color: string | null
        hourlyWage: number | null
        restDayHours: number | null
        isActive: boolean
      }>
    ): Promise<IPCResult<Employee>> => ipcRenderer.invoke('employee:update', id, data),
    delete: (id: string): Promise<IPCResult<boolean>> =>
      ipcRenderer.invoke('employee:delete', id)
  },

  attendance: {
    list: (yearMonth: string): Promise<IPCResult<Attendance[]>> =>
      ipcRenderer.invoke('attendance:list', yearMonth),
    listByDate: (workDate: string): Promise<IPCResult<Attendance[]>> =>
      ipcRenderer.invoke('attendance:listByDate', workDate),
    upsert: (data: {
      employeeId: string
      workDate: string
      startTime: string
      endTime: string
    }): Promise<IPCResult<Attendance>> => ipcRenderer.invoke('attendance:upsert', data),
    delete: (id: string): Promise<IPCResult<boolean>> =>
      ipcRenderer.invoke('attendance:delete', id),
    calcHours: (startTime: string, endTime: string): Promise<IPCResult<number>> =>
      ipcRenderer.invoke('attendance:calcHours', startTime, endTime)
  },

  statistics: {
    weekly: (yearMonth: string): Promise<IPCResult<WeeklyStatRow[]>> =>
      ipcRenderer.invoke('statistics:weekly', yearMonth),
    monthly: (yearMonth: string): Promise<IPCResult<MonthlyStatRow[]>> =>
      ipcRenderer.invoke('statistics:monthly', yearMonth)
  },

  backup: {
    export: (): Promise<IPCResult<string | null>> => ipcRenderer.invoke('backup:export'),
    import: (): Promise<IPCResult<string | null>> => ipcRenderer.invoke('backup:import')
  },

  export: {
    excel: (yearMonth: string): Promise<IPCResult<string | null>> =>
      ipcRenderer.invoke('export:excel', yearMonth)
  },

  app: {
    version: (): Promise<IPCResult<string>> => ipcRenderer.invoke('app:version')
  }
}

contextBridge.exposeInMainWorld('api', api)

// TypeScript 타입 선언 내보내기 (renderer에서 참조)
export type ElectronAPI = typeof api

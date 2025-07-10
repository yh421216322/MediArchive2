// 用户类型
export interface User {
  id: string;
  name: string;
  avatar?: string;
  relationship: 'self' | 'child' | 'parent' | 'spouse';
  color: string;
}

// 病历类型
export interface MedicalRecord {
  id: string;
  userId: string;
  title: string;
  hospital: string;
  type: 'blood' | 'imaging' | 'prescription' | 'diagnosis' | 'other';
  date: string;
  imageUri?: string;
  description?: string;
  keyIndicators?: KeyIndicator[];
  isAbnormal?: boolean;
  createdAt?: string;
  diseaseId?: string;
}

// 关键指标
export interface KeyIndicator {
  name: string;
  value: string;
  unit: string;
  normalRange?: string;
  isAbnormal: boolean;
}

// 慢病类型
export interface ChronicDisease {
  id: string;
  userId: string;
  name: string;
  type: 'hypertension' | 'diabetes' | 'asthma' | 'heart' | 'other';
  indicators: DiseaseIndicator[];
  reminders: HealthReminder[];
}

// 疾病指标
export interface DiseaseIndicator {
  name: string;
  values: IndicatorValue[];
  unit: string;
  normalRange: string;
}

// 指标值
export interface IndicatorValue {
  date: string;
  value: number;
  isAbnormal: boolean;
}

// 健康提醒
export interface HealthReminder {
  id: string;
  title: string;
  description: string;
  date: string;
  type: 'medication' | 'checkup' | 'test';
  isCompleted: boolean;
  isRepeating: boolean;
  repeatInterval?: number; // 天数
}

// 统计数据
export interface Statistics {
  totalRecords: number;
  chronicDiseases: number;
  pendingReminders: number;
  abnormalRecords: number;
}

// 导航参数类型
export type RootStackParamList = {
  Main: undefined;
  Camera: { userId: string };
  ManualEntry: { userId: string };
  RecordDetail: { record: MedicalRecord };
  DiseaseDetail: { disease: ChronicDisease };
  IndicatorTrend: { indicatorName: string };
  UserManagement: undefined;
  Settings: undefined;
};

export type MainTabParamList = {
  Home: undefined;
  Records: undefined;
  Diseases: undefined;
  Profile: undefined;
}; 
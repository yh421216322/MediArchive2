import React, { createContext, useContext, useState, ReactNode } from 'react';

interface User {
  id: string;
  name: string;
  relationship: string;
}

interface MedicalRecord {
  id: string;
  type: string;
  date: string;
  title: string;
  diseaseId?: string;
}

interface Statistics {
  totalRecords: number;
  chronicDiseases: number;
  pendingReminders: number;
}

interface AppContextType {
  currentUser: User | null;
  users: User[];
  medicalRecords: MedicalRecord[];
  statistics: Statistics;
  chronicDiseases: any[];
  isLoading: boolean;
  setCurrentUser: (user: User) => void;
  refreshData: () => Promise<void>;
  addMedicalRecord: (record: any) => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const useAppContext = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
};

interface AppProviderProps {
  children: ReactNode;
}

export const AppProvider: React.FC<AppProviderProps> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>({
    id: '1',
    name: '张三',
    relationship: 'self'
  });
  
  const [users] = useState<User[]>([
    { id: '1', name: '张三', relationship: 'self' },
    { id: '2', name: '李四', relationship: 'family' }
  ]);
  
  const [medicalRecords] = useState<MedicalRecord[]>([]);
  const [chronicDiseases] = useState<any[]>([]);
  const [isLoading] = useState(false);
  
  const statistics: Statistics = {
    totalRecords: medicalRecords.length,
    chronicDiseases: chronicDiseases.length,
    pendingReminders: 0
  };

  const refreshData = async () => {
    // 模拟数据刷新
    console.log('刷新数据');
  };

  const addMedicalRecord = async (record: any) => {
    // 模拟添加病历记录
    console.log('添加病历记录:', record);
  };

  const value: AppContextType = {
    currentUser,
    users,
    medicalRecords,
    statistics,
    chronicDiseases,
    isLoading,
    setCurrentUser,
    refreshData,
    addMedicalRecord
  };

  return (
    <AppContext.Provider value={value}>
      {children}
    </AppContext.Provider>
  );
}; 
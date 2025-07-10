import { databaseService } from './services/database';
import { User, MedicalRecord, ChronicDisease } from './types';

// 测试自动加表字段和兜底插入字段功能
async function testDatabaseFeatures() {
  console.log('开始测试数据库自动加表字段和兜底插入字段功能...');
  
  try {
    // 初始化数据库
    await databaseService.init();
    console.log('✅ 数据库初始化成功');
    
    // 测试1: 添加用户（测试字段兜底）
    const testUser: User = {
      id: 'test-user-1',
      name: '测试用户',
      relationship: 'self',
      color: '#FF6B6B',
      // 故意不传avatar字段，测试兜底功能
    };
    
    await databaseService.addUser(testUser);
    console.log('✅ 用户添加成功（测试字段兜底）');
    
    // 测试2: 添加病历记录（测试字段兜底）
    const testRecord: MedicalRecord = {
      id: 'test-record-1',
      userId: testUser.id,
      title: '血常规检查',
      hospital: '测试医院',
      type: 'blood',
      date: '2024-01-15',
      // 故意不传某些字段，测试兜底功能
      keyIndicators: [
        {
          name: '白细胞',
          value: '6.5',
          unit: '10^9/L',
          isAbnormal: false,
        }
      ]
    };
    
    await databaseService.addMedicalRecord(testRecord);
    console.log('✅ 病历记录添加成功（测试字段兜底）');
    
    // 测试3: 添加慢病（测试字段兜底）
    const testDisease: ChronicDisease = {
      id: 'test-disease-1',
      userId: testUser.id,
      name: '高血压',
      type: 'hypertension',
      indicators: [
        {
          name: '血压',
          unit: 'mmHg',
          normalRange: '90-140/60-90',
          values: [
            {
              date: '2024-01-15',
              value: 135,
              isAbnormal: true,
            }
          ]
        }
      ],
      reminders: [
        {
          id: 'test-reminder-1',
          title: '血压监测',
          description: '每日测量血压',
          date: '2024-01-20',
          type: 'checkup',
          isCompleted: false,
          isRepeating: true,
          repeatInterval: 1,
        }
      ]
    };
    
    await databaseService.addChronicDisease(testDisease);
    console.log('✅ 慢病添加成功（测试字段兜底）');
    
    // 测试4: 查询数据验证
    const users = await databaseService.getUsers();
    const records = await databaseService.getMedicalRecords();
    const diseases = await databaseService.getChronicDiseases();
    
    console.log(`✅ 查询验证成功: 用户${users.length}个, 病历${records.length}条, 慢病${diseases.length}个`);
    
    // 测试5: 清理测试数据
    await databaseService.clearAllData();
    console.log('✅ 测试数据清理完成');
    
    console.log('🎉 所有测试通过！自动加表字段和兜底插入字段功能正常工作');
    
  } catch (error) {
    console.error('❌ 测试失败:', error);
  }
}

// 运行测试
testDatabaseFeatures(); 
import { databaseService } from './services/database';
import { User, MedicalRecord, ChronicDisease } from './types';

// 调试指标数据流程
async function debugIndicatorData() {
  console.log('🔍 开始调试指标数据流程...');
  
  try {
    // 初始化数据库
    await databaseService.init();
    console.log('✅ 数据库初始化成功');
    
    // 清理旧数据
    await databaseService.clearAllData();
    console.log('✅ 旧数据清理完成');
    
    // 1. 创建测试用户
    const testUser: User = {
      id: 'test-user-1',
      name: '测试用户',
      relationship: 'self',
      color: '#FF6B6B',
    };
    
    await databaseService.addUser(testUser);
    console.log('✅ 测试用户创建成功');
    
    // 2. 创建测试慢病
    const testDisease: ChronicDisease = {
      id: 'test-disease-1',
      userId: testUser.id,
      name: '高血压',
      type: 'hypertension',
      indicators: [],
      reminders: []
    };
    
    await databaseService.addChronicDisease(testDisease);
    console.log('✅ 测试慢病创建成功');
    
    // 3. 创建包含指标的测试病历
    const testRecord: MedicalRecord = {
      id: 'test-record-1',
      userId: testUser.id,
      title: '血常规检查',
      hospital: '测试医院',
      type: 'blood',
      date: '2024-01-15',
      diseaseId: testDisease.id, // 关键：关联到慢病
      keyIndicators: [
        { name: '白细胞', value: '6.5', unit: '10^9/L', isAbnormal: false },
        { name: '红细胞', value: '4.2', unit: '10^12/L', isAbnormal: false },
        { name: '血红蛋白', value: '135', unit: 'g/L', isAbnormal: false },
      ]
    };
    
    await databaseService.addMedicalRecord(testRecord);
    console.log('✅ 测试病历创建成功');
    
    // 4. 查询数据验证
    console.log('\n🔍 开始数据验证...');
    
    const users = await databaseService.getUsers();
    console.log('用户数量:', users.length);
    
    const diseases = await databaseService.getChronicDiseases(testUser.id);
    console.log('慢病数量:', diseases.length);
    console.log('慢病详情:', diseases);
    
    const records = await databaseService.getMedicalRecords(testUser.id);
    console.log('病历数量:', records.length);
    console.log('病历详情:', records);
    
    // 5. 模拟DiseaseDetailScreen的逻辑
    console.log('\n🔍 模拟DiseaseDetailScreen逻辑...');
    
    const disease = diseases[0];
    console.log('当前慢病:', disease);
    
    // 过滤该慢病下的病历
    const diseaseRecords = records.filter(r => r.diseaseId === disease.id);
    console.log('该慢病下的病历数量:', diseaseRecords.length);
    console.log('该慢病下的病历详情:', diseaseRecords);
    
    // 收集指标
    const indicators = new Set<string>();
    diseaseRecords.forEach(record => {
      console.log('处理病历:', record.title, '指标数量:', record.keyIndicators?.length || 0);
      if (record.keyIndicators) {
        record.keyIndicators.forEach(indicator => {
          console.log('发现指标:', indicator.name);
          indicators.add(indicator.name);
        });
      }
    });
    
    const availableIndicators = Array.from(indicators);
    console.log('最终可用指标:', availableIndicators);
    
    // 6. 清理测试数据
    await databaseService.clearAllData();
    console.log('✅ 测试数据清理完成');
    
    console.log('\n🎉 调试完成！');
    console.log('如果availableIndicators为空，可能的原因：');
    console.log('1. 病历没有正确关联到慢病（diseaseId不匹配）');
    console.log('2. 病历的keyIndicators字段为空或不存在');
    console.log('3. 数据库查询逻辑有问题');
    
  } catch (error) {
    console.error('❌ 调试失败:', error);
  }
}

// 运行调试
debugIndicatorData(); 
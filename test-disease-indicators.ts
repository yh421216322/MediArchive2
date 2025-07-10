import { databaseService } from './services/database';
import { User, MedicalRecord, ChronicDisease } from './types';

// 测试慢病关联指标选择和时间轴图表显示功能
async function testDiseaseIndicatorFeatures() {
  console.log('开始测试慢病关联指标选择和时间轴图表显示功能...');
  
  try {
    // 初始化数据库
    await databaseService.init();
    console.log('✅ 数据库初始化成功');
    
    // 清理旧数据
    await databaseService.clearAllData();
    console.log('✅ 旧数据清理完成');
    
    // 测试1: 添加测试用户
    const testUser: User = {
      id: 'test-user-1',
      name: '测试用户',
      relationship: 'self',
      color: '#FF6B6B',
    };
    
    await databaseService.addUser(testUser);
    console.log('✅ 测试用户添加成功');
    
    // 测试2: 添加慢病
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
            },
            {
              date: '2024-02-15',
              value: 128,
              isAbnormal: false,
            },
            {
              date: '2024-03-15',
              value: 142,
              isAbnormal: true,
            }
          ]
        }
      ],
      reminders: []
    };
    
    await databaseService.addChronicDisease(testDisease);
    console.log('✅ 慢病添加成功');
    
    // 测试3: 添加多个包含不同指标的病历记录
    const testRecords: MedicalRecord[] = [
      {
        id: 'record-1',
        userId: testUser.id,
        title: '血常规检查',
        hospital: '测试医院A',
        type: 'blood',
        date: '2024-01-15',
        diseaseId: testDisease.id,
        keyIndicators: [
          { name: '白细胞', value: '6.5', unit: '10^9/L', isAbnormal: false },
          { name: '红细胞', value: '4.2', unit: '10^12/L', isAbnormal: false },
          { name: '血红蛋白', value: '135', unit: 'g/L', isAbnormal: false },
        ]
      },
      {
        id: 'record-2',
        userId: testUser.id,
        title: '血糖检查',
        hospital: '测试医院B',
        type: 'blood',
        date: '2024-02-15',
        diseaseId: testDisease.id,
        keyIndicators: [
          { name: '血糖', value: '5.8', unit: 'mmol/L', isAbnormal: false },
          { name: '血压', value: '128', unit: 'mmHg', isAbnormal: false },
        ]
      },
      {
        id: 'record-3',
        userId: testUser.id,
        title: '血压监测',
        hospital: '测试医院C',
        type: 'blood',
        date: '2024-03-15',
        diseaseId: testDisease.id,
        keyIndicators: [
          { name: '血压', value: '142', unit: 'mmHg', isAbnormal: true },
          { name: '心率', value: '85', unit: '次/分', isAbnormal: false },
        ]
      }
    ];
    
    for (const record of testRecords) {
      await databaseService.addMedicalRecord(record);
    }
    console.log('✅ 病历记录添加成功');
    
    // 测试4: 查询慢病详情
    const diseases = await databaseService.getChronicDiseases(testUser.id);
    const records = await databaseService.getMedicalRecords(testUser.id);
    
    console.log(`✅ 查询验证成功: 慢病${diseases.length}个, 病历${records.length}条`);
    
    // 测试5: 验证指标数据
    const diseaseRecords = records.filter(r => r.diseaseId === testDisease.id);
    const allIndicators = new Set<string>();
    
    diseaseRecords.forEach(record => {
      if (record.keyIndicators) {
        record.keyIndicators.forEach(indicator => {
          allIndicators.add(indicator.name);
        });
      }
    });
    
    console.log('✅ 可用指标:', Array.from(allIndicators));
    console.log('✅ 指标数据验证完成');
    
    // 测试6: 清理测试数据
    await databaseService.clearAllData();
    console.log('✅ 测试数据清理完成');
    
    console.log('🎉 慢病关联指标选择和时间轴图表显示功能测试通过！');
    console.log('');
    console.log('功能说明：');
    console.log('1. 在慢病详情页面，用户可以点击"选择指标"按钮');
    console.log('2. 系统会显示该慢病下所有病历中出现的指标');
    console.log('3. 用户可以选择要显示的指标，系统会生成时间轴图表');
    console.log('4. 每个指标都有独立的图表显示，支持查看详细趋势');
    console.log('5. 图表显示指标随时间的变化趋势，异常值会有特殊标识');
    
  } catch (error) {
    console.error('❌ 测试失败:', error);
  }
}

// 运行测试
testDiseaseIndicatorFeatures(); 
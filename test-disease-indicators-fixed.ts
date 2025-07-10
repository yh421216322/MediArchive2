import { databaseService } from './services/database';
import { User, MedicalRecord, ChronicDisease } from './types';

// 测试修复后的慢病管理指标功能
async function testDiseaseIndicatorsFixed() {
  console.log('🔍 开始测试修复后的慢病管理指标功能...');
  
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
    
    // 2. 创建包含管理指标的测试慢病
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
        },
        {
          name: '心率',
          unit: '次/分',
          normalRange: '60-100',
          values: [
            {
              date: '2024-01-15',
              value: 85,
              isAbnormal: false,
            },
            {
              date: '2024-02-15',
              value: 78,
              isAbnormal: false,
            }
          ]
        }
      ],
      reminders: []
    };
    
    await databaseService.addChronicDisease(testDisease);
    console.log('✅ 包含管理指标的慢病创建成功');
    
    // 3. 创建包含指标的测试病历（作为备用数据源）
    const testRecord: MedicalRecord = {
      id: 'test-record-1',
      userId: testUser.id,
      title: '血常规检查',
      hospital: '测试医院',
      type: 'blood',
      date: '2024-01-15',
      diseaseId: testDisease.id,
      keyIndicators: [
        { name: '白细胞', value: '6.5', unit: '10^9/L', isAbnormal: false },
        { name: '红细胞', value: '4.2', unit: '10^12/L', isAbnormal: false },
      ]
    };
    
    await databaseService.addMedicalRecord(testRecord);
    console.log('✅ 包含指标的病历创建成功');
    
    // 4. 查询数据验证
    console.log('\n🔍 开始数据验证...');
    
    const diseases = await databaseService.getChronicDiseases(testUser.id);
    console.log('慢病数量:', diseases.length);
    console.log('慢病详情:', JSON.stringify(diseases, null, 2));
    
    const records = await databaseService.getMedicalRecords(testUser.id);
    console.log('病历数量:', records.length);
    
    // 5. 模拟DiseaseDetailScreen的逻辑
    console.log('\n🔍 模拟DiseaseDetailScreen逻辑...');
    
    const disease = diseases[0];
    console.log('当前慢病:', disease.name);
    console.log('慢病管理指标数量:', disease.indicators?.length || 0);
    
    // 收集慢病管理指标
    if (disease.indicators && disease.indicators.length > 0) {
      const indicatorNames = disease.indicators.map(indicator => indicator.name);
      console.log('✅ 慢病管理指标:', indicatorNames);
      
      // 模拟选择指标
      const selectedIndicators = ['血压', '心率'];
      console.log('✅ 选中的指标:', selectedIndicators);
      
      // 模拟生成图表数据
      selectedIndicators.forEach(indicatorName => {
        const diseaseIndicator = disease.indicators?.find(indicator => indicator.name === indicatorName);
        if (diseaseIndicator && diseaseIndicator.values) {
          console.log(`✅ ${indicatorName} 数据点数量:`, diseaseIndicator.values.length);
          console.log(`✅ ${indicatorName} 数据:`, diseaseIndicator.values);
        }
      });
    } else {
      console.log('❌ 慢病没有管理指标');
    }
    
    // 6. 清理测试数据
    await databaseService.clearAllData();
    console.log('✅ 测试数据清理完成');
    
    console.log('\n🎉 测试完成！');
    console.log('功能说明：');
    console.log('1. 慢病管理指标存储在 disease.indicators 中');
    console.log('2. 每个指标包含多个时间点的数值');
    console.log('3. 指标选择器会显示这些管理指标');
    console.log('4. 图表会显示选中指标的时间轴数据');
    
  } catch (error) {
    console.error('❌ 测试失败:', error);
  }
}

// 运行测试
testDiseaseIndicatorsFixed(); 
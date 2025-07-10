import * as SQLite from 'expo-sqlite';

const db = SQLite.openDatabaseAsync('MediArchive.db');

interface Disease {
  id: string;
  name: string;
  type: string;
  indicators: any[];
}

interface Indicator {
  id: string;
  name: string;
  value: string;
  unit: string;
  isAbnormal: boolean;
}

export const testIndicatorSelection = async () => {
  console.log('🔍 开始测试指标选择功能...');
  
  try {
    const database = await db;
    
    // 1. 检查慢病数据
    console.log('\n📋 1. 检查慢病数据...');
    const diseasesResult = await database.getAllAsync('SELECT * FROM chronic_diseases');
    const diseases = diseasesResult as Disease[];
    console.log('慢病数量:', diseases.length);
    console.log('慢病详情:', JSON.stringify(diseases, null, 2));
    
    if (diseases.length > 0) {
      const firstDisease = diseases[0];
      console.log('\n📋 第一个慢病详情:', JSON.stringify(firstDisease, null, 2));
      
      // 2. 检查慢病的指标数据
      console.log('\n📊 2. 检查慢病指标数据...');
      const diseaseIndicatorsResult = await database.getAllAsync(
        'SELECT * FROM disease_indicators WHERE disease_id = ?',
        [firstDisease.id]
      );
      const diseaseIndicators = diseaseIndicatorsResult as Indicator[];
      console.log('慢病指标数量:', diseaseIndicators.length);
      console.log('慢病指标详情:', JSON.stringify(diseaseIndicators, null, 2));
      
      // 3. 检查关联的病历记录
      console.log('\n📄 3. 检查关联的病历记录...');
      const medicalRecordsResult = await database.getAllAsync(
        'SELECT * FROM medical_records WHERE disease_id = ?',
        [firstDisease.id]
      );
      const medicalRecords = medicalRecordsResult as any[];
      console.log('关联病历数量:', medicalRecords.length);
      console.log('病历详情:', JSON.stringify(medicalRecords, null, 2));
      
      // 4. 检查病历的指标数据
      if (medicalRecords.length > 0) {
        console.log('\n📊 4. 检查病历指标数据...');
        const recordIds = medicalRecords.map(r => r.id);
        const placeholders = recordIds.map(() => '?').join(',');
        
        const recordIndicatorsResult = await database.getAllAsync(
          `SELECT * FROM key_indicators WHERE record_id IN (${placeholders})`,
          recordIds
        );
        const recordIndicators = recordIndicatorsResult as Indicator[];
        console.log('病历指标数量:', recordIndicators.length);
        console.log('病历指标详情:', JSON.stringify(recordIndicators, null, 2));
      }
    }
    
    // 5. 检查所有指标名称
    console.log('\n📊 5. 检查所有指标名称...');
    const allIndicatorsResult = await database.getAllAsync(
      'SELECT DISTINCT name FROM key_indicators UNION SELECT DISTINCT name FROM disease_indicators'
    );
    const allIndicators = allIndicatorsResult as {name: string}[];
    console.log('所有指标名称:', allIndicators.map(i => i.name));
    
  } catch (error) {
    console.error('❌ 测试失败:', error);
  }
};

// 运行测试
testIndicatorSelection(); 
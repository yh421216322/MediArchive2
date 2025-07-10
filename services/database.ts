import * as SQLite from 'expo-sqlite';
import { User, MedicalRecord, ChronicDisease, HealthReminder, KeyIndicator } from '../types';

// 表结构元数据定义 - 用于自动迁移和字段兜底
interface ColumnDefinition {
  type: string;
  default: any;
  nullable: boolean;
  autoIncrement?: boolean;
}

interface TableSchema {
  [columnName: string]: ColumnDefinition;
}

const TABLE_SCHEMAS: { [tableName: string]: TableSchema } = {
  users: {
    id: { type: 'TEXT', default: '', nullable: false, autoIncrement: false },
    name: { type: 'TEXT', default: '', nullable: false, autoIncrement: false },
    avatar: { type: 'TEXT', default: null, nullable: true, autoIncrement: false },
    relationship: { type: 'TEXT', default: '', nullable: false, autoIncrement: false },
    color: { type: 'TEXT', default: '', nullable: false, autoIncrement: false },
    created_at: { type: 'DATETIME', default: 'CURRENT_TIMESTAMP', nullable: true, autoIncrement: false },
  },
  medical_records: {
    id: { type: 'TEXT', default: '', nullable: false, autoIncrement: false },
    user_id: { type: 'TEXT', default: '', nullable: false, autoIncrement: false },
    title: { type: 'TEXT', default: '', nullable: false, autoIncrement: false },
    hospital: { type: 'TEXT', default: '', nullable: false, autoIncrement: false },
    type: { type: 'TEXT', default: '', nullable: false, autoIncrement: false },
    date: { type: 'TEXT', default: '', nullable: false, autoIncrement: false },
    image_uri: { type: 'TEXT', default: null, nullable: true, autoIncrement: false },
    description: { type: 'TEXT', default: null, nullable: true, autoIncrement: false },
    is_abnormal: { type: 'INTEGER', default: 0, nullable: true, autoIncrement: false },
    created_at: { type: 'DATETIME', default: 'CURRENT_TIMESTAMP', nullable: true, autoIncrement: false },
    disease_id: { type: 'TEXT', default: null, nullable: true, autoIncrement: false },
  },
  key_indicators: {
    id: { type: 'INTEGER', default: null, nullable: false, autoIncrement: true },
    record_id: { type: 'TEXT', default: '', nullable: false, autoIncrement: false },
    name: { type: 'TEXT', default: '', nullable: false, autoIncrement: false },
    value: { type: 'TEXT', default: '', nullable: false, autoIncrement: false },
    unit: { type: 'TEXT', default: '', nullable: false, autoIncrement: false },
    normal_range: { type: 'TEXT', default: null, nullable: true, autoIncrement: false },
    is_abnormal: { type: 'INTEGER', default: 0, nullable: true, autoIncrement: false },
  },
  chronic_diseases: {
    id: { type: 'TEXT', default: '', nullable: false, autoIncrement: false },
    user_id: { type: 'TEXT', default: '', nullable: false, autoIncrement: false },
    name: { type: 'TEXT', default: '', nullable: false, autoIncrement: false },
    type: { type: 'TEXT', default: '', nullable: false, autoIncrement: false },
    created_at: { type: 'DATETIME', default: 'CURRENT_TIMESTAMP', nullable: true, autoIncrement: false },
  },
  disease_indicators: {
    id: { type: 'INTEGER', default: null, nullable: false, autoIncrement: true },
    disease_id: { type: 'TEXT', default: '', nullable: false, autoIncrement: false },
    name: { type: 'TEXT', default: '', nullable: false, autoIncrement: false },
    unit: { type: 'TEXT', default: '', nullable: false, autoIncrement: false },
    normal_range: { type: 'TEXT', default: '', nullable: false, autoIncrement: false },
  },
  indicator_values: {
    id: { type: 'INTEGER', default: null, nullable: false, autoIncrement: true },
    indicator_id: { type: 'INTEGER', default: 0, nullable: false, autoIncrement: false },
    date: { type: 'TEXT', default: '', nullable: false, autoIncrement: false },
    value: { type: 'REAL', default: 0, nullable: false, autoIncrement: false },
    is_abnormal: { type: 'INTEGER', default: 0, nullable: true, autoIncrement: false },
  },
  health_reminders: {
    id: { type: 'TEXT', default: '', nullable: false, autoIncrement: false },
    disease_id: { type: 'TEXT', default: '', nullable: false, autoIncrement: false },
    title: { type: 'TEXT', default: '', nullable: false, autoIncrement: false },
    description: { type: 'TEXT', default: '', nullable: false, autoIncrement: false },
    date: { type: 'TEXT', default: '', nullable: false, autoIncrement: false },
    type: { type: 'TEXT', default: '', nullable: false, autoIncrement: false },
    is_completed: { type: 'INTEGER', default: 0, nullable: true, autoIncrement: false },
    is_repeating: { type: 'INTEGER', default: 0, nullable: true, autoIncrement: false },
    repeat_interval: { type: 'INTEGER', default: null, nullable: true, autoIncrement: false },
  },
};

class DatabaseService {
  private db: SQLite.SQLiteDatabase | null = null;

  async init() {
    this.db = await SQLite.openDatabaseAsync('MediArchive.db');
    await this.createTables();
    await this.migrateDatabase();
  }

  private async createTables() {
    if (!this.db) return;

    // 用户表
    await this.db.execAsync(`
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        avatar TEXT,
        relationship TEXT NOT NULL,
        color TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // 病历表
    await this.db.execAsync(`
      CREATE TABLE IF NOT EXISTS medical_records (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        title TEXT NOT NULL,
        hospital TEXT NOT NULL,
        type TEXT NOT NULL,
        date TEXT NOT NULL,
        image_uri TEXT,
        description TEXT,
        is_abnormal INTEGER DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        disease_id TEXT,
        FOREIGN KEY (user_id) REFERENCES users (id)
      );
    `);

    // 关键指标表
    await this.db.execAsync(`
      CREATE TABLE IF NOT EXISTS key_indicators (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        record_id TEXT NOT NULL,
        name TEXT NOT NULL,
        value TEXT NOT NULL,
        unit TEXT NOT NULL,
        normal_range TEXT,
        is_abnormal INTEGER DEFAULT 0,
        FOREIGN KEY (record_id) REFERENCES medical_records (id)
      );
    `);

    // 慢病表
    await this.db.execAsync(`
      CREATE TABLE IF NOT EXISTS chronic_diseases (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        name TEXT NOT NULL,
        type TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users (id)
      );
    `);

    // 疾病指标表
    await this.db.execAsync(`
      CREATE TABLE IF NOT EXISTS disease_indicators (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        disease_id TEXT NOT NULL,
        name TEXT NOT NULL,
        unit TEXT NOT NULL,
        normal_range TEXT NOT NULL,
        FOREIGN KEY (disease_id) REFERENCES chronic_diseases (id)
      );
    `);

    // 指标值表
    await this.db.execAsync(`
      CREATE TABLE IF NOT EXISTS indicator_values (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        indicator_id INTEGER NOT NULL,
        date TEXT NOT NULL,
        value REAL NOT NULL,
        is_abnormal INTEGER DEFAULT 0,
        FOREIGN KEY (indicator_id) REFERENCES disease_indicators (id)
      );
    `);

    // 健康提醒表
    await this.db.execAsync(`
      CREATE TABLE IF NOT EXISTS health_reminders (
        id TEXT PRIMARY KEY,
        disease_id TEXT NOT NULL,
        title TEXT NOT NULL,
        description TEXT NOT NULL,
        date TEXT NOT NULL,
        type TEXT NOT NULL,
        is_completed INTEGER DEFAULT 0,
        is_repeating INTEGER DEFAULT 0,
        repeat_interval INTEGER,
        FOREIGN KEY (disease_id) REFERENCES chronic_diseases (id)
      );
    `);
  }

  // 自动迁移数据库表结构
  private async migrateDatabase() {
    if (!this.db) return;

    try {
      console.log('Database: 开始自动迁移表结构...');
      
      for (const [tableName, schema] of Object.entries(TABLE_SCHEMAS)) {
        await this.migrateTable(tableName, schema);
      }
      
      console.log('Database: 表结构迁移完成');
    } catch (error) {
      console.error('Database: 迁移过程中出现错误:', error);
    }
  }

  // 迁移单个表的结构
  private async migrateTable(tableName: string, schema: any) {
    if (!this.db) return;

    try {
      // 获取表的当前字段信息
      const columns = await this.db.getAllAsync(`PRAGMA table_info(${tableName})`);
      const existingColumns = new Set(columns.map((col: any) => col.name));
      
      // 检查并添加缺失的字段
      for (const [columnName, columnDef] of Object.entries(schema)) {
        if (!existingColumns.has(columnName)) {
          const { type, default: defaultValue, nullable } = columnDef as any;
          let alterSql = `ALTER TABLE ${tableName} ADD COLUMN ${columnName} ${type}`;
          
          if (defaultValue !== null && defaultValue !== undefined) {
            if (typeof defaultValue === 'string' && defaultValue !== 'CURRENT_TIMESTAMP') {
              alterSql += ` DEFAULT '${defaultValue}'`;
            } else if (defaultValue === 'CURRENT_TIMESTAMP') {
              alterSql += ` DEFAULT ${defaultValue}`;
            } else {
              alterSql += ` DEFAULT ${defaultValue}`;
            }
          }
          
          if (!nullable) {
            alterSql += ' NOT NULL';
          }
          
          console.log(`Database: 为表 ${tableName} 添加字段 ${columnName}: ${alterSql}`);
          await this.db.runAsync(alterSql);
        }
      }
    } catch (error) {
      console.error(`Database: 迁移表 ${tableName} 时出错:`, error);
    }
  }

  // 获取表的字段信息
  private async getTableColumns(tableName: string): Promise<string[]> {
    if (!this.db) return [];
    
    try {
      const columns = await this.db.getAllAsync(`PRAGMA table_info(${tableName})`);
      return columns.map((col: any) => col.name);
    } catch (error) {
      console.error(`Database: 获取表 ${tableName} 字段信息失败:`, error);
      return [];
    }
  }

  // 动态生成插入语句和参数
  private async prepareInsertStatement(tableName: string, data: any): Promise<{ sql: string; params: any[] }> {
    const columns = await this.getTableColumns(tableName);
    const schema = TABLE_SCHEMAS[tableName as keyof typeof TABLE_SCHEMAS];
    
    if (!schema) {
      throw new Error(`未找到表 ${tableName} 的架构定义`);
    }
    
    // 准备插入的字段和参数
    const insertColumns: string[] = [];
    const insertParams: any[] = [];
    
    for (const columnName of columns) {
      // 跳过自增主键
      if (schema[columnName as keyof typeof schema]?.autoIncrement) {
        continue;
      }
      
      insertColumns.push(columnName);
      
      // 如果数据中有该字段，使用数据值；否则使用默认值
      if (data.hasOwnProperty(columnName)) {
        insertParams.push(data[columnName]);
      } else {
        const defaultValue = schema[columnName as keyof typeof schema]?.default;
        insertParams.push(defaultValue);
      }
    }
    
    const sql = `INSERT OR REPLACE INTO ${tableName} (${insertColumns.join(', ')}) VALUES (${insertColumns.map(() => '?').join(', ')})`;
    
    return { sql, params: insertParams };
  }

  // 用户相关操作
  async addUser(user: User): Promise<void> {
    if (!this.db) return;
    
    const { sql, params } = await this.prepareInsertStatement('users', {
      id: user.id,
      name: user.name,
      avatar: user.avatar,
      relationship: user.relationship,
      color: user.color,
    });
    
    await this.db.runAsync(sql, params);
  }

  async getUsers(): Promise<User[]> {
    if (!this.db) return [];
    const result = await this.db.getAllAsync('SELECT * FROM users ORDER BY created_at');
    return result.map((row: any) => ({
      id: row.id,
      name: row.name,
      avatar: row.avatar,
      relationship: row.relationship,
      color: row.color,
    }));
  }

  async updateUser(user: User): Promise<void> {
    if (!this.db) return;
    await this.db.runAsync(
      'UPDATE users SET name = ?, avatar = ?, relationship = ?, color = ? WHERE id = ?',
      [user.name, user.avatar || null, user.relationship, user.color, user.id]
    );
  }

  async deleteUser(userId: string): Promise<void> {
    if (!this.db) return;
    await this.db.runAsync('DELETE FROM users WHERE id = ?', [userId]);
  }

  // 病历相关操作
  async addMedicalRecord(record: MedicalRecord): Promise<void> {
    if (!this.db) return;
    
    console.log('Database: 开始保存病历记录:', record);
    
    // 使用动态生成的插入语句
    const { sql, params } = await this.prepareInsertStatement('medical_records', {
      id: record.id,
      user_id: record.userId,
      title: record.title,
      hospital: record.hospital,
      type: record.type,
      date: record.date,
      image_uri: record.imageUri,
      description: record.description,
      is_abnormal: record.isAbnormal ? 1 : 0,
      disease_id: record.diseaseId,
    });
    
    await this.db.runAsync(sql, params);
    console.log('Database: 病历基本信息保存成功');

    // 如果有关键指标，先删除旧的再插入新的
    if (record.keyIndicators) {
      console.log('Database: 开始保存关键指标，数量:', record.keyIndicators.length);
      // 先删除该记录的所有关键指标
      await this.db.runAsync('DELETE FROM key_indicators WHERE record_id = ?', [record.id]);
      
      // 重新插入关键指标
      for (const indicator of record.keyIndicators) {
        const indicatorData = {
          record_id: record.id,
          name: indicator.name,
          value: indicator.value,
          unit: indicator.unit,
          normal_range: indicator.normalRange,
          is_abnormal: indicator.isAbnormal ? 1 : 0,
        };
        
        const { sql: indicatorSql, params: indicatorParams } = await this.prepareInsertStatement('key_indicators', indicatorData);
        await this.db.runAsync(indicatorSql, indicatorParams);
      }
      console.log('Database: 关键指标保存完成');
    }
    
    console.log('Database: 病历记录保存完成');
  }

  async getMedicalRecords(userId?: string, type?: string, diseaseId?: string): Promise<MedicalRecord[]> {
    if (!this.db) return [];
    
    console.log('Database: 开始查询病历记录，用户ID:', userId, '类型:', type, '疾病ID:', diseaseId);
    
    let query = `
      SELECT mr.*, 
             GROUP_CONCAT(ki.name || ':' || ki.value || ' ' || ki.unit) as indicators
      FROM medical_records mr
      LEFT JOIN key_indicators ki ON mr.id = ki.record_id
    `;
    
    const params: any[] = [];
    const conditions: string[] = [];
    
    if (userId) {
      conditions.push('mr.user_id = ?');
      params.push(userId);
    }
    
    if (type) {
      conditions.push('mr.type = ?');
      params.push(type);
    }
    
    if (diseaseId) {
      conditions.push('mr.disease_id = ?');
      params.push(diseaseId);
    }
    
    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }
    
    query += ' GROUP BY mr.id ORDER BY mr.date DESC';
    
    console.log('Database: 执行查询:', query, '参数:', params);
    
    const result = await this.db.getAllAsync(query, params);
    console.log('Database: 查询结果原始数据:', result);
    
    const records = result.map((row: any) => ({
      id: row.id,
      userId: row.user_id,
      title: row.title,
      hospital: row.hospital,
      type: row.type,
      date: row.date,
      imageUri: row.image_uri,
      description: row.description,
      isAbnormal: Boolean(row.is_abnormal),
      createdAt: row.created_at,
      diseaseId: row.disease_id,
      keyIndicators: row.indicators ? this.parseIndicators(row.indicators) : [],
    }));
    
    console.log('Database: 处理后的病历记录:', records);
    return records;
  }

  private parseIndicators(indicatorsString: string): KeyIndicator[] {
    if (!indicatorsString) return [];
    
    try {
      return indicatorsString.split(',').map(indicator => {
        const parts = indicator.split(':');
        if (parts.length < 2) return null;
        
        const name = parts[0].trim();
        const valueUnit = parts[1].trim();
        
        // 处理 "value unit" 格式
        const valueUnitParts = valueUnit.split(' ');
        const value = valueUnitParts[0];
        const unit = valueUnitParts.slice(1).join(' ') || '';
        
        return {
          name,
          value,
          unit,
          isAbnormal: false,
        };
      }).filter(Boolean) as KeyIndicator[];
    } catch (error) {
      console.error('解析指标数据失败:', error);
      return [];
    }
  }

  async deleteMedicalRecord(recordId: string): Promise<void> {
    if (!this.db) return;
    await this.db.runAsync('DELETE FROM key_indicators WHERE record_id = ?', [recordId]);
    await this.db.runAsync('DELETE FROM medical_records WHERE id = ?', [recordId]);
  }

  // 慢病相关操作
  async addChronicDisease(disease: ChronicDisease): Promise<void> {
    if (!this.db) return;
    
    // 使用动态生成的插入语句保存慢病基本信息
    const { sql, params } = await this.prepareInsertStatement('chronic_diseases', {
      id: disease.id,
      user_id: disease.userId,
      name: disease.name,
      type: disease.type,
    });
    
    await this.db.runAsync(sql, params);

    // 添加疾病指标
    for (const indicator of disease.indicators) {
      const indicatorData = {
        disease_id: disease.id,
        name: indicator.name,
        unit: indicator.unit,
        normal_range: indicator.normalRange,
      };
      
      const { sql: indicatorSql, params: indicatorParams } = await this.prepareInsertStatement('disease_indicators', indicatorData);
      const result = await this.db.runAsync(indicatorSql, indicatorParams);
      
      const indicatorId = result.lastInsertRowId;
      
      // 添加指标值
      for (const value of indicator.values) {
        const valueData = {
          indicator_id: indicatorId,
          date: value.date,
          value: value.value,
          is_abnormal: value.isAbnormal ? 1 : 0,
        };
        
        const { sql: valueSql, params: valueParams } = await this.prepareInsertStatement('indicator_values', valueData);
        await this.db.runAsync(valueSql, valueParams);
      }
    }

    // 添加健康提醒
    for (const reminder of disease.reminders) {
      const reminderData = {
        id: reminder.id,
        disease_id: disease.id,
        title: reminder.title,
        description: reminder.description,
        date: reminder.date,
        type: reminder.type,
        is_completed: reminder.isCompleted ? 1 : 0,
        is_repeating: reminder.isRepeating ? 1 : 0,
        repeat_interval: reminder.repeatInterval,
      };
      
      const { sql: reminderSql, params: reminderParams } = await this.prepareInsertStatement('health_reminders', reminderData);
      await this.db.runAsync(reminderSql, reminderParams);
    }
  }

  async getChronicDiseases(userId?: string): Promise<ChronicDisease[]> {
    if (!this.db) return [];
    
    let query = 'SELECT * FROM chronic_diseases';
    const params: any[] = [];
    
    if (userId) {
      query += ' WHERE user_id = ?';
      params.push(userId);
    }
    
    query += ' ORDER BY created_at DESC';
    
    const diseases = await this.db.getAllAsync(query, params);
    const result: ChronicDisease[] = [];
    
    for (const disease of diseases as any[]) {
      const indicators = await this.db.getAllAsync(
        'SELECT * FROM disease_indicators WHERE disease_id = ?',
        [disease.id]
      );
      
      const diseaseIndicators = [];
      for (const indicator of indicators as any[]) {
        const values = await this.db.getAllAsync(
          'SELECT * FROM indicator_values WHERE indicator_id = ? ORDER BY date DESC',
          [indicator.id]
        );
        
        diseaseIndicators.push({
          name: indicator.name,
          unit: indicator.unit,
          normalRange: indicator.normal_range,
          values: (values as any[]).map(v => ({
            date: v.date,
            value: v.value,
            isAbnormal: Boolean(v.is_abnormal),
          })),
        });
      }
      
      const reminders = await this.db.getAllAsync(
        'SELECT * FROM health_reminders WHERE disease_id = ? ORDER BY date',
        [disease.id]
      );
      
      result.push({
        id: disease.id,
        userId: disease.user_id,
        name: disease.name,
        type: disease.type,
        indicators: diseaseIndicators,
        reminders: (reminders as any[]).map(r => ({
          id: r.id,
          title: r.title,
          description: r.description,
          date: r.date,
          type: r.type,
          isCompleted: Boolean(r.is_completed),
          isRepeating: Boolean(r.is_repeating),
          repeatInterval: r.repeat_interval,
        })),
      });
    }
    
    return result;
  }

  // 统计数据
  async getStatistics(userId?: string): Promise<{ totalRecords: number; chronicDiseases: number; pendingReminders: number; abnormalRecords: number }> {
    if (!this.db) return { totalRecords: 0, chronicDiseases: 0, pendingReminders: 0, abnormalRecords: 0 };
    
    // 统计病历总数
    let recordWhere: string[] = [];
    let recordParams: any[] = [];
    if (userId) {
      recordWhere.push('user_id = ?');
      recordParams.push(userId);
    }
    const recordWhereClause = recordWhere.length > 0 ? 'WHERE ' + recordWhere.join(' AND ') : '';
    const totalRecords = await this.db.getFirstAsync(
      `SELECT COUNT(*) as count FROM medical_records ${recordWhereClause}`,
      recordParams
    );

    // 统计慢病总数
    let diseaseWhere: string[] = [];
    let diseaseParams: any[] = [];
    if (userId) {
      diseaseWhere.push('user_id = ?');
      diseaseParams.push(userId);
    }
    const diseaseWhereClause = diseaseWhere.length > 0 ? 'WHERE ' + diseaseWhere.join(' AND ') : '';
    const chronicDiseases = await this.db.getFirstAsync(
      `SELECT COUNT(*) as count FROM chronic_diseases ${diseaseWhereClause}`,
      diseaseParams
    );

    // 统计待处理提醒
    let reminderWhere: string[] = ['hr.is_completed = 0'];
    let reminderParams: any[] = [];
    if (userId) {
      reminderWhere.push('cd.user_id = ?');
      reminderParams.push(userId);
    }
    const reminderWhereClause = reminderWhere.length > 0 ? 'WHERE ' + reminderWhere.join(' AND ') : '';
    const pendingReminders = await this.db.getFirstAsync(
      `SELECT COUNT(*) as count FROM health_reminders hr 
       JOIN chronic_diseases cd ON hr.disease_id = cd.id 
       ${reminderWhereClause}`,
      reminderParams
    );

    // 统计异常病历
    let abnormalWhere: string[] = ['is_abnormal = 1'];
    let abnormalParams: any[] = [];
    if (userId) {
      abnormalWhere.push('user_id = ?');
      abnormalParams.push(userId);
    }
    const abnormalWhereClause = abnormalWhere.length > 0 ? 'WHERE ' + abnormalWhere.join(' AND ') : '';
    const abnormalRecords = await this.db.getFirstAsync(
      `SELECT COUNT(*) as count FROM medical_records ${abnormalWhereClause}`,
      abnormalParams
    );

    return {
      totalRecords: (totalRecords as any)?.count || 0,
      chronicDiseases: (chronicDiseases as any)?.count || 0,
      pendingReminders: (pendingReminders as any)?.count || 0,
      abnormalRecords: (abnormalRecords as any)?.count || 0,
    };
  }

  async clearAllData() {
    if (!this.db) return;
    await this.db.runAsync('DELETE FROM users');
    await this.db.runAsync('DELETE FROM medical_records');
    await this.db.runAsync('DELETE FROM key_indicators');
    await this.db.runAsync('DELETE FROM chronic_diseases');
    await this.db.runAsync('DELETE FROM disease_indicators');
    await this.db.runAsync('DELETE FROM indicator_values');
    await this.db.runAsync('DELETE FROM health_reminders');
  }

  async getMedicalRecordsByDisease(diseaseId: string): Promise<MedicalRecord[]> {
    return this.getMedicalRecords(undefined, undefined, diseaseId);
  }
}

export const databaseService = new DatabaseService(); 
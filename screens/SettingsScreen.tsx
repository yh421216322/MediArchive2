import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Switch,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../types';
import { useAppContext } from '../context/AppContext';
import { databaseService } from '../services/database';

type SettingsScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Settings'>;

export const SettingsScreen: React.FC = () => {
  const navigation = useNavigation<SettingsScreenNavigationProp>();
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isBiometricEnabled, setIsBiometricEnabled] = useState(false);
  const [isAutoBackup, setIsAutoBackup] = useState(true);
  const { refreshData } = useAppContext();

  const handleBackup = () => {
    Alert.alert('备份', '功能开发中...');
  };

  const handleRestore = () => {
    Alert.alert('恢复', '功能开发中...');
  };

  const handleExport = () => {
    Alert.alert('导出', '功能开发中...');
  };

  const handleClearCache = () => {
    Alert.alert(
      '清除缓存',
      '确定要清除所有缓存数据吗？',
      [
        { text: '取消', style: 'cancel' },
        {
          text: '清除',
          style: 'destructive',
          onPress: () => {
            Alert.alert('成功', '缓存已清除');
          },
        },
      ]
    );
  };

  const handleAbout = () => {
    Alert.alert('关于', '电子病历夹 v1.0.0\n\n一个帮助您管理家庭健康记录的应用程序。');
  };

  const handlePrivacy = () => {
    Alert.alert('隐私政策', '功能开发中...');
  };

  const handleFeedback = () => {
    Alert.alert('意见反馈', '功能开发中...');
  };

  const handleClearAllData = async () => {
    Alert.alert('确认清除', '确定要清除所有历史数据吗？此操作不可恢复！', [
      { text: '取消', style: 'cancel' },
      {
        text: '确定',
        style: 'destructive',
        onPress: async () => {
          await databaseService.clearAllData();
          await refreshData();
          Alert.alert('已清除', '所有数据已清空');
        },
      },
    ]);
  };

  const renderSettingItem = (
    icon: string,
    title: string,
    subtitle?: string,
    onPress?: () => void,
    rightComponent?: React.ReactNode
  ) => (
    <TouchableOpacity
      style={styles.settingItem}
      onPress={onPress}
      disabled={!onPress}
    >
      <View style={styles.settingLeft}>
        <View style={styles.settingIcon}>
          <Ionicons name={icon as any} size={20} color="#4A90E2" />
        </View>
        <View style={styles.settingText}>
          <Text style={styles.settingTitle}>{title}</Text>
          {subtitle && <Text style={styles.settingSubtitle}>{subtitle}</Text>}
        </View>
      </View>
      {rightComponent || (onPress && (
        <Ionicons name="chevron-forward" size={20} color="#CCC" />
      ))}
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView}>
        {/* 账号设置 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>账号设置</Text>
          {renderSettingItem(
            'people-outline',
            '家庭成员管理',
            '添加、删除家庭成员',
            () => navigation.navigate('UserManagement')
          )}
          {renderSettingItem(
            'finger-print-outline',
            '生物识别',
            '使用指纹或面容解锁',
            undefined,
            <Switch
              value={isBiometricEnabled}
              onValueChange={setIsBiometricEnabled}
              trackColor={{ false: '#E0E0E0', true: '#4A90E2' }}
              thumbColor={isBiometricEnabled ? '#FFF' : '#FFF'}
            />
          )}
          {renderSettingItem(
            'lock-closed-outline',
            '修改密码',
            '更改登录密码'
          )}
        </View>

        {/* 数据管理 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>数据管理</Text>
          {renderSettingItem(
            'cloud-upload-outline',
            '备份数据',
            '将数据备份到云端',
            handleBackup
          )}
          {renderSettingItem(
            'cloud-download-outline',
            '恢复数据',
            '从备份文件恢复数据',
            handleRestore
          )}
          {renderSettingItem(
            'share-outline',
            '导出数据',
            '导出病历数据',
            handleExport
          )}
          {renderSettingItem(
            'settings-outline',
            '自动备份',
            '定期自动备份数据',
            undefined,
            <Switch
              value={isAutoBackup}
              onValueChange={setIsAutoBackup}
              trackColor={{ false: '#E0E0E0', true: '#4A90E2' }}
              thumbColor={isAutoBackup ? '#FFF' : '#FFF'}
            />
          )}
        </View>

        {/* 系统设置 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>系统设置</Text>
          {renderSettingItem(
            'moon-outline',
            '深色模式',
            '切换深色/浅色主题',
            undefined,
            <Switch
              value={isDarkMode}
              onValueChange={setIsDarkMode}
              trackColor={{ false: '#E0E0E0', true: '#4A90E2' }}
              thumbColor={isDarkMode ? '#FFF' : '#FFF'}
            />
          )}
          {renderSettingItem(
            'notifications-outline',
            '通知设置',
            '管理推送通知'
          )}
          {renderSettingItem(
            'language-outline',
            '语言设置',
            '选择应用语言'
          )}
        </View>

        {/* 其他 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>其他</Text>
          {renderSettingItem(
            'trash-outline',
            '清除缓存',
            '清除应用缓存数据',
            handleClearCache
          )}
          {renderSettingItem(
            'help-circle-outline',
            '使用帮助',
            '查看使用说明'
          )}
          {renderSettingItem(
            'chatbubble-outline',
            '意见反馈',
            '向我们反馈问题',
            handleFeedback
          )}
          {renderSettingItem(
            'shield-checkmark-outline',
            '隐私政策',
            '查看隐私政策',
            handlePrivacy
          )}
          {renderSettingItem(
            'information-circle-outline',
            '关于应用',
            '版本信息和开发者',
            handleAbout
          )}
        </View>

        {/* 版本信息 */}
        <View style={styles.versionInfo}>
          <Text style={styles.versionText}>电子病历夹 v1.0.0</Text>
          <Text style={styles.copyrightText}>© 2024 MediArchive</Text>
        </View>

        <TouchableOpacity style={styles.clearButton} onPress={handleClearAllData}>
          <Text style={styles.clearButtonText}>清除所有数据（测试用）</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  scrollView: {
    flex: 1,
  },
  section: {
    backgroundColor: 'white',
    margin: 16,
    borderRadius: 12,
    padding: 16,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  settingIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F0F8FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  settingText: {
    flex: 1,
  },
  settingTitle: {
    fontSize: 16,
    color: '#333',
    marginBottom: 2,
  },
  settingSubtitle: {
    fontSize: 14,
    color: '#666',
  },
  versionInfo: {
    alignItems: 'center',
    padding: 20,
  },
  versionText: {
    fontSize: 16,
    color: '#666',
    marginBottom: 4,
  },
  copyrightText: {
    fontSize: 12,
    color: '#999',
  },
  clearButton: {
    backgroundColor: '#FF3B30',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 40,
  },
  clearButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
}); 
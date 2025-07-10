import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Switch,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { useAppContext } from '../context/AppContext';
import { UserAvatar } from '../components/UserAvatar';
import { RootStackParamList } from '../types';
import { databaseService } from '../services/database';

type ProfileScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Main'>;

export const ProfileScreen: React.FC = () => {
  const navigation = useNavigation<ProfileScreenNavigationProp>();
  const { currentUser, users, statistics, refreshData } = useAppContext();
  
  const [isDarkMode, setIsDarkMode] = React.useState(false);
  const [isBiometricEnabled, setIsBiometricEnabled] = React.useState(false);

  const handleUserManagement = () => {
    navigation.navigate('UserManagement');
  };

  const handleDataBackup = () => {
    Alert.alert('数据备份', '功能开发中...');
  };

  const handleDataRestore = () => {
    Alert.alert('数据恢复', '功能开发中...');
  };

  const handlePrivacyPolicy = () => {
    Alert.alert('隐私政策', '功能开发中...');
  };

  const handleAbout = () => {
    Alert.alert('关于应用', '电子病历夹 v1.0.0\n\n一个帮助您管理病历记录的移动应用');
  };

  const handleLogout = () => {
    Alert.alert(
      '退出登录',
      '确定要退出登录吗？',
      [
        { text: '取消', style: 'cancel' },
        { text: '退出', style: 'destructive', onPress: () => {} },
      ]
    );
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

  const renderMenuItem = (
    icon: string,
    title: string,
    subtitle?: string,
    onPress?: () => void,
    showArrow: boolean = true,
    rightComponent?: React.ReactNode
  ) => (
    <TouchableOpacity style={styles.menuItem} onPress={onPress}>
      <View style={styles.menuItemLeft}>
        <View style={styles.menuIcon}>
          <Ionicons name={icon as any} size={20} color="#4A90E2" />
        </View>
        <View style={styles.menuText}>
          <Text style={styles.menuTitle}>{title}</Text>
          {subtitle && <Text style={styles.menuSubtitle}>{subtitle}</Text>}
        </View>
      </View>
      <View style={styles.menuItemRight}>
        {rightComponent}
        {showArrow && <Ionicons name="chevron-forward" size={20} color="#CCC" />}
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView}>
        {/* 用户信息卡片 */}
        <View style={styles.userCard}>
          <UserAvatar user={currentUser!} size={80} showName />
          <View style={styles.userStats}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{statistics.totalRecords}</Text>
              <Text style={styles.statLabel}>病历总数</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{statistics.chronicDiseases}</Text>
              <Text style={styles.statLabel}>慢病管理</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{users.length}</Text>
              <Text style={styles.statLabel}>家庭成员</Text>
            </View>
          </View>
        </View>

        {/* 账号设置 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>账号设置</Text>
          <View style={styles.menuGroup}>
            {renderMenuItem(
              'people',
              '家庭成员管理',
              `${users.length}个家庭成员`,
              handleUserManagement
            )}
            {renderMenuItem(
              'key',
              '登录密码',
              '修改登录密码',
              () => Alert.alert('修改密码', '功能开发中...')
            )}
            {renderMenuItem(
              'finger-print',
              '生物识别',
              '指纹/面容解锁',
              undefined,
              false,
              <Switch
                value={isBiometricEnabled}
                onValueChange={setIsBiometricEnabled}
                trackColor={{ false: '#E0E0E0', true: '#4A90E2' }}
                thumbColor={isBiometricEnabled ? '#FFFFFF' : '#FFFFFF'}
              />
            )}
          </View>
        </View>

        {/* 数据管理 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>数据管理</Text>
          <View style={styles.menuGroup}>
            {renderMenuItem(
              'cloud-upload',
              '本地备份',
              '备份病历数据到本地',
              handleDataBackup
            )}
            {renderMenuItem(
              'cloud-download',
              '数据恢复',
              '从备份文件导入数据',
              handleDataRestore
            )}
            {renderMenuItem(
              'trash',
              '清除缓存',
              '清理应用缓存数据',
              () => Alert.alert('清除缓存', '功能开发中...')
            )}
          </View>
        </View>

        {/* 系统设置 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>系统设置</Text>
          <View style={styles.menuGroup}>
            {renderMenuItem(
              'moon',
              '深色模式',
              '切换深色/浅色主题',
              undefined,
              false,
              <Switch
                value={isDarkMode}
                onValueChange={setIsDarkMode}
                trackColor={{ false: '#E0E0E0', true: '#4A90E2' }}
                thumbColor={isDarkMode ? '#FFFFFF' : '#FFFFFF'}
              />
            )}
            {renderMenuItem(
              'notifications',
              '通知设置',
              '管理推送通知',
              () => Alert.alert('通知设置', '功能开发中...')
            )}
            {renderMenuItem(
              'language',
              '语言设置',
              '简体中文',
              () => Alert.alert('语言设置', '功能开发中...')
            )}
          </View>
        </View>

        {/* 其他 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>其他</Text>
          <View style={styles.menuGroup}>
            {renderMenuItem(
              'shield-checkmark',
              '隐私政策',
              '查看数据安全条款',
              handlePrivacyPolicy
            )}
            {renderMenuItem(
              'help-circle',
              '帮助中心',
              '常见问题解答',
              () => Alert.alert('帮助中心', '功能开发中...')
            )}
            {renderMenuItem(
              'information-circle',
              '关于应用',
              '版本信息和开发者',
              handleAbout
            )}
          </View>
        </View>

        {/* 退出登录 */}
        <View style={styles.section}>
          <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
            <Ionicons name="log-out" size={20} color="#FF3B30" />
            <Text style={styles.logoutText}>退出登录</Text>
          </TouchableOpacity>
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
  userCard: {
    backgroundColor: 'white',
    margin: 20,
    borderRadius: 16,
    padding: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  userStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 20,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#4A90E2',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
  },
  statDivider: {
    width: 1,
    backgroundColor: '#E0E0E0',
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginHorizontal: 20,
    marginBottom: 8,
  },
  menuGroup: {
    backgroundColor: 'white',
    marginHorizontal: 20,
    borderRadius: 12,
    overflow: 'hidden',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  menuIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#E3F2FD',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  menuText: {
    flex: 1,
  },
  menuTitle: {
    fontSize: 16,
    color: '#333',
    marginBottom: 2,
  },
  menuSubtitle: {
    fontSize: 12,
    color: '#666',
  },
  menuItemRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'white',
    marginHorizontal: 20,
    paddingVertical: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#FF3B30',
  },
  logoutText: {
    fontSize: 16,
    color: '#FF3B30',
    marginLeft: 8,
    fontWeight: 'bold',
  },
  versionInfo: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  versionText: {
    fontSize: 14,
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
    margin: 20,
  },
  clearButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
}); 
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { useAppContext } from '../context/AppContext';
import { UserAvatar } from '../components/UserAvatar';
import { StatisticsCard } from '../components/StatisticsCard';
import { QuickActionButton } from '../components/QuickActionButton';
import { RootStackParamList } from '../types';
import { Picker } from '@react-native-picker/picker';

type HomeScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Main'>;

export const HomeScreen: React.FC = () => {
  const navigation = useNavigation<HomeScreenNavigationProp>();
  const {
    currentUser,
    users,
    medicalRecords,
    statistics,
    setCurrentUser,
    refreshData,
    isLoading,
    chronicDiseases,
    addMedicalRecord,
  } = useAppContext();
  const [pickerVisible, setPickerVisible] = React.useState(false);
  const [pickerRecord, setPickerRecord] = React.useState<any>(null);
  const [selectedDiseaseId, setSelectedDiseaseId] = React.useState<string | undefined>(undefined);

  const handleUserSwitch = (user: any) => {
    setCurrentUser(user);
  };

  const handleCameraPress = () => {
    if (!currentUser) return;
    navigation.navigate('Camera', { userId: currentUser.id });
  };

  const handleManualEntry = () => {
    if (!currentUser) return;
    navigation.navigate('ManualEntry', { userId: currentUser.id });
  };

  const handleRecordsPress = () => {
    // 切换到病历夹标签页
    navigation.navigate('Main' as any, { screen: 'Records' });
  };

  const handleHealthTrends = () => {
    // 切换到慢病管理标签页
    navigation.navigate('Main' as any, { screen: 'Diseases' });
  };

  const handleUserManagement = () => {
    navigation.navigate('UserManagement');
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('zh-CN', {
      month: 'short',
      day: 'numeric',
    });
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'blood':
        return 'water';
      case 'imaging':
        return 'scan';
      case 'prescription':
        return 'medical';
      case 'diagnosis':
        return 'document-text';
      default:
        return 'document';
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'blood':
        return '#FF6B6B';
      case 'imaging':
        return '#4ECDC4';
      case 'prescription':
        return '#45B7D1';
      case 'diagnosis':
        return '#96CEB4';
      default:
        return '#DDA0DD';
    }
  };

  const handleAssociateDisease = (record: any) => {
    console.log('HomeScreen: 点击关联慢病按钮');
    console.log('HomeScreen: 当前慢病列表:', chronicDiseases);
    console.log('HomeScreen: 慢病数量:', chronicDiseases.length);
    console.log('HomeScreen: 当前用户:', currentUser?.id);
    setPickerRecord(record);
    setSelectedDiseaseId(undefined);
    setPickerVisible(true);
    console.log('HomeScreen: 弹窗状态设置为可见');
  };

  const handleConfirmAssociate = async () => {
    console.log('HomeScreen: 点击确认关联');
    console.log('HomeScreen: pickerRecord:', pickerRecord);
    console.log('HomeScreen: selectedDiseaseId:', selectedDiseaseId);
    
    if (!pickerRecord || !selectedDiseaseId) {
      Alert.alert('提示', '请先选择一个慢病');
      return;
    }
    try {
      await addMedicalRecord({ ...pickerRecord, diseaseId: selectedDiseaseId });
      setPickerVisible(false);
      setPickerRecord(null);
      setSelectedDiseaseId(undefined);
      await refreshData();
      Alert.alert('关联成功', '病历已成功关联到慢病');
    } catch (error) {
      console.error('关联慢病失败:', error);
      Alert.alert('关联失败', '请重试');
    }
  };

  // 只显示未关联慢病的病历
  const recentRecords = [...medicalRecords]
    .filter(r => !r.diseaseId)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 3);

  console.log('HomeScreen: 当前慢病数量:', chronicDiseases.length);
  console.log('HomeScreen: 慢病列表:', chronicDiseases);
  console.log('HomeScreen: pickerVisible状态:', pickerVisible);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={isLoading} onRefresh={refreshData} />
        }
      >
        {/* 顶部导航区 */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.userSection}
            onPress={handleUserManagement}
          >
            <UserAvatar user={currentUser!} size={50} showName />
            <View style={styles.userInfo}>
              <Text style={styles.userName}>{currentUser?.name}</Text>
              <Text style={styles.userRelationship}>
                {currentUser?.relationship === 'self' ? '本人' : '家庭成员'}
              </Text>
            </View>
            <Ionicons name="chevron-down" size={20} color="#666" />
          </TouchableOpacity>
        </View>

        {/* 统计卡片 */}
        <View style={styles.statsContainer}>
          <StatisticsCard
            title="病历总数"
            value={statistics.totalRecords}
            icon="document-text"
            color="#4A90E2"
            onPress={handleRecordsPress}
          />
          <StatisticsCard
            title="慢病管理"
            value={statistics.chronicDiseases}
            icon="heart"
            color="#7ED321"
            onPress={handleHealthTrends}
          />
          <StatisticsCard
            title="待处理提醒"
            value={statistics.pendingReminders}
            icon="notifications"
            color="#F5A623"
            showBadge
            badgeValue={statistics.pendingReminders}
          />
        </View>

        {/* 快捷操作栏 */}
        <View style={styles.quickActionsContainer}>
          <Text style={styles.sectionTitle}>快捷操作</Text>
          <View style={styles.quickActions}>
            <QuickActionButton
              icon="camera"
              title="拍照识别"
              subtitle="AI识别检查单"
              onPress={handleCameraPress}
              color="#FF6B6B"
            />
            <QuickActionButton
              icon="create"
              title="手动录入"
              subtitle="手动填写信息"
              onPress={handleManualEntry}
              color="#4ECDC4"
            />
            <QuickActionButton
              icon="folder"
              title="病历归档"
              subtitle="查看所有记录"
              onPress={handleRecordsPress}
              color="#45B7D1"
            />
            <QuickActionButton
              icon="trending-up"
              title="健康趋势"
              subtitle="查看慢病趋势"
              onPress={handleHealthTrends}
              color="#96CEB4"
            />
          </View>
        </View>

        {/* 家庭成员切换栏 */}
        <View style={styles.familySection}>
          <Text style={styles.sectionTitle}>家庭成员</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={styles.familyContainer}>
              {users.map((user) => (
                <UserAvatar
                  key={user.id}
                  user={user}
                  size={60}
                  showName
                  selected={currentUser?.id === user.id}
                  onPress={() => handleUserSwitch(user)}
                />
              ))}
              <TouchableOpacity
                style={styles.addUserButton}
                onPress={handleUserManagement}
              >
                <Ionicons name="add" size={30} color="#4A90E2" />
                <Text style={styles.addUserText}>添加</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>

        {/* 最近添加病历预览 */}
        <View style={styles.recentSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>待关联慢病的病历</Text>
            <TouchableOpacity onPress={handleRecordsPress}>
              <Text style={styles.seeAllText}>查看全部</Text>
            </TouchableOpacity>
          </View>
          {recentRecords.length > 0 ? (
            recentRecords.map((record) => (
              <TouchableOpacity
                key={record.id}
                style={styles.recordCard}
                onPress={() => navigation.navigate('RecordDetail', { record })}
              >
                <View
                  style={[
                    styles.recordIcon,
                    { backgroundColor: getTypeColor(record.type) },
                  ]}
                >
                  <Ionicons
                    name={getTypeIcon(record.type) as any}
                    size={20}
                    color="white"
                  />
                </View>
                <View style={styles.recordInfo}>
                  <Text style={styles.recordTitle}>{record.title}</Text>
                  <Text style={styles.recordHospital}>{record.hospital}</Text>
                  <Text style={styles.recordDate}>
                    {formatDate(record.date)}
                  </Text>
                </View>
                {record.isAbnormal && (
                  <View style={styles.abnormalBadge}>
                    <Text style={styles.abnormalText}>异常</Text>
                  </View>
                )}
                <TouchableOpacity
                  style={styles.associateButton}
                  onPress={(e) => {
                    e.stopPropagation();
                    handleAssociateDisease(record);
                  }}
                >
                  <Text style={styles.associateButtonText}>关联慢病</Text>
                </TouchableOpacity>
                <Ionicons name="chevron-forward" size={20} color="#CCC" />
              </TouchableOpacity>
            ))
          ) : (
            <View style={styles.emptyState}>
              <Ionicons name="document-outline" size={48} color="#CCC" />
              <Text style={styles.emptyText}>暂无待关联慢病的病历</Text>
              <Text style={styles.emptySubtext}>
                点击上方按钮开始添加病历
              </Text>
            </View>
          )}
        </View>
      </ScrollView>

      {/* 关联慢病弹窗 - 移到ScrollView外部 */}
      {pickerVisible && (
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>选择要关联的慢病</Text>
            {chronicDiseases.length === 0 ? (
              <View style={styles.noDiseasesContainer}>
                <Ionicons name="heart-outline" size={48} color="#CCC" />
                <Text style={styles.noDiseasesText}>暂无慢病</Text>
                <Text style={styles.noDiseasesSubtext}>请先添加慢病</Text>
                <TouchableOpacity 
                  style={styles.addDiseaseButton}
                  onPress={() => {
                    setPickerVisible(false);
                    navigation.navigate('Main' as any, { screen: 'Diseases' });
                  }}
                >
                  <Text style={styles.addDiseaseButtonText}>去添加慢病</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <>
                <Picker
                  selectedValue={selectedDiseaseId}
                  onValueChange={setSelectedDiseaseId}
                  style={styles.picker}
                >
                  <Picker.Item label="请选择慢病" value={undefined} />
                  {chronicDiseases.map(d => (
                    <Picker.Item key={d.id} label={d.name} value={d.id} />
                  ))}
                </Picker>
                <View style={styles.modalButtons}>
                  <TouchableOpacity 
                    style={styles.modalButton} 
                    onPress={() => setPickerVisible(false)}
                  >
                    <Text style={styles.cancelButtonText}>取消</Text>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={[styles.modalButton, styles.confirmButton]} 
                    onPress={handleConfirmAssociate}
                  >
                    <Text style={styles.confirmButtonText}>确定</Text>
                  </TouchableOpacity>
                </View>
              </>
            )}
          </View>
        </View>
      )}
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
  header: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: 'white',
  },
  userSection: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  userInfo: {
    flex: 1,
    marginLeft: 12,
  },
  userName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  userRelationship: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  statsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  quickActionsContainer: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  quickActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  familySection: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  familyContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  addUserButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    borderWidth: 2,
    borderColor: '#4A90E2',
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  addUserText: {
    fontSize: 10,
    color: '#4A90E2',
    marginTop: 2,
  },
  recentSection: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  seeAllText: {
    fontSize: 14,
    color: '#4A90E2',
  },
  recordCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  recordIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  recordInfo: {
    flex: 1,
  },
  recordTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  recordHospital: {
    fontSize: 14,
    color: '#666',
    marginBottom: 2,
  },
  recordDate: {
    fontSize: 12,
    color: '#999',
  },
  abnormalBadge: {
    backgroundColor: '#FF3B30',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginRight: 8,
  },
  abnormalText: {
    fontSize: 10,
    color: 'white',
    fontWeight: 'bold',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    marginTop: 12,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999',
    marginTop: 4,
  },
  associateButton: {
    backgroundColor: '#4A90E2',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    marginRight: 8,
  },
  associateButtonText: {
    fontSize: 12,
    color: 'white',
    fontWeight: 'bold',
  },
  modalOverlay: {
    position: 'absolute',
    left: 0,
    top: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 9999,
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 24,
    width: 320,
    maxWidth: '90%',
    maxHeight: '80%',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  noDiseasesContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  noDiseasesText: {
    fontSize: 16,
    color: '#666',
    marginTop: 12,
  },
  noDiseasesSubtext: {
    fontSize: 14,
    color: '#999',
    marginTop: 4,
  },
  addDiseaseButton: {
    backgroundColor: '#4A90E2',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    marginTop: 16,
  },
  addDiseaseButtonText: {
    fontSize: 12,
    color: 'white',
    fontWeight: 'bold',
  },
  picker: {
    width: '100%',
    height: 50,
    marginBottom: 16,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  modalButton: {
    padding: 12,
    borderRadius: 8,
    marginLeft: 8,
  },
  cancelButtonText: {
    fontSize: 16,
    color: '#666',
  },
  confirmButtonText: {
    fontSize: 16,
    color: '#4A90E2',
    fontWeight: 'bold',
  },
  confirmButton: {
    backgroundColor: '#F0F8FF',
  },
}); 
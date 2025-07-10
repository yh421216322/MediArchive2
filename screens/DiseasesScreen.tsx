import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { useAppContext } from '../context/AppContext';
import { ChronicDisease, RootStackParamList } from '../types';
import { LineChart } from 'react-native-chart-kit';
import { Dimensions } from 'react-native';
import uuid from 'react-native-uuid';
import { Picker } from '@react-native-picker/picker';

type DiseasesScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Main'>;

const screenWidth = Dimensions.get('window').width;

export const DiseasesScreen: React.FC = () => {
  const navigation = useNavigation<DiseasesScreenNavigationProp>();
  const { chronicDiseases, currentUser, addChronicDisease, refreshData } = useAppContext();
  const [addModalVisible, setAddModalVisible] = useState(false);
  const [newDiseaseName, setNewDiseaseName] = useState('');
  const [newDiseaseType, setNewDiseaseType] = useState('hypertension');

  const handleDiseasePress = (disease: ChronicDisease) => {
    navigation.navigate('DiseaseDetail', { disease });
  };

  const handleAddDisease = () => {
    setAddModalVisible(true);
  };

  const handleConfirmAddDisease = async () => {
    if (!newDiseaseName.trim()) {
      Alert.alert('提示', '请填写慢病名称');
      return;
    }
    await addChronicDisease({
      id: uuid.v4() as string,
      userId: currentUser?.id || '',
      name: newDiseaseName,
      type: newDiseaseType,
      indicators: [],
      reminders: [],
      createdAt: new Date().toISOString(),
    });
    setAddModalVisible(false);
    setNewDiseaseName('');
    setNewDiseaseType('hypertension');
    await refreshData();
  };

  const getDiseaseIcon = (type: string) => {
    switch (type) {
      case 'hypertension':
        return 'heart';
      case 'diabetes':
        return 'water';
      case 'asthma':
        return 'airplane';
      case 'heart':
        return 'pulse';
      default:
        return 'medical';
    }
  };

  const getDiseaseColor = (type: string) => {
    switch (type) {
      case 'hypertension':
        return '#FF6B6B';
      case 'diabetes':
        return '#4ECDC4';
      case 'asthma':
        return '#45B7D1';
      case 'heart':
        return '#96CEB4';
      default:
        return '#DDA0DD';
    }
  };

  const getDiseaseLabel = (type: string) => {
    switch (type) {
      case 'hypertension':
        return '高血压';
      case 'diabetes':
        return '糖尿病';
      case 'asthma':
        return '哮喘';
      case 'heart':
        return '心脏病';
      default:
        return '其他';
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('zh-CN', {
      month: 'short',
      day: 'numeric',
    });
  };

  const renderDiseaseItem = ({ item }: { item: ChronicDisease }) => {
    // 获取最新的指标数据用于图表显示
    const latestData = item.indicators.map(indicator => {
      const latestValue = indicator.values[0];
      return {
        name: indicator.name,
        value: latestValue?.value || 0,
        unit: indicator.unit,
        isAbnormal: latestValue?.isAbnormal || false,
      };
    });

    // 准备图表数据
    const chartData = item.indicators.length > 0 ? {
      labels: item.indicators[0].values.slice(0, 7).map(v => formatDate(v.date)),
      datasets: item.indicators.map(indicator => ({
        data: indicator.values.slice(0, 7).map(v => v.value),
        color: (opacity = 1) => getDiseaseColor(item.type),
        strokeWidth: 2,
      })),
    } : null;

    const pendingReminders = (item.reminders || []).filter(r => !r.isCompleted).length;

    return (
      <TouchableOpacity
        style={styles.diseaseItem}
        onPress={() => handleDiseasePress(item)}
      >
        <View style={styles.diseaseHeader}>
          <View
            style={[
              styles.diseaseIcon,
              { backgroundColor: getDiseaseColor(item.type) },
            ]}
          >
            <Ionicons
              name={getDiseaseIcon(item.type) as any}
              size={24}
              color="white"
            />
          </View>
          <View style={styles.diseaseInfo}>
            <Text style={styles.diseaseName}>{item.name}</Text>
            <Text style={styles.diseaseType}>{getDiseaseLabel(item.type)}</Text>
          </View>
          {pendingReminders > 0 && (
            <View style={styles.reminderBadge}>
              <Text style={styles.reminderBadgeText}>{pendingReminders}</Text>
            </View>
          )}
          <Ionicons name="chevron-forward" size={20} color="#CCC" />
        </View>

        {/* 最新指标 */}
        {latestData.length > 0 && (
          <View style={styles.indicatorsSection}>
            <Text style={styles.sectionTitle}>最新指标</Text>
            <View style={styles.indicatorsGrid}>
              {latestData.slice(0, 3).map((indicator, index) => (
                <View key={index} style={styles.indicatorItem}>
                  <Text style={styles.indicatorName}>{indicator.name}</Text>
                  <Text
                    style={[
                      styles.indicatorValue,
                      indicator.isAbnormal && styles.abnormalValue,
                    ]}
                  >
                    {indicator.value} {indicator.unit}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* 趋势图表 */}
        {chartData && (
          <View style={styles.chartSection}>
            <Text style={styles.sectionTitle}>近期趋势</Text>
            <LineChart
              data={chartData}
              width={screenWidth - 80}
              height={120}
              chartConfig={{
                backgroundColor: '#ffffff',
                backgroundGradientFrom: '#ffffff',
                backgroundGradientTo: '#ffffff',
                decimalPlaces: 1,
                color: (opacity = 1) => `rgba(74, 144, 226, ${opacity})`,
                labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
                style: {
                  borderRadius: 16,
                },
                propsForDots: {
                  r: '4',
                  strokeWidth: '2',
                  stroke: getDiseaseColor(item.type),
                },
              }}
              bezier
              style={styles.chart}
            />
          </View>
        )}

        {/* 提醒信息 */}
        {pendingReminders > 0 && (
          <View style={styles.remindersSection}>
            <Text style={styles.sectionTitle}>待处理提醒</Text>
            {(item.reminders || [])
              .filter(r => !r.isCompleted)
              .slice(0, 2)
              .map(reminder => (
                <View key={reminder.id} style={styles.reminderItem}>
                  <Ionicons
                    name={
                      reminder.type === 'medication'
                        ? 'medical'
                        : reminder.type === 'checkup'
                        ? 'calendar'
                        : 'clipboard'
                    }
                    size={16}
                    color="#F5A623"
                  />
                  <Text style={styles.reminderText}>{reminder.title}</Text>
                  <Text style={styles.reminderDate}>
                    {formatDate(reminder.date)}
                  </Text>
                </View>
              ))}
          </View>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>慢病管理</Text>
        <TouchableOpacity style={styles.addButton} onPress={handleAddDisease}>
          <Ionicons name="add" size={24} color="white" />
        </TouchableOpacity>
      </View>

      <FlatList
        data={chronicDiseases}
        renderItem={renderDiseaseItem}
        keyExtractor={(item) => item.id}
        style={styles.list}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Ionicons name="heart-outline" size={64} color="#CCC" />
            <Text style={styles.emptyText}>暂无慢病记录</Text>
            <Text style={styles.emptySubtext}>
              点击右上角按钮添加慢病管理
            </Text>
          </View>
        }
      />

      {/* 添加慢病弹窗 */}
      {addModalVisible && (
        <View style={{ position: 'absolute', left: 0, top: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.3)', justifyContent: 'center', alignItems: 'center', zIndex: 10 }}>
          <View style={{ backgroundColor: 'white', borderRadius: 12, padding: 24, width: 300 }}>
            <Text style={{ fontSize: 18, fontWeight: 'bold', marginBottom: 16 }}>添加慢病</Text>
            <Text style={{ marginBottom: 8 }}>慢病名称</Text>
            <TextInput
              style={{ borderWidth: 1, borderColor: '#E0E0E0', borderRadius: 8, padding: 8, marginBottom: 16 }}
              value={newDiseaseName}
              onChangeText={setNewDiseaseName}
              placeholder="如 高血压、糖尿病"
            />
            <Text style={{ marginBottom: 8 }}>慢病类型</Text>
            <View style={{ borderWidth: 1, borderColor: '#E0E0E0', borderRadius: 8, marginBottom: 16 }}>
              <Picker
                selectedValue={newDiseaseType}
                onValueChange={setNewDiseaseType}
              >
                <Picker.Item label="高血压" value="hypertension" />
                <Picker.Item label="糖尿病" value="diabetes" />
                <Picker.Item label="哮喘" value="asthma" />
                <Picker.Item label="心脏病" value="heart" />
                <Picker.Item label="其他" value="other" />
              </Picker>
            </View>
            <View style={{ flexDirection: 'row', justifyContent: 'flex-end' }}>
              <TouchableOpacity onPress={() => setAddModalVisible(false)} style={{ marginRight: 16 }}>
                <Text style={{ color: '#666', fontSize: 16 }}>取消</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={handleConfirmAddDisease}>
                <Text style={{ color: '#4A90E2', fontSize: 16, fontWeight: 'bold' }}>添加</Text>
              </TouchableOpacity>
            </View>
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  addButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#4A90E2',
    justifyContent: 'center',
    alignItems: 'center',
  },
  list: {
    flex: 1,
  },
  listContent: {
    padding: 20,
  },
  diseaseItem: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  diseaseHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  diseaseIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  diseaseInfo: {
    flex: 1,
  },
  diseaseName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  diseaseType: {
    fontSize: 14,
    color: '#666',
  },
  reminderBadge: {
    backgroundColor: '#FF3B30',
    borderRadius: 12,
    minWidth: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  reminderBadgeText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  indicatorsSection: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  indicatorsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  indicatorItem: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
    marginHorizontal: 4,
  },
  indicatorName: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  indicatorValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
  },
  abnormalValue: {
    color: '#FF3B30',
  },
  chartSection: {
    marginBottom: 16,
  },
  chart: {
    marginVertical: 8,
    borderRadius: 16,
  },
  remindersSection: {
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
    paddingTop: 16,
  },
  reminderItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  reminderText: {
    flex: 1,
    fontSize: 14,
    color: '#333',
    marginLeft: 8,
  },
  reminderDate: {
    fontSize: 12,
    color: '#999',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 18,
    color: '#666',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
  },
}); 
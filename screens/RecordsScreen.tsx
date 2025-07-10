import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { useAppContext } from '../context/AppContext';
import { MedicalRecord, RootStackParamList } from '../types';

type RecordsScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Main'>;

const FILTER_OPTIONS = {
  time: [
    { label: '全部', value: 'all' },
    { label: '近1个月', value: '1month' },
    { label: '近3个月', value: '3months' },
    { label: '近1年', value: '1year' },
  ],
  type: [
    { label: '全部', value: 'all' },
    { label: '检验报告', value: 'blood' },
    { label: '影像检查', value: 'imaging' },
    { label: '处方笺', value: 'prescription' },
    { label: '诊断书', value: 'diagnosis' },
  ],
};

export const RecordsScreen: React.FC = () => {
  const navigation = useNavigation<RecordsScreenNavigationProp>();
  const { medicalRecords, deleteMedicalRecord, currentUser } = useAppContext();
  
  const [searchText, setSearchText] = useState('');
  const [selectedTimeFilter, setSelectedTimeFilter] = useState('all');
  const [selectedTypeFilter, setSelectedTypeFilter] = useState('all');
  const [selectedHospital, setSelectedHospital] = useState('all');

  // 获取所有医院列表
  const hospitals = useMemo(() => {
    const hospitalSet = new Set(medicalRecords.map(record => record.hospital));
    return Array.from(hospitalSet).sort();
  }, [medicalRecords]);

  // 筛选病历记录
  const filteredRecords = useMemo(() => {
    let filtered = medicalRecords;

    // 搜索筛选
    if (searchText) {
      filtered = filtered.filter(record =>
        record.title.toLowerCase().includes(searchText.toLowerCase()) ||
        record.hospital.toLowerCase().includes(searchText.toLowerCase())
      );
    }

    // 时间筛选
    if (selectedTimeFilter !== 'all') {
      const now = new Date();
      const filterDate = new Date();
      
      switch (selectedTimeFilter) {
        case '1month':
          filterDate.setMonth(now.getMonth() - 1);
          break;
        case '3months':
          filterDate.setMonth(now.getMonth() - 3);
          break;
        case '1year':
          filterDate.setFullYear(now.getFullYear() - 1);
          break;
      }
      
      filtered = filtered.filter(record => new Date(record.date) >= filterDate);
    }

    // 类型筛选
    if (selectedTypeFilter !== 'all') {
      filtered = filtered.filter(record => record.type === selectedTypeFilter);
    }

    // 医院筛选
    if (selectedHospital !== 'all') {
      filtered = filtered.filter(record => record.hospital === selectedHospital);
    }

    return filtered.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [medicalRecords, searchText, selectedTimeFilter, selectedTypeFilter, selectedHospital]);

  const handleRecordPress = (record: MedicalRecord) => {
    navigation.navigate('RecordDetail', { record });
  };

  const handleDeleteRecord = (record: MedicalRecord) => {
    Alert.alert(
      '删除病历',
      `确定要删除"${record.title}"吗？`,
      [
        { text: '取消', style: 'cancel' },
        {
          text: '删除',
          style: 'destructive',
          onPress: () => deleteMedicalRecord(record.id),
        },
      ]
    );
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('zh-CN', {
      year: 'numeric',
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

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'blood':
        return '检验报告';
      case 'imaging':
        return '影像检查';
      case 'prescription':
        return '处方笺';
      case 'diagnosis':
        return '诊断书';
      default:
        return '其他';
    }
  };

  const renderFilterButton = (
    label: string,
    value: string,
    selectedValue: string,
    onPress: (value: string) => void
  ) => (
    <TouchableOpacity
      style={[
        styles.filterButton,
        selectedValue === value && styles.filterButtonActive,
      ]}
      onPress={() => onPress(value)}
    >
      <Text
        style={[
          styles.filterButtonText,
          selectedValue === value && styles.filterButtonTextActive,
        ]}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );

  const renderRecordItem = ({ item }: { item: MedicalRecord }) => (
    <TouchableOpacity
      style={styles.recordItem}
      onPress={() => handleRecordPress(item)}
    >
      <View
        style={[
          styles.recordIcon,
          { backgroundColor: getTypeColor(item.type) },
        ]}
      >
        <Ionicons
          name={getTypeIcon(item.type) as any}
          size={20}
          color="white"
        />
      </View>
      <View style={styles.recordContent}>
        <View style={styles.recordHeader}>
          <Text style={styles.recordTitle} numberOfLines={1}>
            {item.title}
          </Text>
          <TouchableOpacity
            style={styles.deleteButton}
            onPress={() => handleDeleteRecord(item)}
          >
            <Ionicons name="trash-outline" size={16} color="#FF3B30" />
          </TouchableOpacity>
        </View>
        <Text style={styles.recordHospital}>{item.hospital}</Text>
        <View style={styles.recordFooter}>
          <Text style={styles.recordType}>{getTypeLabel(item.type)}</Text>
          <Text style={styles.recordDate}>{formatDate(item.date)}</Text>
        </View>
        {item.keyIndicators && item.keyIndicators.length > 0 && (
          <View style={styles.indicatorsContainer}>
            {item.keyIndicators.slice(0, 3).map((indicator, index) => (
              <Text key={index} style={styles.indicator}>
                {indicator.name}: {indicator.value} {indicator.unit}
              </Text>
            ))}
            {item.keyIndicators.length > 3 && (
              <Text style={styles.moreIndicators}>
                +{item.keyIndicators.length - 3}项指标
              </Text>
            )}
          </View>
        )}
        {item.isAbnormal && (
          <View style={styles.abnormalBadge}>
            <Text style={styles.abnormalText}>异常</Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* 搜索栏 */}
      <View style={styles.searchContainer}>
        <View style={styles.searchInputContainer}>
          <Ionicons name="search" size={20} color="#666" />
          <TextInput
            style={styles.searchInput}
            placeholder="搜索病历标题或医院..."
            value={searchText}
            onChangeText={setSearchText}
          />
          {searchText.length > 0 && (
            <TouchableOpacity onPress={() => setSearchText('')}>
              <Ionicons name="close-circle" size={20} color="#666" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* 筛选栏 */}
      <View style={styles.filtersContainer}>
        <Text style={styles.filterTitle}>时间筛选</Text>
        <View style={styles.filterRow}>
          {FILTER_OPTIONS.time.map((option, index) => (
            <View key={`time-${option.value}`}>
              {renderFilterButton(
                option.label,
                option.value,
                selectedTimeFilter,
                setSelectedTimeFilter
              )}
            </View>
          ))}
        </View>

        <Text style={styles.filterTitle}>类型筛选</Text>
        <View style={styles.filterRow}>
          {FILTER_OPTIONS.type.map((option, index) => (
            <View key={`type-${option.value}`}>
              {renderFilterButton(
                option.label,
                option.value,
                selectedTypeFilter,
                setSelectedTypeFilter
              )}
            </View>
          ))}
        </View>

        {hospitals.length > 0 && (
          <>
            <Text style={styles.filterTitle}>医院筛选</Text>
            <View style={styles.filterRow}>
              <View key="hospital-all">
                {renderFilterButton(
                  '全部医院',
                  'all',
                  selectedHospital,
                  setSelectedHospital
                )}
              </View>
              {hospitals.slice(0, 3).map((hospital, index) => (
                <View key={`hospital-${hospital}`}>
                  {renderFilterButton(
                    hospital,
                    hospital,
                    selectedHospital,
                    setSelectedHospital
                  )}
                </View>
              ))}
            </View>
          </>
        )}
      </View>

      {/* 病历列表 */}
      <FlatList
        data={filteredRecords}
        renderItem={renderRecordItem}
        keyExtractor={(item) => item.id}
        style={styles.list}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Ionicons name="document-outline" size={64} color="#CCC" />
            <Text style={styles.emptyText}>暂无病历记录</Text>
            <Text style={styles.emptySubtext}>
              {searchText || selectedTimeFilter !== 'all' || selectedTypeFilter !== 'all'
                ? '尝试调整筛选条件'
                : '开始添加您的第一份病历'}
            </Text>
          </View>
        }
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  searchContainer: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: 'white',
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0F0F0',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 16,
    color: '#333',
  },
  filtersContainer: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  filterTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
    marginTop: 12,
  },
  filterRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  filterButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#F0F0F0',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  filterButtonActive: {
    backgroundColor: '#4A90E2',
    borderColor: '#4A90E2',
  },
  filterButtonText: {
    fontSize: 12,
    color: '#666',
  },
  filterButtonTextActive: {
    color: 'white',
    fontWeight: 'bold',
  },
  list: {
    flex: 1,
  },
  listContent: {
    padding: 20,
  },
  recordItem: {
    flexDirection: 'row',
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    elevation: 2,
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
  recordContent: {
    flex: 1,
  },
  recordHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 4,
  },
  recordTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
    marginRight: 8,
  },
  deleteButton: {
    padding: 4,
  },
  recordHospital: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  recordFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  recordType: {
    fontSize: 12,
    color: '#4A90E2',
    backgroundColor: '#E3F2FD',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  recordDate: {
    fontSize: 12,
    color: '#999',
  },
  indicatorsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
    marginBottom: 8,
  },
  indicator: {
    fontSize: 11,
    color: '#666',
    backgroundColor: '#F5F5F5',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  moreIndicators: {
    fontSize: 11,
    color: '#999',
    fontStyle: 'italic',
  },
  abnormalBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#FF3B30',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  abnormalText: {
    fontSize: 10,
    color: 'white',
    fontWeight: 'bold',
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
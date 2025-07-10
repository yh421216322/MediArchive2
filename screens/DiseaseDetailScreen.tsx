import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Modal,
  FlatList,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../types';
import { useAppContext } from '../context/AppContext';
import { LineChart } from 'react-native-chart-kit';

type DiseaseDetailScreenRouteProp = RouteProp<RootStackParamList, 'DiseaseDetail'>;
type DiseaseDetailScreenNavigationProp = StackNavigationProp<RootStackParamList, 'DiseaseDetail'>;

interface DataPoint {
  date: string;
  value: number;
  recordTitle: string;
  hospital: string;
  isAbnormal: boolean;
}

export const DiseaseDetailScreen: React.FC = () => {
  const navigation = useNavigation<DiseaseDetailScreenNavigationProp>();
  const route = useRoute<DiseaseDetailScreenRouteProp>();
  const { medicalRecords } = useAppContext();
  const { disease } = route.params as any;
  
  const [selectedIndicators, setSelectedIndicators] = useState<string[]>([]);
  const [showIndicatorSelector, setShowIndicatorSelector] = useState(false);
  const [availableIndicators, setAvailableIndicators] = useState<string[]>([]);
  const [indicatorData, setIndicatorData] = useState<Record<string, DataPoint[]>>({});
  
  const screenWidth = Dimensions.get('window').width;

  if (!disease) {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={{ color: 'red', margin: 20 }}>未找到慢病详情数据！</Text>
      </SafeAreaView>
    );
  }

  // 使用useMemo缓存过滤结果，避免无限循环
  const diseaseRecords = useMemo(() => {
    return disease ? medicalRecords.filter(r => r.diseaseId === disease.id) : [];
  }, [disease?.id, medicalRecords]);
  
  // 按日期分组
  const grouped = useMemo(() => {
    return diseaseRecords.reduce((acc, rec) => {
      const day = rec.date;
      if (!acc[day]) acc[day] = [];
      acc[day].push(rec);
      return acc;
    }, {} as Record<string, typeof diseaseRecords>);
  }, [diseaseRecords]);
  
  const sortedDays = useMemo(() => {
    return Object.keys(grouped).sort((a, b) => new Date(b).getTime() - new Date(a).getTime());
  }, [grouped]);

  // 收集所有可用的指标 - 从慢病管理的指标数据中获取
  useEffect(() => {
    console.log('🔍 开始收集慢病管理指标...');
    console.log('🔍 慢病指标数量:', disease.indicators?.length || 0);
    console.log('🔍 慢病指标详情:', disease.indicators);
    
    const indicators = new Set<string>();
    
    // 1. 从慢病管理指标中收集
    if (disease.indicators && disease.indicators.length > 0) {
      disease.indicators.forEach(indicator => {
        console.log('🔍 发现慢病管理指标:', indicator.name);
        indicators.add(indicator.name);
      });
    }
    
    // 2. 从病历记录中收集指标
    console.log('🔍 慢病没有管理指标，尝试从病历记录中收集...');
    diseaseRecords.forEach(record => {
      console.log('🔍 处理病历:', record.title, '指标数量:', record.keyIndicators?.length || 0);
      if (record.keyIndicators) {
        record.keyIndicators.forEach(indicator => {
          console.log('🔍 发现病历指标:', indicator.name);
          indicators.add(indicator.name);
        });
      }
    });
    
    const availableIndicatorsArray = Array.from(indicators);
    console.log('🔍 最终可用指标:', availableIndicatorsArray);
    setAvailableIndicators(availableIndicatorsArray);
  }, [disease.indicators, diseaseRecords]);

  // 加强数据过滤和日志
  useEffect(() => {
    if (selectedIndicators.length === 0) {
      setIndicatorData({});
      return;
    }
    const data: Record<string, DataPoint[]> = {};
    selectedIndicators.forEach(indicatorName => {
      const points: DataPoint[] = [];
      const diseaseIndicator = disease.indicators?.find(indicator => indicator.name === indicatorName);
      if (diseaseIndicator && diseaseIndicator.values) {
        diseaseIndicator.values.forEach(value => {
          points.push({
            date: value.date,
            value: value.value,
            recordTitle: `${disease.name} - ${indicatorName}`,
            hospital: '慢病管理',
            isAbnormal: value.isAbnormal,
          });
        });
      } else {
        diseaseRecords.forEach(record => {
          if (record.keyIndicators) {
            record.keyIndicators.forEach(indicator => {
              if (indicator.name === indicatorName) {
                const value = parseFloat(indicator.value);
                if (!isNaN(value) && isFinite(value)) {
                  points.push({
                    date: record.date,
                    value: value,
                    recordTitle: record.title,
                    hospital: record.hospital,
                    isAbnormal: indicator.isAbnormal,
                  });
                }
              }
            });
          }
        });
      }
      // 按日期排序
      points.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
      data[indicatorName] = points;
    });
    setIndicatorData(data);
    console.log('【最终indicatorData】', data);
  }, [selectedIndicators, disease.indicators, diseaseRecords]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const formatChartDate = (dateString: string) => {
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

  const handleAddReminder = () => {
    Alert.alert('添加提醒', '功能开发中...');
  };

  const handleEditDisease = () => {
    Alert.alert('编辑慢病', '功能开发中...');
  };

  const handleSelectIndicators = () => {
    setShowIndicatorSelector(true);
  };

  const handleIndicatorToggle = (indicatorName: string) => {
    console.log('🔍 点击指标:', indicatorName);
    console.log('🔍 当前选中指标:', selectedIndicators);
    
    setSelectedIndicators(prev => {
      const newSelection = prev.includes(indicatorName) 
        ? prev.filter(name => name !== indicatorName)
        : [...prev, indicatorName];
      
      console.log('🔍 新的选中指标:', newSelection);
      return newSelection;
    });
  };

  const getChartData = (indicatorName: string) => {
    const points = indicatorData[indicatorName] || [];
    console.log('【原始points】', points);
    // 只保留合法数值
    const validPoints = points.filter(
      p => typeof p.value === 'number' && isFinite(p.value) && !isNaN(p.value)
    );
    console.log('【过滤后validPoints】', validPoints);
    if (validPoints.length === 0) {
      return {
        labels: [],
        datasets: [{ data: [] }]
      };
    }
    const labels = validPoints.map(p => formatChartDate(p.date));
    const data = validPoints.map(p => p.value);
    if (labels.length !== data.length) {
      console.warn('【警告】labels和data长度不一致', labels, data);
      return {
        labels: [],
        datasets: [{ data: [] }]
      };
    }
    return {
      labels,
      datasets: [{ data }]
    };
  };

  const getChartConfig = () => {
    return {
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
        stroke: '#4A90E2',
        fill: '#ffffff',
      },
      propsForBackgroundLines: {
        strokeDasharray: '',
        stroke: '#E0E0E0',
        strokeWidth: 1,
      },
    };
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView}>
        {/* 基本信息 */}
        <View style={styles.section}>
          <View style={styles.header}>
            <View style={styles.diseaseIcon}>
              <Ionicons name="heart" size={32} color="white" />
            </View>
            <View style={styles.diseaseInfo}>
              <Text style={styles.diseaseName}>{disease.name}</Text>
              <Text style={styles.diseaseType}>高血压</Text>
            </View>
          </View>
        </View>

        {/* 指标趋势图表 */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>指标趋势</Text>
            <TouchableOpacity onPress={handleSelectIndicators} style={styles.selectButton}>
              <Ionicons name="options-outline" size={20} color="#4A90E2" />
              <Text style={styles.selectButtonText}>选择指标</Text>
            </TouchableOpacity>
          </View>
          
          {selectedIndicators.length === 0 ? (
            <View style={styles.emptyChart}>
              <Ionicons name="analytics-outline" size={48} color="#CCC" />
              <Text style={styles.emptyText}>请选择要显示的指标</Text>
              <TouchableOpacity onPress={handleSelectIndicators} style={styles.selectIndicatorButton}>
                <Text style={styles.selectIndicatorButtonText}>选择指标</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.chartsContainer}>
              {selectedIndicators.map(indicatorName => {
                const points = indicatorData[indicatorName] || [];
                const chartData = getChartData(indicatorName);
                const chartWidth = Math.max(screenWidth, (chartData.labels.length || 1) * 60);
                const hasData = chartData.labels.length > 0 && chartData.datasets[0].data.length > 0;
                return (
                  <View key={indicatorName} style={styles.chartCard}>
                    <View style={styles.chartHeader}>
                      <Text style={styles.chartTitle}>{indicatorName}</Text>
                      <Text style={styles.chartSubtitle}>{points.length} 个数据点</Text>
                    </View>
                    {hasData ? (
                      <ScrollView horizontal showsHorizontalScrollIndicator>
                        <LineChart
                          data={chartData}
                          width={chartWidth}
                          height={180}
                          chartConfig={getChartConfig()}
                          bezier
                          style={styles.chart}
                        />
                      </ScrollView>
                    ) : (
                      <View style={styles.noDataChart}>
                        <Text style={styles.noDataText}>暂无有效数据</Text>
                      </View>
                    )}
                    <TouchableOpacity
                      style={styles.viewTrendButton}
                      onPress={() => navigation.navigate('IndicatorTrend', { indicatorName })}
                    >
                      <Text style={styles.viewTrendButtonText}>查看详细趋势</Text>
                      <Ionicons name="chevron-forward" size={16} color="#4A90E2" />
                    </TouchableOpacity>
                  </View>
                );
              })}
            </View>
          )}
        </View>

        {/* 指标数据 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>指标数据</Text>
          {disease.indicators.map((indicator, index) => (
            <View key={index} style={styles.indicatorCard}>
              <View style={styles.indicatorHeader}>
                <Text style={styles.indicatorName}>{indicator.name}</Text>
                <Text style={styles.normalRange}>
                  正常范围: {indicator.normalRange} {indicator.unit}
                </Text>
              </View>
              <View style={styles.valuesContainer}>
                {indicator.values.map((value, valueIndex) => (
                  <View key={valueIndex} style={styles.valueItem}>
                    <Text style={styles.valueDate}>{formatDate(value.date)}</Text>
                    <Text
                      style={[
                        styles.valueText,
                        value.isAbnormal && styles.abnormalValue,
                      ]}
                    >
                      {value.value} {indicator.unit}
                    </Text>
                    {value.isAbnormal && (
                      <Ionicons name="warning" size={16} color="#FF3B30" />
                    )}
                  </View>
                ))}
              </View>
            </View>
          ))}
        </View>

        {/* 健康提醒 */}
        <View style={styles.section}>
          <View style={styles.reminderHeader}>
            <Text style={styles.sectionTitle}>健康提醒</Text>
            <TouchableOpacity onPress={handleAddReminder}>
              <Ionicons name="add" size={24} color="#4A90E2" />
            </TouchableOpacity>
          </View>
          {disease.reminders.map((reminder) => (
            <View key={reminder.id} style={styles.reminderCard}>
              <View style={styles.reminderContent}>
                <Ionicons
                  name={
                    reminder.type === 'medication'
                      ? 'medical'
                      : reminder.type === 'checkup'
                      ? 'calendar'
                      : 'clipboard'
                  }
                  size={20}
                  color="#4A90E2"
                />
                <View style={styles.reminderText}>
                  <Text style={styles.reminderTitle}>{reminder.title}</Text>
                  <Text style={styles.reminderDescription}>
                    {reminder.description}
                  </Text>
                  <Text style={styles.reminderDate}>
                    {formatDate(reminder.date)}
                  </Text>
                </View>
              </View>
              <TouchableOpacity
                style={[
                  styles.reminderStatus,
                  reminder.isCompleted && styles.completedStatus,
                ]}
              >
                <Ionicons
                  name={reminder.isCompleted ? 'checkmark' : 'ellipse-outline'}
                  size={20}
                  color={reminder.isCompleted ? 'white' : '#4A90E2'}
                />
              </TouchableOpacity>
            </View>
          ))}
        </View>

        {/* 操作按钮 */}
        <View style={styles.actions}>
          <TouchableOpacity style={styles.actionButton} onPress={handleEditDisease}>
            <Ionicons name="create-outline" size={20} color="#4A90E2" />
            <Text style={styles.actionText}>编辑</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.actionButton}>
            <Ionicons name="share-outline" size={20} color="#4A90E2" />
            <Text style={styles.actionText}>分享</Text>
          </TouchableOpacity>
        </View>

        {/* 检查记录时间轴 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>检查记录时间轴</Text>
          {sortedDays.length === 0 ? (
            <View style={styles.emptyTimeline}>
              <Ionicons name="document-outline" size={48} color="#CCC" />
              <Text style={styles.emptyText}>暂无挂载病历</Text>
              <Text style={styles.emptySubtext}>关联病历后将在此显示时间轴</Text>
            </View>
          ) : (
            <View style={styles.timelineContainer}>
              {sortedDays.map((day, dayIndex) => (
                <View key={day} style={styles.timelineDay}>
                  {/* 时间轴日期节点 */}
                  <View style={styles.timelineDateNode}>
                    <View style={styles.timelineDot} />
                    <Text style={styles.timelineDateText}>{formatDate(day)}</Text>
                    {dayIndex < sortedDays.length - 1 && <View style={styles.timelineLine} />}
                  </View>
                  
                  {/* 该日期的所有病历记录 */}
                  <View style={styles.timelineRecords}>
                    {grouped[day].map((record, recordIndex) => (
                      <TouchableOpacity
                        key={record.id}
                        style={styles.timelineRecordCard}
                        onPress={() => navigation.navigate('RecordDetail', { record })}
                      >
                        <View style={styles.recordHeader}>
                          <View style={[
                            styles.recordTypeIcon,
                            { backgroundColor: getTypeColor(record.type) }
                          ]}>
                            <Ionicons
                              name={getTypeIcon(record.type) as any}
                              size={16}
                              color="white"
                            />
                          </View>
                          <View style={styles.recordInfo}>
                            <Text style={styles.recordTitle}>{record.title}</Text>
                            <Text style={styles.recordHospital}>{record.hospital}</Text>
                          </View>
                          <Ionicons name="chevron-forward" size={16} color="#CCC" />
                        </View>
                        
                        {record.description && (
                          <Text style={styles.recordDescription} numberOfLines={2}>
                            {record.description}
                          </Text>
                        )}
                        
                        {record.keyIndicators && record.keyIndicators.length > 0 && (
                          <View style={styles.indicatorsPreview}>
                            <Text style={styles.indicatorsTitle}>关键指标：</Text>
                            <View style={styles.indicatorsList}>
                              {record.keyIndicators.slice(0, 3).map((indicator, idx) => (
                                <TouchableOpacity
                                  key={idx}
                                  style={styles.indicatorTag}
                                  onPress={() => navigation.navigate('IndicatorTrend', { indicatorName: indicator.name })}
                                >
                                  <Text style={styles.indicatorText}>
                                    {indicator.name}: {indicator.value} {indicator.unit}
                                  </Text>
                                </TouchableOpacity>
                              ))}
                              {record.keyIndicators.length > 3 && (
                                <Text style={styles.moreIndicators}>
                                  还有 {record.keyIndicators.length - 3} 项...
                                </Text>
                              )}
                            </View>
                          </View>
                        )}
                        
                        {record.isAbnormal && (
                          <View style={styles.abnormalBadge}>
                            <Ionicons name="warning" size={12} color="white" />
                            <Text style={styles.abnormalText}>异常</Text>
                          </View>
                        )}
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              ))}
            </View>
          )}
        </View>

        {/* 指标选择器Modal */}
        <Modal
          visible={showIndicatorSelector}
          animationType="slide"
          transparent={true}
          onRequestClose={() => setShowIndicatorSelector(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>选择要显示的指标</Text>
                <TouchableOpacity onPress={() => setShowIndicatorSelector(false)}>
                  <Ionicons name="close" size={24} color="#333" />
                </TouchableOpacity>
              </View>
              
              {/* 精简调试信息，仅顶部显示 */}
              <View style={styles.debugInfo}>
                <Text style={styles.debugText}>可用指标: {availableIndicators.length}，慢病记录: {diseaseRecords.length}</Text>
                <Text style={styles.debugText}>慢病: {disease?.name}</Text>
              </View>
              <View style={{height: 320, marginVertical: 8}}>
                {availableIndicators.length === 0 ? (
                  <View style={styles.emptyIndicatorList}>
                    <Ionicons name="analytics-outline" size={48} color="#CCC" />
                    <Text style={styles.emptyText}>暂无可用指标</Text>
                    <Text style={styles.emptySubtext}>
                      请确保该慢病下有包含指标的病历记录
                    </Text>
                  </View>
                ) : (
                  <FlatList
                    data={availableIndicators}
                    keyExtractor={(item) => item}
                    renderItem={({ item }) => (
                      <TouchableOpacity
                        style={[
                          styles.indicatorOption,
                          selectedIndicators.includes(item) && { backgroundColor: '#E6F0FA' }
                        ]}
                        onPress={() => handleIndicatorToggle(item)}
                      >
                        <View style={styles.indicatorOptionContent}>
                          <Text style={styles.indicatorOptionText}>{item}</Text>
                          <Ionicons
                            name={selectedIndicators.includes(item) ? 'checkmark-circle' : 'ellipse-outline'}
                            size={24}
                            color={selectedIndicators.includes(item) ? '#4A90E2' : '#CCC'}
                          />
                        </View>
                      </TouchableOpacity>
                    )}
                    style={styles.indicatorList}
                    showsVerticalScrollIndicator={true}
                  />
                )}
              </View>
              
              <View style={styles.modalFooter}>
                <TouchableOpacity
                  style={styles.modalButton}
                  onPress={() => setShowIndicatorSelector(false)}
                >
                  <Text style={styles.modalButtonText}>确定</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  diseaseIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#FF6B6B',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  diseaseInfo: {
    flex: 1,
  },
  diseaseName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  diseaseType: {
    fontSize: 16,
    color: '#666',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  indicatorCard: {
    marginBottom: 16,
    padding: 12,
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
  },
  indicatorHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  indicatorName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  normalRange: {
    fontSize: 12,
    color: '#666',
  },
  valuesContainer: {
    gap: 8,
  },
  valueItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  valueDate: {
    fontSize: 14,
    color: '#666',
  },
  valueText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  abnormalValue: {
    color: '#FF3B30',
  },
  reminderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  reminderCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  reminderContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  reminderText: {
    marginLeft: 12,
    flex: 1,
  },
  reminderTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  reminderDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  reminderDate: {
    fontSize: 12,
    color: '#999',
  },
  reminderStatus: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#4A90E2',
    justifyContent: 'center',
    alignItems: 'center',
  },
  completedStatus: {
    backgroundColor: '#4A90E2',
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
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
  actionButton: {
    alignItems: 'center',
  },
  actionText: {
    fontSize: 12,
    color: '#4A90E2',
    marginTop: 4,
  },
  timelineContainer: {
    flex: 1,
  },
  timelineDay: {
    marginBottom: 24,
    paddingLeft: 20,
  },
  timelineDateNode: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  timelineDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#4A90E2',
    marginRight: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  timelineDateText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  timelineLine: {
    position: 'absolute',
    left: 6,
    top: 12,
    width: 2,
    height: 40,
    backgroundColor: '#E0E0E0',
  },
  timelineRecords: {
    marginLeft: 24,
  },
  timelineRecordCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  recordHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  recordTypeIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
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
  },
  recordDescription: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    marginBottom: 8,
  },
  indicatorsPreview: {
    marginTop: 8,
  },
  indicatorsTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 6,
  },
  indicatorsList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  indicatorTag: {
    backgroundColor: '#F0F8FF',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E0F0FF',
  },
  indicatorText: {
    fontSize: 11,
    color: '#4A90E2',
    fontWeight: '500',
  },
  moreIndicators: {
    fontSize: 11,
    color: '#999',
    fontStyle: 'italic',
  },
  abnormalBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FF3B30',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
    marginTop: 8,
  },
  abnormalText: {
    fontSize: 11,
    fontWeight: 'bold',
    color: 'white',
    marginLeft: 4,
  },
  emptyTimeline: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#666',
    marginTop: 12,
    marginBottom: 4,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  selectButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#F0F8FF',
    borderRadius: 8,
  },
  selectButtonText: {
    fontSize: 14,
    color: '#4A90E2',
    marginLeft: 4,
  },
  emptyChart: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  chartsContainer: {
    gap: 16,
  },
  chartCard: {
    padding: 16,
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  chartHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  chartTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  chartSubtitle: {
    fontSize: 12,
    color: '#666',
  },
  chart: {
    marginVertical: 8,
    borderRadius: 8,
  },
  noDataChart: {
    height: 180,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F0F0F0',
    borderRadius: 8,
  },
  noDataText: {
    fontSize: 14,
    color: '#666',
  },
  selectIndicatorButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: '#4A90E2',
    borderRadius: 8,
  },
  selectIndicatorButtonText: {
    fontSize: 14,
    color: 'white',
    fontWeight: 'bold',
  },
  viewTrendButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 8,
    marginTop: 8,
  },
  viewTrendButtonText: {
    fontSize: 14,
    color: '#4A90E2',
    marginRight: 4,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 12,
    width: '80%',
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  indicatorOption: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  indicatorOptionContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  indicatorOptionText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  indicatorList: {
    flex: 1,
  },
  modalFooter: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 16,
  },
  modalButton: {
    padding: 12,
    borderRadius: 8,
    backgroundColor: '#4A90E2',
  },
  modalButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: 'white',
  },
  debugInfo: {
    marginBottom: 16,
  },
  debugText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  emptyIndicatorList: {
    alignItems: 'center',
    paddingVertical: 40,
  },
}); 
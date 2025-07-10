import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../types';
import { useAppContext } from '../context/AppContext';
import { LineChart } from 'react-native-chart-kit';

type IndicatorTrendScreenRouteProp = RouteProp<RootStackParamList, 'IndicatorTrend'>;
type IndicatorTrendScreenNavigationProp = StackNavigationProp<RootStackParamList, 'IndicatorTrend'>;

interface DataPoint {
  date: string;
  value: number;
  recordTitle: string;
  hospital: string;
  isAbnormal: boolean;
}

export const IndicatorTrendScreen: React.FC = () => {
  const navigation = useNavigation<IndicatorTrendScreenNavigationProp>();
  const route = useRoute<IndicatorTrendScreenRouteProp>();
  const { medicalRecords } = useAppContext();
  const { indicatorName } = route.params;
  
  const [dataPoints, setDataPoints] = useState<DataPoint[]>([]);
  const [selectedTimeRange, setSelectedTimeRange] = useState<'1M' | '3M' | '6M' | '1Y' | 'ALL'>('6M');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadIndicatorData();
  }, [indicatorName, selectedTimeRange]);

  const loadIndicatorData = () => {
    setIsLoading(true);
    
    try {
      // 收集所有包含该指标的病历记录
      const allDataPoints: DataPoint[] = [];
      
      medicalRecords.forEach(record => {
        if (record.keyIndicators) {
          record.keyIndicators.forEach(indicator => {
            if (indicator.name === indicatorName) {
              const value = parseFloat(indicator.value);
              if (!isNaN(value)) {
                allDataPoints.push({
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

      // 按日期排序
      allDataPoints.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

      // 根据选择的时间范围过滤数据
      const filteredData = filterDataByTimeRange(allDataPoints, selectedTimeRange);
      
      setDataPoints(filteredData);
    } catch (error) {
      console.error('加载指标数据失败:', error);
      Alert.alert('错误', '加载数据失败');
    } finally {
      setIsLoading(false);
    }
  };

  const filterDataByTimeRange = (data: DataPoint[], range: string): DataPoint[] => {
    if (range === 'ALL') return data;
    
    const now = new Date();
    let cutoffDate: Date;
    
    switch (range) {
      case '1M':
        cutoffDate = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
        break;
      case '3M':
        cutoffDate = new Date(now.getFullYear(), now.getMonth() - 3, now.getDate());
        break;
      case '6M':
        cutoffDate = new Date(now.getFullYear(), now.getMonth() - 6, now.getDate());
        break;
      case '1Y':
        cutoffDate = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
        break;
      default:
        return data;
    }
    
    return data.filter(point => new Date(point.date) >= cutoffDate);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('zh-CN', {
      month: 'short',
      day: 'numeric',
    });
  };

  const getNormalRange = () => {
    // 这里可以根据指标名称返回正常范围
    const ranges: Record<string, { min: number; max: number; unit: string }> = {
      '白细胞': { min: 3.5, max: 9.5, unit: '10^9/L' },
      '红细胞': { min: 3.8, max: 5.1, unit: '10^12/L' },
      '血红蛋白': { min: 115, max: 150, unit: 'g/L' },
      '血小板': { min: 125, max: 350, unit: '10^9/L' },
      '血糖': { min: 3.9, max: 6.1, unit: 'mmol/L' },
      '血压': { min: 90, max: 140, unit: 'mmHg' },
    };
    
    return ranges[indicatorName] || { min: 0, max: 100, unit: '' };
  };

  const normalRange = getNormalRange();

  const getChartData = () => {
    if (dataPoints.length === 0) return {
      labels: [],
      datasets: [{ data: [] }]
    };
    const validPoints = dataPoints.filter(
      p => typeof p.value === 'number' && isFinite(p.value) && !isNaN(p.value)
    );
    if (validPoints.length === 0) return {
      labels: [],
      datasets: [{ data: [] }]
    };
    // 数据点少时全部显示label，否则稀疏
    const N = 5;
    const labels = validPoints.map((p, i) => {
      if (validPoints.length <= 6 || i === 0 || i === validPoints.length - 1 || i % N === 0) {
        return formatDate(p.date);
      }
      return '';
    });
    const data = validPoints.map(point => point.value);
    if (labels.length !== data.length) {
      console.warn('【警告】labels和data长度不一致', labels, data);
      return {
        labels: [],
        datasets: [{ data: [] }]
      };
    }
    return {
      labels,
      datasets: [
        {
          data,
          color: (opacity = 1) => `rgba(74, 144, 226, ${opacity})`,
          strokeWidth: 3,
        },
      ],
    };
  };

  const chartConfig = {
    backgroundColor: '#ffffff',
    backgroundGradientFrom: '#ffffff',
    backgroundGradientTo: '#ffffff',
    decimalPlaces: 1,
    color: (opacity = 1) => `rgba(74, 144, 226, ${opacity})`,
    labelColor: (opacity = 1) => `rgba(51, 51, 51, 1)`, // 深色
    style: {
      borderRadius: 16,
      marginBottom: 24, // 增加底部空间
    },
    propsForLabels: {
      fontSize: 14, // 增大字体
      fontWeight: 'bold',
    },
    propsForDots: {
      r: '5',
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

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{indicatorName} 趋势</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.content}>
        {/* 时间范围选择 */}
        <View style={styles.timeRangeContainer}>
          <Text style={styles.sectionTitle}>时间范围</Text>
          <View style={styles.timeRangeButtons}>
            {(['1M', '3M', '6M', '1Y', 'ALL'] as const).map(range => (
              <TouchableOpacity
                key={range}
                style={[
                  styles.timeRangeButton,
                  selectedTimeRange === range && styles.timeRangeButtonActive,
                ]}
                onPress={() => setSelectedTimeRange(range)}
              >
                <Text
                  style={[
                    styles.timeRangeButtonText,
                    selectedTimeRange === range && styles.timeRangeButtonTextActive,
                  ]}
                >
                  {range === '1M' ? '1个月' : 
                   range === '3M' ? '3个月' : 
                   range === '6M' ? '6个月' : 
                   range === '1Y' ? '1年' : '全部'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* 正常范围信息 */}
        <View style={styles.normalRangeContainer}>
          <Text style={styles.sectionTitle}>正常范围</Text>
          <View style={styles.normalRangeInfo}>
            <Text style={styles.normalRangeText}>
              {normalRange.min} - {normalRange.max} {normalRange.unit}
            </Text>
          </View>
        </View>

        {/* 趋势图表 */}
        <View style={styles.chartContainer}>
          <Text style={styles.sectionTitle}>变化趋势</Text>
          {isLoading ? (
            <View style={styles.loadingContainer}>
              <Text style={styles.loadingText}>加载中...</Text>
            </View>
          ) : dataPoints.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Ionicons name="analytics-outline" size={48} color="#CCC" />
              <Text style={styles.emptyText}>暂无数据</Text>
              <Text style={styles.emptySubtext}>
                在所选时间范围内没有找到 {indicatorName} 的检查记录
              </Text>
            </View>
          ) : (
            <>
              <View style={styles.chartWrapper}>
                <ScrollView horizontal showsHorizontalScrollIndicator>
                  <LineChart
                    data={getChartData()}
                    width={Math.max(Dimensions.get('window').width - 64, getChartData().labels.length * 80)}
                    height={220}
                    yAxisLabel=""
                    yAxisSuffix={` ${normalRange.unit}`}
                    chartConfig={chartConfig}
                    bezier
                    style={[styles.chart, { marginBottom: 48 }]}
                    withDots={true}
                    withShadow={false}
                    withInnerLines={true}
                    withOuterLines={true}
                    withVerticalLines={false}
                    withHorizontalLines={true}
                    withVerticalLabels={true}
                    withHorizontalLabels={true}
                    fromZero={false}
                  />
                </ScrollView>
                <View style={styles.chartLegend}>
                  <View style={styles.legendItem}>
                    <View style={[styles.legendDot, { backgroundColor: '#4A90E2' }]} />
                    <Text style={styles.legendText}>实际数值</Text>
                  </View>
                  <View style={styles.legendItem}>
                    <View style={[styles.legendDot, { backgroundColor: '#FF3B30' }]} />
                    <Text style={styles.legendText}>异常数值</Text>
                  </View>
                  <View style={styles.legendItem}>
                    <View style={[styles.legendDot, { backgroundColor: '#4CAF50' }]} />
                    <Text style={styles.legendText}>正常范围: {normalRange.min}-{normalRange.max}</Text>
                  </View>
                </View>
              </View>
              
              {/* 统计信息 */}
              <View style={styles.statsContainer}>
                <Text style={styles.statsTitle}>统计信息</Text>
                <View style={styles.statsGrid}>
                  <View style={styles.statItem}>
                    <Text style={styles.statLabel}>平均值</Text>
                    <Text style={styles.statValue}>
                      {(dataPoints.reduce((sum, point) => sum + point.value, 0) / dataPoints.length).toFixed(1)} {normalRange.unit}
                    </Text>
                  </View>
                  <View style={styles.statItem}>
                    <Text style={styles.statLabel}>最高值</Text>
                    <Text style={styles.statValue}>
                      {Math.max(...dataPoints.map(p => p.value))} {normalRange.unit}
                    </Text>
                  </View>
                  <View style={styles.statItem}>
                    <Text style={styles.statLabel}>最低值</Text>
                    <Text style={styles.statValue}>
                      {Math.min(...dataPoints.map(p => p.value))} {normalRange.unit}
                    </Text>
                  </View>
                  <View style={styles.statItem}>
                    <Text style={styles.statLabel}>异常次数</Text>
                    <Text style={[styles.statValue, { color: '#FF3B30' }]}>
                      {dataPoints.filter(p => p.isAbnormal).length} 次
                    </Text>
                  </View>
                </View>
                
                {/* 趋势分析 */}
                <View style={styles.trendAnalysis}>
                  <Text style={styles.trendTitle}>趋势分析</Text>
                  {(() => {
                    if (dataPoints.length < 2) {
                      return <Text style={styles.trendText}>数据点不足，无法分析趋势</Text>;
                    }
                    
                    const firstValue = dataPoints[0].value;
                    const lastValue = dataPoints[dataPoints.length - 1].value;
                    const change = lastValue - firstValue;
                    const changePercent = (change / firstValue) * 100;
                    
                    let trendText = '';
                    let trendColor = '#333';
                    
                    if (change > 0) {
                      trendText = `上升 ${change.toFixed(1)} ${normalRange.unit} (${changePercent.toFixed(1)}%)`;
                      trendColor = '#FF3B30';
                    } else if (change < 0) {
                      trendText = `下降 ${Math.abs(change).toFixed(1)} ${normalRange.unit} (${Math.abs(changePercent).toFixed(1)}%)`;
                      trendColor = '#4CAF50';
                    } else {
                      trendText = '保持稳定';
                      trendColor = '#666';
                    }
                    
                    return <Text style={[styles.trendText, { color: trendColor }]}>{trendText}</Text>;
                  })()}
                </View>
              </View>
            </>
          )}
        </View>

        {/* 数据点列表 */}
        <View style={styles.dataPointsContainer}>
          <Text style={styles.sectionTitle}>检查记录</Text>
          {dataPoints.map((point, index) => (
            <View key={index} style={styles.dataPointItem}>
              <View style={styles.dataPointHeader}>
                <Text style={styles.dataPointDate}>{formatDate(point.date)}</Text>
                <View style={[
                  styles.dataPointValue,
                  point.isAbnormal && styles.abnormalValue
                ]}>
                  <Text style={[
                    styles.valueText,
                    point.isAbnormal && styles.abnormalValueText
                  ]}>
                    {point.value} {normalRange.unit}
                  </Text>
                  {point.isAbnormal && (
                    <Ionicons name="warning" size={16} color="#FF3B30" />
                  )}
                </View>
              </View>
              <Text style={styles.dataPointTitle}>{point.recordTitle}</Text>
              <Text style={styles.dataPointHospital}>{point.hospital}</Text>
            </View>
          ))}
        </View>
      </ScrollView>
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
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  content: {
    flex: 1,
  },
  timeRangeContainer: {
    backgroundColor: 'white',
    margin: 16,
    padding: 16,
    borderRadius: 12,
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
    marginBottom: 12,
  },
  timeRangeButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  timeRangeButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    backgroundColor: 'white',
  },
  timeRangeButtonActive: {
    backgroundColor: '#4A90E2',
    borderColor: '#4A90E2',
  },
  timeRangeButtonText: {
    fontSize: 14,
    color: '#666',
  },
  timeRangeButtonTextActive: {
    color: 'white',
    fontWeight: 'bold',
  },
  normalRangeContainer: {
    backgroundColor: 'white',
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 16,
    borderRadius: 12,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  normalRangeInfo: {
    alignItems: 'center',
  },
  normalRangeText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#4A90E2',
  },
  chartContainer: {
    backgroundColor: 'white',
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 16,
    borderRadius: 12,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  loadingContainer: {
    height: 220,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
  },
  emptyContainer: {
    height: 220,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#666',
    marginTop: 12,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    marginTop: 4,
  },
  chartWrapper: {
    marginBottom: 0,
  },
  chart: {
    marginVertical: 8,
    borderRadius: 16,
  },
  chartSubtext: {
    fontSize: 14,
    color: '#999',
  },
  dataPointsContainer: {
    backgroundColor: 'white',
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 16,
    borderRadius: 12,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  dataPointItem: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  dataPointHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  dataPointDate: {
    fontSize: 14,
    color: '#666',
  },
  dataPointValue: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  valueText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginRight: 4,
  },
  abnormalValue: {
    backgroundColor: '#FFF5F5',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  abnormalValueText: {
    color: '#FF3B30',
  },
  dataPointTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 2,
  },
  dataPointHospital: {
    fontSize: 14,
    color: '#666',
  },
  chartLegend: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  legendDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 4,
  },
  legendText: {
    fontSize: 14,
    color: '#666',
  },
  statsContainer: {
    marginTop: 24,
    backgroundColor: 'white',
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 16,
    borderRadius: 12,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  statsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  statItem: {
    width: '50%',
  },
  statLabel: {
    fontSize: 14,
    color: '#666',
  },
  statValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  trendAnalysis: {
    marginTop: 16,
  },
  trendTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  trendText: {
    fontSize: 14,
    color: '#666',
  },
}); 
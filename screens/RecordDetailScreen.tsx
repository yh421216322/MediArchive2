import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../types';

type RecordDetailScreenRouteProp = RouteProp<RootStackParamList, 'RecordDetail'>;
type RecordDetailScreenNavigationProp = StackNavigationProp<RootStackParamList, 'RecordDetail'>;

export const RecordDetailScreen: React.FC = () => {
  const navigation = useNavigation<RecordDetailScreenNavigationProp>();
  const route = useRoute<RecordDetailScreenRouteProp>();
  const { record } = route.params as any;

  if (!record) {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={{ color: 'red', margin: 20 }}>未找到病历详情数据！</Text>
      </SafeAreaView>
    );
  }

  // 兼容旧数据
  const descriptionLines = record.description ? record.description.split('\n') : [];
  const chiefComplaint = descriptionLines.find((line: string) => line.startsWith('主诉')) || '';
  const treatment = descriptionLines.find((line: string) => line.startsWith('处置')) || '';
  const advice = descriptionLines.find((line: string) => line.startsWith('医嘱')) || '';

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

  const handleShare = () => {
    Alert.alert('分享', '功能开发中...');
  };

  const handleEdit = () => {
    Alert.alert('编辑', '功能开发中...');
  };

  const handleDelete = () => {
    Alert.alert(
      '删除病历',
      '确定要删除这份病历吗？',
      [
        { text: '取消', style: 'cancel' },
        { text: '删除', style: 'destructive', onPress: () => navigation.goBack() },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView}>
        <View style={styles.section}>
          <Text style={styles.title}>{record.title}</Text>
          <Text style={styles.hospital}>医院：{record.hospital}</Text>
          <Text style={styles.date}>日期：{record.date}</Text>
          {/* 主诉 */}
          {(record.chief_complaint || chiefComplaint) && (
            <Text style={styles.description}>
              主诉：{record.chief_complaint || chiefComplaint.replace('主诉：', '')}
            </Text>
          )}
          {/* 诊断 */}
          {record.diagnosis && (
            <Text style={styles.description}>诊断：{record.diagnosis}</Text>
          )}
          {/* 处置 */}
          {(record.treatment || treatment) && (
            <Text style={styles.description}>
              处置：{record.treatment || treatment.replace('处置：', '')}
            </Text>
          )}
          {/* 医嘱 */}
          {(record.advice || advice) && (
            <Text style={styles.description}>
              医嘱：{record.advice || advice.replace('医嘱：', '')}
            </Text>
          )}
          {/* 关键指标 */}
          {record.keyIndicators && record.keyIndicators.length > 0 && (
            <View style={styles.indicatorsContainer}>
              <Text style={styles.sectionTitle}>关键指标</Text>
              {record.keyIndicators.map((indicator: any, idx: number) => (
                <TouchableOpacity
                  key={idx}
                  style={styles.indicatorItem}
                  onPress={() => navigation.navigate('IndicatorTrend', { indicatorName: indicator.name })}
                >
                  <View style={styles.indicatorContent}>
                    <Text style={styles.indicatorText}>
                      {indicator.name}：{indicator.value} {indicator.unit}
                    </Text>
                    {indicator.isAbnormal && (
                      <View style={styles.abnormalBadge}>
                        <Ionicons name="warning" size={12} color="white" />
                        <Text style={styles.abnormalText}>异常</Text>
                      </View>
                    )}
                  </View>
                  <Ionicons name="chevron-forward" size={16} color="#CCC" />
                </TouchableOpacity>
              ))}
            </View>
          )}
          {/* 备注说明（兼容旧数据） */}
          {record.description && (
            <Text style={styles.description}>备注：{record.description}</Text>
          )}
        </View>
        {/* 操作按钮区（可选） */}
        <View style={styles.actions}>
          <TouchableOpacity style={styles.actionButton} onPress={handleShare}>
            <Ionicons name="share-outline" size={20} color="#4A90E2" />
            <Text style={styles.actionText}>分享</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButton} onPress={handleEdit}>
            <Ionicons name="create-outline" size={20} color="#4A90E2" />
            <Text style={styles.actionText}>编辑</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButton} onPress={handleDelete}>
            <Ionicons name="trash-outline" size={20} color="#FF3B30" />
            <Text style={[styles.actionText, { color: '#FF3B30' }]}>删除</Text>
          </TouchableOpacity>
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
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  hospital: {
    fontSize: 16,
    color: '#666',
    marginBottom: 4,
  },
  date: {
    fontSize: 14,
    color: '#999',
    marginBottom: 12,
  },
  description: {
    fontSize: 14,
    color: '#333',
    marginBottom: 8,
    lineHeight: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#4A90E2',
    marginTop: 12,
    marginBottom: 4,
  },
  indicatorsContainer: {
    marginTop: 8,
    marginBottom: 8,
  },
  indicatorItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
  },
  indicatorContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  indicatorText: {
    fontSize: 13,
    color: '#666',
    marginRight: 8,
  },
  abnormalBadge: {
    backgroundColor: '#FF3B30',
    borderRadius: 12,
    padding: 2,
  },
  abnormalText: {
    fontSize: 10,
    color: 'white',
    fontWeight: 'bold',
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
}); 
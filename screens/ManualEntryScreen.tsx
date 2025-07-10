import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../types';
import { useAppContext } from '../context/AppContext';
import uuid from 'uuid';
import { Picker } from '@react-native-picker/picker';

type ManualEntryScreenRouteProp = RouteProp<RootStackParamList, 'ManualEntry'>;
type ManualEntryScreenNavigationProp = StackNavigationProp<RootStackParamList, 'ManualEntry'>;

export const ManualEntryScreen: React.FC = () => {
  const navigation = useNavigation<ManualEntryScreenNavigationProp>();
  const route = useRoute<ManualEntryScreenRouteProp>();
  const { chronicDiseases, currentUser, addMedicalRecord } = useAppContext();
  
  const [title, setTitle] = useState('');
  const [hospital, setHospital] = useState('');
  const [type, setType] = useState('blood');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [description, setDescription] = useState('');
  const [selectedDiseaseId, setSelectedDiseaseId] = useState<string | undefined>(undefined);

  const handleSave = () => {
    if (!title || !hospital) {
      Alert.alert('提示', '请填写标题和医院名称');
      return;
    }
    
    addMedicalRecord({
      id: uuid.v4() as string,
      userId: currentUser.id,
      title,
      hospital,
      type,
      date,
      description,
      diseaseId: selectedDiseaseId,
      keyIndicators: [],
      isAbnormal: false,
      createdAt: new Date().toISOString(),
    });

    Alert.alert('保存成功', '病历已保存到病历夹', [
      { text: '确定', onPress: () => navigation.goBack() },
    ]);
  };

  const typeOptions = [
    { value: 'blood', label: '检验报告' },
    { value: 'imaging', label: '影像检查' },
    { value: 'prescription', label: '处方笺' },
    { value: 'diagnosis', label: '诊断书' },
    { value: 'other', label: '其他' },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView}>
        <View style={styles.form}>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>病历标题 *</Text>
            <TextInput
              style={styles.input}
              value={title}
              onChangeText={setTitle}
              placeholder="请输入病历标题"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>医院名称 *</Text>
            <TextInput
              style={styles.input}
              value={hospital}
              onChangeText={setHospital}
              placeholder="请输入医院名称"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>检查类型</Text>
            <View style={styles.typeContainer}>
              {typeOptions.map((option) => (
                <TouchableOpacity
                  key={option.value}
                  style={[
                    styles.typeButton,
                    type === option.value && styles.typeButtonActive,
                  ]}
                  onPress={() => setType(option.value)}
                >
                  <Text
                    style={[
                      styles.typeButtonText,
                      type === option.value && styles.typeButtonTextActive,
                    ]}
                  >
                    {option.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>检查日期</Text>
            <TextInput
              style={styles.input}
              value={date}
              onChangeText={setDate}
              placeholder="YYYY-MM-DD"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>备注说明</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={description}
              onChangeText={setDescription}
              placeholder="请输入备注说明"
              multiline
              numberOfLines={4}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>关联慢病（可选）</Text>
            <View style={styles.typeContainer}>
              <Picker
                selectedValue={selectedDiseaseId}
                onValueChange={setSelectedDiseaseId}
                style={{ flex: 1 }}
              >
                <Picker.Item label="不挂载慢病" value={undefined} />
                {chronicDiseases.map(d => (
                  <Picker.Item key={d.id} label={d.name} value={d.id} />
                ))}
              </Picker>
            </View>
          </View>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
          <Ionicons name="checkmark" size={20} color="white" />
          <Text style={styles.saveButtonText}>保存病历</Text>
        </TouchableOpacity>
      </View>
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
  form: {
    padding: 20,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  input: {
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  typeContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  typeButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F0F0F0',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  typeButtonActive: {
    backgroundColor: '#4A90E2',
    borderColor: '#4A90E2',
  },
  typeButtonText: {
    fontSize: 14,
    color: '#666',
  },
  typeButtonTextActive: {
    color: 'white',
    fontWeight: 'bold',
  },
  footer: {
    padding: 20,
    backgroundColor: 'white',
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#4A90E2',
    paddingVertical: 16,
    borderRadius: 8,
  },
  saveButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
}); 
import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Image,
  TextInput,
  ScrollView,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import axios from 'axios';
import { useAppContext } from '../context/AppContext';
import uuid from 'react-native-uuid';
import { Picker } from '@react-native-picker/picker';

const ARK_API_KEY = '4cf0e488-1e7e-44e3-9cf1-7a63713ce6d0'; // TODO: 替换为你的火山引擎API Key
const ARK_MODEL_ID = 'doubao-seed-1-6-250615'; // TODO: 替换为你的火山引擎模型ID

interface RecognizedData {
  title: string;
  hospital: string;
  name: string;
  gender: string;
  age: string;
  date: string;
  chief_complaint: string;
  diagnosis: string;
  treatment: string;
  advice: string;
  indicators: Array<{name: string; value: string; unit: string}>;
}

export const CameraScreen: React.FC = () => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [image, setImage] = useState<string | null>(null);
  const { currentUser, addMedicalRecord, chronicDiseases, allIndicatorNames, medicalRecords } = useAppContext();
  const [selectedDiseaseId, setSelectedDiseaseId] = useState<string | undefined>(undefined);
  
  // 识别结果确认相关状态
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [recognizedData, setRecognizedData] = useState<RecognizedData | null>(null);
  const [editingData, setEditingData] = useState<RecognizedData | null>(null);

  // 智能补全：模糊匹配历史指标名
  function getMatchedIndicatorNames(input: string, usedNames: string[]) {
    if (!input) return allIndicatorNames.filter(n => !usedNames.includes(n));
    return allIndicatorNames.filter(n => n.includes(input) && !usedNames.includes(n));
  }

  // 智能联动：获取最近一次该指标的单位
  function getLastUnitForName(name: string): string {
    for (let i = medicalRecords.length - 1; i >= 0; i--) {
      const rec = medicalRecords[i];
      if (rec.keyIndicators) {
        const found = rec.keyIndicators.find(k => k.name === name && k.unit);
        if (found) return found.unit;
      }
    }
    return '';
  }

  // 拍照
  const handleTakePhoto = async () => {
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 1,
    });
    if (!result.canceled) {
      setImage(result.assets[0].uri);
      recognizeImage(result.assets[0].uri);
    }
  };

  // 从相册选图
  const handleSelectFromGallery = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 1,
    });
    if (!result.canceled) {
      setImage(result.assets[0].uri);
      recognizeImage(result.assets[0].uri);
    }
  };

  // 识别图片内容
  const recognizeImage = async (imageUri: string) => {
    try {
      setIsProcessing(true);
      // 读取图片为base64
      const base64 = await (await fetch(imageUri)).blob().then(blobToBase64);
      const imageFormat = imageUri.endsWith('.png') ? 'png' : 'jpeg';
      const imageBase64 = `data:image/${imageFormat};base64,${base64}`;
      const apiUrl = 'https://ark.cn-beijing.volces.com/api/v1/chat/completions';
      const prompt = `\n请识别这张医院门诊病历单，提取以下字段并返回标准JSON（字段缺失时请留空）：\n{\n  "title": "", // 检查单据的名称，如"血常规结果"、"血液分析报告"、"门诊病历单"等\n  "hospital": "",\n  "name": "",\n  "gender": "",\n  "age": "",\n  "date": "", // 请提取病历上的实际日期，格式为YYYY-MM-DD\n  "chief_complaint": "",\n  "diagnosis": "",\n  "treatment": "",\n  "advice": "",\n  "indicators": [\n    {"name": "", "value": "", "unit": ""}\n  ]\n}\n请务必填写title字段，title字段请填写本单据最能代表其类型的名称，如"血常规结果"、"血液分析报告"、"门诊病历单"等。date字段请提取病历上的实际检查日期或就诊日期，格式为YYYY-MM-DD。只返回JSON，不要多余解释。\n`;
      const body = {
        model: ARK_MODEL_ID,
        messages: [
          {
            role: 'user',
            content: [
              { type: 'image_url', image_url: { url: imageBase64 } },
              { type: 'text', text: prompt }
            ]
          }
        ]
      };
      const response = await axios.post(apiUrl, body, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${ARK_API_KEY}`,
        },
      });
      const resultText = response.data.choices[0].message.content;
      // 只提取JSON部分
      let data;
      try {
        data = JSON.parse(resultText);
      } catch {
        const match = resultText.match(/\{[\s\S]*\}/);
        data = match ? JSON.parse(match[0]) : {};
      }
      if (currentUser && data) {
        // 处理日期格式，优先使用识别到的日期
        const recognizedDate = normalizeDate(data.date);
        const recordDate = recognizedDate || new Date().toISOString().slice(0, 10);
        
        console.log('CameraScreen: 识别到的原始日期:', data.date);
        console.log('CameraScreen: 标准化后的日期:', recordDate);
        
        // 设置识别数据并显示确认界面
        const processedData: RecognizedData = {
          title: data.title || '',
          hospital: data.hospital || '',
          name: data.name || '',
          gender: data.gender || '',
          age: data.age || '',
          date: recordDate,
          chief_complaint: data.chief_complaint || '',
          diagnosis: data.diagnosis || '',
          treatment: data.treatment || '',
          advice: data.advice || '',
          indicators: Array.isArray(data.indicators) ? data.indicators.filter((i: any) => i.name) : [],
        };
        
        setRecognizedData(processedData);
        setEditingData(processedData);
        setShowConfirmModal(true);
      } else {
        Alert.alert('识别失败', '未能识别出有效内容');
      }
    } catch (e) {
      Alert.alert('识别失败', String(e));
    } finally {
      setIsProcessing(false);
    }
  };

  // 标准化日期格式
  function normalizeDate(dateString: string): string | null {
    if (!dateString) return null;
    
    try {
      // 移除多余的空格
      const cleanDate = dateString.trim();
      
      // 如果已经是YYYY-MM-DD格式，直接返回
      if (/^\d{4}-\d{2}-\d{2}$/.test(cleanDate)) {
        return cleanDate;
      }
      
      // 处理常见的日期格式
      // 1. YYYY年MM月DD日
      const match1 = cleanDate.match(/(\d{4})年(\d{1,2})月(\d{1,2})日/);
      if (match1) {
        const year = match1[1];
        const month = match1[2].padStart(2, '0');
        const day = match1[3].padStart(2, '0');
        return `${year}-${month}-${day}`;
      }
      
      // 2. YYYY/MM/DD 或 YYYY.MM.DD
      const match2 = cleanDate.match(/(\d{4})[\/\.](\d{1,2})[\/\.](\d{1,2})/);
      if (match2) {
        const year = match2[1];
        const month = match2[2].padStart(2, '0');
        const day = match2[3].padStart(2, '0');
        return `${year}-${month}-${day}`;
      }
      
      // 3. MM/DD/YYYY
      const match3 = cleanDate.match(/(\d{1,2})[\/\.](\d{1,2})[\/\.](\d{4})/);
      if (match3) {
        const month = match3[1].padStart(2, '0');
        const day = match3[2].padStart(2, '0');
        const year = match3[3];
        return `${year}-${month}-${day}`;
      }
      
      // 4. 尝试解析为Date对象
      const date = new Date(cleanDate);
      if (!isNaN(date.getTime())) {
        return date.toISOString().slice(0, 10);
      }
      
      return null;
    } catch (error) {
      console.log('日期解析失败:', dateString, error);
      return null;
    }
  }

  // 辅助：blob转base64
  function blobToBase64(blob: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve((reader.result as string).split(',')[1]);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  }

  // 智能兜底命名
  function guessTitle(data: any) {
    if (data.title) return data.title;
    if (data.chief_complaint) return data.chief_complaint;
    if (data.diagnosis) return data.diagnosis;
    if (Array.isArray(data.indicators)) {
      const names = data.indicators.map((i: any) => i.name).join(',');
      if (/白细胞|红细胞|血红蛋白|血小板/.test(names)) return '血常规结果';
      if (/血压|收缩压|舒张压/.test(names)) return '血压测量';
      if (/血糖|葡萄糖/.test(names)) return '血糖检测';
      if (/尿常规/.test(names)) return '尿常规结果';
      // 可继续扩展
    }
    if (data.hospital && data.date) return `${data.hospital} ${data.date}`;
    return '门诊病历';
  }

  // 智能判断病历类型
  function guessType(data: any): 'blood' | 'imaging' | 'prescription' | 'diagnosis' | 'other' {
    const title = (data.title || '').toLowerCase();
    const description = (data.description || '').toLowerCase();
    const indicators = Array.isArray(data.indicators) ? data.indicators.map((i: any) => i.name).join(',').toLowerCase() : '';
    
    // 血常规相关
    if (/血常规|血细胞|白细胞|红细胞|血红蛋白|血小板|血液分析/.test(title + description + indicators)) {
      return 'blood';
    }
    
    // 影像检查相关
    if (/ct|核磁|mri|x光|b超|彩超|超声|影像|放射/.test(title + description)) {
      return 'imaging';
    }
    
    // 处方相关
    if (/处方|用药|药物|剂量|用法/.test(title + description)) {
      return 'prescription';
    }
    
    // 诊断相关
    if (/诊断|病历|门诊|住院|出院/.test(title + description)) {
      return 'diagnosis';
    }
    
    return 'other';
  }

  // 处理确认界面的保存
  const handleConfirmSave = async () => {
    if (!editingData || !currentUser) return;
    
    try {
      const newRecord = {
        id: uuid.v4() as string,
        userId: currentUser.id,
        title: editingData.title || guessTitle(editingData),
        hospital: editingData.hospital,
        type: guessType(editingData),
        date: editingData.date,
        imageUri: image!,
        description: [
          editingData.chief_complaint && `主诉：${editingData.chief_complaint}`,
          editingData.treatment && `处置：${editingData.treatment}`,
          editingData.advice && `医嘱：${editingData.advice}`
        ].filter(Boolean).join('\n'),
        keyIndicators: editingData.indicators.filter(i => i.name && i.value).map(i => ({
          ...i,
          isAbnormal: false,
          normalRange: ''
        })),
        isAbnormal: false,
        createdAt: new Date().toISOString(),
      };

      await addMedicalRecord({ ...newRecord, diseaseId: selectedDiseaseId });
      
      // 重置状态
      setShowConfirmModal(false);
      setRecognizedData(null);
      setEditingData(null);
      setSelectedDiseaseId(undefined);
      setImage(null);
      
      Alert.alert('保存成功', '病历已成功保存！');
    } catch (error) {
      console.error('保存失败:', error);
      Alert.alert('保存失败', '请重试');
    }
  };

  // 处理取消
  const handleCancel = () => {
    setShowConfirmModal(false);
    setRecognizedData(null);
    setEditingData(null);
    setSelectedDiseaseId(undefined);
    setImage(null);
  };

  // 更新编辑数据
  const updateEditingData = (field: keyof RecognizedData, value: string) => {
    if (!editingData) return;
    setEditingData({ ...editingData, [field]: value });
  };

  // 更新指标数据
  const updateIndicator = (index: number, field: 'name' | 'value' | 'unit', value: string) => {
    if (!editingData) return;
    const newIndicators = [...editingData.indicators];
    newIndicators[index] = { ...newIndicators[index], [field]: value };
    setEditingData({ ...editingData, indicators: newIndicators });
  };

  // 添加新指标
  const addIndicator = () => {
    if (!editingData) return;
    const newIndicators = [...editingData.indicators, { name: '', value: '', unit: '' }];
    setEditingData({ ...editingData, indicators: newIndicators });
  };

  // 删除指标
  const removeIndicator = (index: number) => {
    if (!editingData) return;
    const newIndicators = editingData.indicators.filter((_, i) => i !== index);
    setEditingData({ ...editingData, indicators: newIndicators });
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        {isProcessing ? (
          <View style={styles.processingContainer}>
            <ActivityIndicator size="large" color="#4A90E2" />
            <Text style={styles.processingText}>正在识别中...</Text>
            <Text style={styles.processingSubtext}>请稍候，AI正在分析您的检查单</Text>
          </View>
        ) : (
          <>
            <View style={styles.cameraPreview}>
              {image ? (
                <Image source={{ uri: image }} style={{ width: 200, height: 200, margin: 20 }} />
              ) : (
                <>
                  <Ionicons name="camera" size={80} color="#CCC" />
                  <Text style={styles.cameraText}>点击下方按钮拍照</Text>
                  <Text style={styles.cameraSubtext}>将检查单放在取景框内</Text>
                </>
              )}
            </View>
            <View style={styles.controls}>
              <TouchableOpacity
                style={styles.captureButton}
                onPress={handleTakePhoto}
              >
                <View style={styles.captureButtonInner}>
                  <Ionicons name="camera" size={32} color="white" />
                </View>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.galleryButton}
                onPress={handleSelectFromGallery}
              >
                <Ionicons name="images" size={24} color="#4A90E2" />
                <Text style={styles.galleryText}>从相册选择</Text>
              </TouchableOpacity>
            </View>
          </>
        )}
      </View>

      {/* 识别结果确认界面 */}
      <Modal
        visible={showConfirmModal}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>确认识别结果</Text>
            <TouchableOpacity onPress={handleCancel}>
              <Ionicons name="close" size={24} color="#666" />
            </TouchableOpacity>
          </View>
          
          <ScrollView style={styles.modalContent}>
            {editingData && (
              <>
                {/* 基本信息 */}
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>基本信息</Text>
                  
                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>病历标题</Text>
                    <TextInput
                      style={styles.textInput}
                      value={editingData.title}
                      onChangeText={(text) => updateEditingData('title', text)}
                      placeholder="请输入病历标题"
                    />
                  </View>
                  
                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>医院名称</Text>
                    <TextInput
                      style={styles.textInput}
                      value={editingData.hospital}
                      onChangeText={(text) => updateEditingData('hospital', text)}
                      placeholder="请输入医院名称"
                    />
                  </View>
                  
                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>检查日期</Text>
                    <TextInput
                      style={styles.textInput}
                      value={editingData.date}
                      onChangeText={(text) => updateEditingData('date', text)}
                      placeholder="YYYY-MM-DD"
                    />
                  </View>
                </View>

                {/* 患者信息 */}
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>患者信息</Text>
                  
                  <View style={styles.row}>
                    <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
                      <Text style={styles.inputLabel}>姓名</Text>
                      <TextInput
                        style={styles.textInput}
                        value={editingData.name}
                        onChangeText={(text) => updateEditingData('name', text)}
                        placeholder="患者姓名"
                      />
                    </View>
                    
                    <View style={[styles.inputGroup, { flex: 1, marginLeft: 8 }]}>
                      <Text style={styles.inputLabel}>性别</Text>
                      <TextInput
                        style={styles.textInput}
                        value={editingData.gender}
                        onChangeText={(text) => updateEditingData('gender', text)}
                        placeholder="性别"
                      />
                    </View>
                  </View>
                  
                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>年龄</Text>
                    <TextInput
                      style={styles.textInput}
                      value={editingData.age}
                      onChangeText={(text) => updateEditingData('age', text)}
                      placeholder="年龄"
                    />
                  </View>
                </View>

                {/* 医疗信息 */}
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>医疗信息</Text>
                  
                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>主诉</Text>
                    <TextInput
                      style={[styles.textInput, styles.textArea]}
                      value={editingData.chief_complaint}
                      onChangeText={(text) => updateEditingData('chief_complaint', text)}
                      placeholder="患者主诉"
                      multiline
                      numberOfLines={3}
                    />
                  </View>
                  
                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>诊断</Text>
                    <TextInput
                      style={[styles.textInput, styles.textArea]}
                      value={editingData.diagnosis}
                      onChangeText={(text) => updateEditingData('diagnosis', text)}
                      placeholder="医生诊断"
                      multiline
                      numberOfLines={3}
                    />
                  </View>
                  
                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>处置</Text>
                    <TextInput
                      style={[styles.textInput, styles.textArea]}
                      value={editingData.treatment}
                      onChangeText={(text) => updateEditingData('treatment', text)}
                      placeholder="处置方案"
                      multiline
                      numberOfLines={3}
                    />
                  </View>
                  
                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>医嘱</Text>
                    <TextInput
                      style={[styles.textInput, styles.textArea]}
                      value={editingData.advice}
                      onChangeText={(text) => updateEditingData('advice', text)}
                      placeholder="医生医嘱"
                      multiline
                      numberOfLines={3}
                    />
                  </View>
                </View>

                {/* 关键指标 */}
                <View style={styles.section}>
                  <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>关键指标</Text>
                    <TouchableOpacity onPress={addIndicator} style={styles.addButton}>
                      <Ionicons name="add" size={20} color="#4A90E2" />
                      <Text style={styles.addButtonText}>添加指标</Text>
                    </TouchableOpacity>
                  </View>
                  
                  {editingData.indicators.map((indicator, index) => {
                    // 本条病历已用名，避免重复
                    const usedNames = editingData.indicators.map((i, idx) => idx !== index ? i.name : '').filter(Boolean);
                    const matchedNames = getMatchedIndicatorNames(indicator.name, usedNames);
                    return (
                      <View key={index} style={styles.indicatorItem}>
                        <View style={styles.indicatorRow}>
                          <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}> 
                            <Text style={styles.inputLabel}>指标名称</Text>
                            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                              <ScrollView style={{ maxHeight: 120, flex: 1 }} keyboardShouldPersistTaps="handled">
                                <TextInput
                                  style={[styles.textInput, { flex: 1 }]}
                                  value={indicator.name}
                                  onChangeText={(text) => {
                                    updateIndicator(index, 'name', text);
                                    // 自动补全单位
                                    const autoUnit = getLastUnitForName(text);
                                    if (autoUnit && !indicator.unit) updateIndicator(index, 'unit', autoUnit);
                                  }}
                                  placeholder="如：白细胞"
                                  autoCorrect={false}
                                  autoCapitalize="none"
                                />
                                {/* 智能补全下拉 */}
                                {indicator.name && matchedNames.length > 0 && (
                                  <View style={{ position: 'absolute', top: 40, left: 0, right: 0, backgroundColor: '#fff', borderWidth: 1, borderColor: '#E0E0E0', zIndex: 10 }}>
                                    {matchedNames.map((name, i) => (
                                      <TouchableOpacity
                                        key={i}
                                        style={{ padding: 8 }}
                                        onPress={() => {
                                          updateIndicator(index, 'name', name);
                                          // 自动补全单位
                                          const autoUnit = getLastUnitForName(name);
                                          if (autoUnit) updateIndicator(index, 'unit', autoUnit);
                                        }}
                                      >
                                        <Text style={{ color: '#4A90E2' }}>{name}</Text>
                                      </TouchableOpacity>
                                    ))}
                                  </View>
                                )}
                              </ScrollView>
                            </View>
                          </View>
                          
                          <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
                            <Text style={styles.inputLabel}>数值</Text>
                            <TextInput
                              style={styles.textInput}
                              value={indicator.value}
                              onChangeText={(text) => updateIndicator(index, 'value', text)}
                              placeholder="如：6.5"
                            />
                          </View>
                          
                          <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
                            <Text style={styles.inputLabel}>单位</Text>
                            <TextInput
                              style={styles.textInput}
                              value={indicator.unit}
                              onChangeText={(text) => updateIndicator(index, 'unit', text)}
                              placeholder="如：10^9/L"
                            />
                          </View>
                          
                          <TouchableOpacity
                            onPress={() => removeIndicator(index)}
                            style={styles.removeButton}
                          >
                            <Ionicons name="trash" size={20} color="#FF3B30" />
                          </TouchableOpacity>
                        </View>
                      </View>
                    );
                  })}
                </View>

                {/* 慢病关联 */}
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>慢病关联</Text>
                  <Picker
                    selectedValue={selectedDiseaseId}
                    onValueChange={setSelectedDiseaseId}
                    style={styles.picker}
                  >
                    <Picker.Item label="不关联慢病" value={undefined} />
                    {chronicDiseases.map(d => (
                      <Picker.Item key={d.id} label={d.name} value={d.id} />
                    ))}
                  </Picker>
                </View>
              </>
            )}
          </ScrollView>
          
          <View style={styles.modalFooter}>
            <TouchableOpacity style={styles.cancelButton} onPress={handleCancel}>
              <Text style={styles.cancelButtonText}>取消</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.saveButton} onPress={handleConfirmSave}>
              <Text style={styles.saveButtonText}>保存病历</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cameraPreview: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cameraText: {
    fontSize: 18,
    color: 'white',
    marginTop: 20,
    marginBottom: 8,
  },
  cameraSubtext: {
    fontSize: 14,
    color: '#CCC',
  },
  controls: {
    flexDirection: 'row',
    marginBottom: 40,
  },
  captureButton: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#4A90E2',
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 20,
  },
  captureButtonInner: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  galleryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 20,
  },
  galleryText: {
    color: '#4A90E2',
    fontSize: 16,
    marginLeft: 8,
  },
  processingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  processingText: {
    fontSize: 18,
    color: '#4A90E2',
    marginTop: 20,
    marginBottom: 8,
  },
  processingSubtext: {
    fontSize: 14,
    color: '#666',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#fff',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  modalContent: {
    flex: 1,
    padding: 16,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  inputGroup: {
    marginBottom: 8,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#ccc',
    padding: 8,
  },
  textArea: {
    height: 100,
  },
  row: {
    flexDirection: 'row',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  addButtonText: {
    color: '#4A90E2',
    fontSize: 14,
    marginLeft: 8,
  },
  indicatorItem: {
    marginBottom: 8,
  },
  indicatorRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  removeButton: {
    padding: 8,
  },
  modalFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 16,
  },
  cancelButton: {
    padding: 16,
    backgroundColor: '#ccc',
    borderRadius: 8,
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  saveButton: {
    padding: 16,
    backgroundColor: '#4A90E2',
    borderRadius: 8,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
  },
  picker: {
    width: '100%',
  },
}); 
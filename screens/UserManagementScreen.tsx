import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  TextInput,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList, User } from '../types';
import { useAppContext } from '../context/AppContext';

type UserManagementScreenNavigationProp = StackNavigationProp<RootStackParamList, 'UserManagement'>;

export const UserManagementScreen: React.FC = () => {
  const navigation = useNavigation<UserManagementScreenNavigationProp>();
  const { currentUser, users, setCurrentUser, addUser, deleteUser } = useAppContext();
  const [modalVisible, setModalVisible] = useState(false);
  const [newUserName, setNewUserName] = useState('');
  const [newUserRelation, setNewUserRelation] = useState('self');

  const handleAddUser = async () => {
    if (newUserName.trim()) {
      const newUser: User = {
        id: Date.now().toString(),
        name: newUserName.trim(),
        relationship: newUserRelation as 'self' | 'child' | 'parent' | 'spouse',
        color: '#4A90E2',
      };
      try {
        await addUser(newUser);
        setNewUserName('');
        setNewUserRelation('self');
        setModalVisible(false);
      } catch (error) {
        Alert.alert('错误', '添加用户失败');
      }
    } else {
      Alert.alert('提示', '请输入姓名');
    }
  };

  const handleRemoveUser = (userId: string) => {
    Alert.alert(
      '确认删除',
      '确定要删除这个家庭成员吗？删除后相关数据将无法恢复。',
      [
        { text: '取消', style: 'cancel' },
        {
          text: '删除',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteUser(userId);
            } catch (error) {
              Alert.alert('错误', '删除用户失败');
            }
          },
        },
      ]
    );
  };

  const handleSwitchUser = (user: User) => {
    setCurrentUser(user);
    navigation.goBack();
  };

  const getRelationshipText = (relationship: string) => {
    switch (relationship) {
      case 'self': return '本人';
      case 'child': return '孩子';
      case 'parent': return '父母';
      case 'spouse': return '配偶';
      default: return relationship;
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView}>
        {/* 当前用户 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>当前用户</Text>
          {currentUser && (
            <View style={styles.currentUserCard}>
              <View style={styles.userAvatar}>
                <Text style={styles.avatarText}>{currentUser.avatar || '👤'}</Text>
              </View>
              <View style={styles.userInfo}>
                <Text style={styles.userName}>{currentUser.name}</Text>
                <Text style={styles.userRelation}>{getRelationshipText(currentUser.relationship)}</Text>
              </View>
              <View style={styles.currentBadge}>
                <Text style={styles.currentBadgeText}>当前</Text>
              </View>
            </View>
          )}
        </View>

        {/* 家庭成员列表 */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>家庭成员</Text>
            <TouchableOpacity
              style={styles.addButton}
              onPress={() => setModalVisible(true)}
            >
              <Ionicons name="add" size={20} color="white" />
            </TouchableOpacity>
          </View>
          
          {users.map((user) => (
            <View key={user.id} style={styles.userCard}>
              <TouchableOpacity
                style={styles.userContent}
                onPress={() => handleSwitchUser(user)}
              >
                <View style={styles.userAvatar}>
                  <Text style={styles.avatarText}>{user.avatar || '👤'}</Text>
                </View>
                <View style={styles.userInfo}>
                  <Text style={styles.userName}>{user.name}</Text>
                  <Text style={styles.userRelation}>{getRelationshipText(user.relationship)}</Text>
                </View>
                {currentUser?.id === user.id && (
                  <View style={styles.currentBadge}>
                    <Text style={styles.currentBadgeText}>当前</Text>
                  </View>
                )}
              </TouchableOpacity>
              
              {users.length > 1 && (
                <TouchableOpacity
                  style={styles.deleteButton}
                  onPress={() => handleRemoveUser(user.id)}
                >
                  <Ionicons name="trash-outline" size={20} color="#FF3B30" />
                </TouchableOpacity>
              )}
            </View>
          ))}
        </View>

        {/* 添加用户提示 */}
        {users.length === 0 && (
          <View style={styles.emptyState}>
            <Ionicons name="people-outline" size={64} color="#CCC" />
            <Text style={styles.emptyText}>还没有添加家庭成员</Text>
            <Text style={styles.emptySubtext}>
              点击右上角按钮添加家庭成员
            </Text>
          </View>
        )}
      </ScrollView>

      {/* 添加用户模态框 */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>添加家庭成员</Text>
            
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>姓名</Text>
              <TextInput
                style={styles.textInput}
                value={newUserName}
                onChangeText={setNewUserName}
                placeholder="请输入姓名"
                maxLength={20}
              />
            </View>
            
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>关系</Text>
              <View style={styles.relationButtons}>
                {[
                  { value: 'self', label: '本人' },
                  { value: 'child', label: '孩子' },
                  { value: 'parent', label: '父母' },
                  { value: 'spouse', label: '配偶' },
                ].map((relation) => (
                  <TouchableOpacity
                    key={relation.value}
                    style={[
                      styles.relationButton,
                      newUserRelation === relation.value && styles.relationButtonActive,
                    ]}
                    onPress={() => setNewUserRelation(relation.value)}
                  >
                    <Text
                      style={[
                        styles.relationButtonText,
                        newUserRelation === relation.value && styles.relationButtonTextActive,
                      ]}
                    >
                      {relation.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
            
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setModalVisible(false)}
              >
                <Text style={styles.cancelButtonText}>取消</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.modalButton, styles.confirmButton]}
                onPress={handleAddUser}
              >
                <Text style={styles.confirmButtonText}>添加</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  addButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#4A90E2',
    justifyContent: 'center',
    alignItems: 'center',
  },
  currentUserCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#F0F8FF',
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#4A90E2',
  },
  userCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  userContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  userAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#E3F2FD',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarText: {
    fontSize: 24,
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  userRelation: {
    fontSize: 14,
    color: '#666',
  },
  currentBadge: {
    backgroundColor: '#4A90E2',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  currentBadgeText: {
    fontSize: 12,
    color: 'white',
    fontWeight: 'bold',
  },
  deleteButton: {
    padding: 8,
  },
  emptyState: {
    alignItems: 'center',
    padding: 40,
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
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 24,
    width: '80%',
    maxWidth: 300,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 20,
    textAlign: 'center',
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    color: '#333',
    marginBottom: 8,
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#DDD',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  relationButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  relationButton: {
    flex: 1,
    minWidth: '45%',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#DDD',
    alignItems: 'center',
  },
  relationButtonActive: {
    backgroundColor: '#4A90E2',
    borderColor: '#4A90E2',
  },
  relationButtonText: {
    fontSize: 14,
    color: '#666',
  },
  relationButtonTextActive: {
    color: 'white',
    fontWeight: 'bold',
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    marginHorizontal: 8,
  },
  cancelButton: {
    backgroundColor: '#F5F5F5',
  },
  confirmButton: {
    backgroundColor: '#4A90E2',
  },
  cancelButtonText: {
    color: '#666',
    textAlign: 'center',
    fontSize: 16,
    fontWeight: 'bold',
  },
  confirmButtonText: {
    color: 'white',
    textAlign: 'center',
    fontSize: 16,
    fontWeight: 'bold',
  },
}); 
import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { Ionicons } from '@expo/vector-icons';
import { AppProvider } from './context/AppContext';

// 导入屏幕组件
import { HomeScreen } from './screens/HomeScreen';
import { RecordsScreen } from './screens/RecordsScreen';
import { DiseasesScreen } from './screens/DiseasesScreen';
import { ProfileScreen } from './screens/ProfileScreen';
import { UserManagementScreen } from './screens/UserManagementScreen';
import { CameraScreen } from './screens/CameraScreen';
import { ManualEntryScreen } from './screens/ManualEntryScreen';
import { RecordDetailScreen } from './screens/RecordDetailScreen';

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

// 主标签导航器
function MainTabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;

          if (route.name === 'Home') {
            iconName = focused ? 'home' : 'home-outline';
          } else if (route.name === 'Records') {
            iconName = focused ? 'list' : 'list-outline';
          } else if (route.name === 'Diseases') {
            iconName = focused ? 'medical' : 'medical-outline';
          } else if (route.name === 'Profile') {
            iconName = focused ? 'person' : 'person-outline';
          }

          return <Ionicons name={iconName as any} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#007AFF',
        tabBarInactiveTintColor: 'gray',
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Records" component={RecordsScreen} />
      <Tab.Screen name="Diseases" component={DiseasesScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <AppProvider>
        <NavigationContainer>
          <Stack.Navigator>
            <Stack.Screen 
              name="Main" 
              component={MainTabNavigator} 
              options={{ headerShown: false }}
            />
            <Stack.Screen 
              name="UserManagement" 
              component={UserManagementScreen}
              options={{ title: '用户管理' }}
            />
            <Stack.Screen 
              name="Camera" 
              component={CameraScreen}
              options={{ title: '拍照识别' }}
            />
            <Stack.Screen 
              name="ManualEntry" 
              component={ManualEntryScreen}
              options={{ title: '手动录入' }}
            />
            <Stack.Screen 
              name="RecordDetail" 
              component={RecordDetailScreen}
              options={{ title: '病历详情' }}
            />
          </Stack.Navigator>
          <StatusBar style="auto" />
        </NavigationContainer>
      </AppProvider>
    </SafeAreaProvider>
  );
}

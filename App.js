import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ThemeProvider } from './src/context/ThemeContext';
import { useTheme } from './src/hooks/useTheme';
import { initDatabase } from './src/storage/storage';
import { registerForPushNotificationsAsync } from './src/utils/notifications';
import LoginScreen from './src/screens/LoginScreen';
import HomeScreen from './src/screens/HomeScreen';
import ReportsScreen from './src/screens/ReportsScreen';
import NotesScreen from './src/screens/NotesScreen';
import TechniquesScreen from './src/screens/TechniquesScreen';
import SettingsScreen from './src/screens/SettingsScreen';

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

function TabNavigator({ onLogout }) {
  const { theme } = useTheme();

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: theme.colors.textSecondary,
        tabBarStyle: {
          backgroundColor: theme.colors.card,
          borderTopColor: theme.colors.border,
          borderTopWidth: 1,
          height: 60,
          paddingBottom: 8,
          paddingTop: 8,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '600',
        },
      }}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{
          tabBarLabel: 'Zamanlayıcı',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="time-outline" size={size || 24} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Reports"
        component={ReportsScreen}
        options={{
          tabBarLabel: 'Raporlar',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="stats-chart-outline" size={size || 24} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Notes"
        component={NotesScreen}
        options={{
          tabBarLabel: 'Notlar',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="document-text-outline" size={size || 24} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Techniques"
        component={TechniquesScreen}
        options={{
          tabBarLabel: 'Teknikler',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="bulb-outline" size={size || 24} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Settings"
        options={{
          tabBarLabel: 'Ayarlar',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="settings-outline" size={size || 24} color={color} />
          ),
        }}
      >
        {(props) => <SettingsScreen {...props} onLogout={onLogout} />}
      </Tab.Screen>
    </Tab.Navigator>
  );
}

function AppNavigator({ isLoggedIn, onLogin, onLogout }) {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {!isLoggedIn ? (
        <Stack.Screen name="Login">
          {(props) => <LoginScreen {...props} onLogin={onLogin} />}
        </Stack.Screen>
      ) : (
        <Stack.Screen name="Main">
          {(props) => <TabNavigator {...props} onLogout={onLogout} />}
        </Stack.Screen>
      )}
    </Stack.Navigator>
  );
}

export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Veritabanını başlat
    initDatabase().catch((error) => {
      console.error('Veritabanı başlatma hatası:', error);
    });
    
    // Bildirim izinlerini al
    registerForPushNotificationsAsync().catch((error) => {
      console.error('Bildirim izni hatası:', error);
    });

    // Login durumunu kontrol et
    checkLoginStatus();
  }, []);

  const checkLoginStatus = async () => {
    try {
      const loginStatus = await AsyncStorage.getItem('isLoggedIn');
      setIsLoggedIn(loginStatus === 'true');
    } catch (error) {
      console.error('Login durumu kontrol hatası:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogin = () => {
    setIsLoggedIn(true);
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
  };

  if (isLoading) {
    return null; // Veya bir loading ekranı gösterilebilir
  }

  return (
    <ThemeProvider>
      <NavigationContainer>
        <StatusBar style="auto" />
        <AppNavigator
          isLoggedIn={isLoggedIn}
          onLogin={handleLogin}
          onLogout={handleLogout}
        />
      </NavigationContainer>
    </ThemeProvider>
  );
}


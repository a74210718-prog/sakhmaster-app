import React, { useEffect } from 'react';
import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { StatusBar } from 'expo-status-bar';
import { ActivityIndicator, View, Text } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { useAuthStore } from './src/store/authStore';
import { colors } from './src/theme/colors';

import LoginScreen         from './src/screens/auth/LoginScreen';
import RegisterScreen      from './src/screens/auth/RegisterScreen';
import HomeScreen          from './src/screens/main/HomeScreen';
import MastersScreen       from './src/screens/main/MastersScreen';
import MasterDetailScreen  from './src/screens/main/MasterDetailScreen';
import ProfileScreen       from './src/screens/main/ProfileScreen';
import NotificationsScreen from './src/screens/main/NotificationsScreen';
import OrderDetailScreen   from './src/screens/main/OrderDetailScreen';
import WalletScreen        from './src/screens/main/WalletScreen';
import ChatScreen          from './src/screens/main/ChatScreen';
import CreateOrderScreen   from './src/screens/main/CreateOrderScreen';
import AdminScreen         from './src/screens/main/AdminScreen';
import ReviewScreen            from './src/screens/main/ReviewScreen';
import EditProfileScreen       from './src/screens/main/EditProfileScreen';
import MasterProfileEditScreen from './src/screens/main/MasterProfileEditScreen';
import MasterStatsScreen       from './src/screens/main/MasterStatsScreen';

const Stack = createNativeStackNavigator();
const Tab   = createBottomTabNavigator();

const NAV_THEME = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    background:   colors.bg,
    card:         colors.surface,
    border:       colors.border,
    text:         colors.textPrimary,
    primary:      colors.emerald,
    notification: colors.emerald,
  },
};

function TabIcon({ emoji, focused }: { emoji: string; focused: boolean }) {
  return <Text style={{ fontSize: 22, opacity: focused ? 1 : 0.5 }}>{emoji}</Text>;
}

function MainTabs() {
  const user = useAuthStore((s) => s.user);
  const isMaster = user?.role === 'master_smz' || user?.role === 'ip_pro';
  const isAdmin  = user?.role === 'admin' || user?.role === 'moderator';

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor:  colors.border,
          borderTopWidth:  1,
        },
        tabBarActiveTintColor:   colors.emerald,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarLabelStyle: { fontSize: 11, fontWeight: '600' },
      }}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{
          title: isMaster ? 'Лента' : 'Заказы',
          tabBarIcon: ({ focused }) => <TabIcon emoji={isMaster ? '📋' : '🏠'} focused={focused} />,
        }}
      />
      <Tab.Screen
        name="Masters"
        component={MastersScreen}
        options={{
          title: 'Мастера',
          tabBarIcon: ({ focused }) => <TabIcon emoji="🔧" focused={focused} />,
        }}
      />
      <Tab.Screen
        name="Notifications"
        component={NotificationsScreen}
        options={{
          title: 'Уведомления',
          tabBarIcon: ({ focused }) => <TabIcon emoji="🔔" focused={focused} />,
        }}
      />
      {isAdmin && (
        <Tab.Screen
          name="Admin"
          component={AdminScreen}
          options={{
            title: 'Админ',
            tabBarIcon: ({ focused }) => <TabIcon emoji="⚡" focused={focused} />,
            tabBarBadgeStyle: { backgroundColor: colors.rose },
          }}
        />
      )}
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          title: 'Профиль',
          tabBarIcon: ({ focused }) => <TabIcon emoji="👤" focused={focused} />,
        }}
      />
    </Tab.Navigator>
  );
}

function AuthStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Login"    component={LoginScreen} />
      <Stack.Screen name="Register" component={RegisterScreen} />
    </Stack.Navigator>
  );
}

function MainStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Tabs"         component={MainTabs} />
      <Stack.Screen name="OrderDetail"  component={OrderDetailScreen} />
      <Stack.Screen name="MasterDetail" component={MasterDetailScreen} />
      <Stack.Screen name="Wallet"       component={WalletScreen} />
      <Stack.Screen name="Chat"         component={ChatScreen} />
      <Stack.Screen name="CreateOrder"   component={CreateOrderScreen} />
      <Stack.Screen name="Review"            component={ReviewScreen} />
      <Stack.Screen name="EditProfile"       component={EditProfileScreen} />
      <Stack.Screen name="MasterProfileEdit" component={MasterProfileEditScreen} />
      <Stack.Screen name="MasterStats"       component={MasterStatsScreen} />
    </Stack.Navigator>
  );
}

export default function App() {
  const { user, loading, restore } = useAuthStore();

  useEffect(() => { restore(); }, []);

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.bg, alignItems: 'center', justifyContent: 'center' }}>
        <Text style={{ color: colors.emerald, fontSize: 32, fontWeight: '700', marginBottom: 20 }}>
          Ладорея
        </Text>
        <ActivityIndicator color={colors.emerald} size="large" />
      </View>
    );
  }

  return (
    <SafeAreaProvider>
      <NavigationContainer theme={NAV_THEME}>
        <StatusBar style="light" />
        {user ? <MainStack /> : <AuthStack />}
      </NavigationContainer>
    </SafeAreaProvider>
  );
}

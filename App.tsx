import React, { useEffect } from 'react';
import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { StatusBar } from 'expo-status-bar';
import { ActivityIndicator, View, Text } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { useAuthStore } from './src/store/authStore';
import { useCartStore } from './src/store/cartStore';
import { colors } from './src/theme/colors';

import WelcomeScreen       from './src/screens/auth/WelcomeScreen';
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
import FleaScreen              from './src/screens/main/FleaScreen';
import FleaItemScreen          from './src/screens/main/FleaItemScreen';
import FleaCreateScreen        from './src/screens/main/FleaCreateScreen';
import FleaEditScreen          from './src/screens/main/FleaEditScreen';
import MyFleaListingsScreen    from './src/screens/main/MyFleaListingsScreen';
import FleaDealsScreen         from './src/screens/main/FleaDealsScreen';
import IpDashboardScreen       from './src/screens/ip/IpDashboardScreen';
import IpFinanceScreen         from './src/screens/ip/IpFinanceScreen';
import IpProjectsScreen        from './src/screens/ip/IpProjectsScreen';
import IpTeamScreen            from './src/screens/ip/IpTeamScreen';
import RentScreen              from './src/screens/rent/RentScreen';
import RentItemScreen          from './src/screens/rent/RentItemScreen';
import RentBookingScreen       from './src/screens/rent/RentBookingScreen';
import MyRentalsScreen            from './src/screens/rent/MyRentalsScreen';
import RentCabinetDashboardScreen from './src/screens/rent/RentCabinetDashboardScreen';
import RentCabinetBookingsScreen  from './src/screens/rent/RentCabinetBookingsScreen';
import RentCabinetToolsScreen     from './src/screens/rent/RentCabinetToolsScreen';
import ShopScreen              from './src/screens/shop/ShopScreen';
import ShopItemScreen          from './src/screens/shop/ShopItemScreen';
import ShopCartScreen          from './src/screens/shop/ShopCartScreen';
import ShopCheckoutScreen      from './src/screens/shop/ShopCheckoutScreen';
import ShopOrdersScreen              from './src/screens/shop/ShopOrdersScreen';
import ShopCabinetDashboardScreen    from './src/screens/shop/ShopCabinetDashboardScreen';
import ShopCabinetOrdersScreen       from './src/screens/shop/ShopCabinetOrdersScreen';
import ShopCabinetProductsScreen     from './src/screens/shop/ShopCabinetProductsScreen';
import ContractsScreen         from './src/screens/main/ContractsScreen';
import ContractDetailScreen    from './src/screens/main/ContractDetailScreen';
import LegalScreen             from './src/screens/main/LegalScreen';
import AdminUsersScreen        from './src/screens/admin/AdminUsersScreen';
import AdminOrdersScreen       from './src/screens/admin/AdminOrdersScreen';
import AdminPayoutsScreen      from './src/screens/admin/AdminPayoutsScreen';
import AdminSettingsScreen     from './src/screens/admin/AdminSettingsScreen';
import SubscriptionScreen      from './src/screens/main/SubscriptionScreen';
import SmzVerificationScreen   from './src/screens/main/SmzVerificationScreen';
import AiChatScreen            from './src/screens/main/AiChatScreen';

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
        name="Rent"
        component={RentScreen}
        options={{
          title: 'Аренда',
          tabBarIcon: ({ focused }) => <TabIcon emoji="🔩" focused={focused} />,
        }}
      />
      <Tab.Screen
        name="Shop"
        component={ShopScreen}
        options={{
          title: 'Магазин',
          tabBarIcon: ({ focused }) => <TabIcon emoji="🛍️" focused={focused} />,
        }}
      />
      <Tab.Screen
        name="Flea"
        component={FleaScreen}
        options={{
          title: 'Барахолка',
          tabBarIcon: ({ focused }) => <TabIcon emoji="🏷️" focused={focused} />,
        }}
      />
      <Tab.Screen
        name="AiTab"
        component={AiChatScreen}
        options={{
          title: 'ИИ',
          tabBarIcon: ({ focused }) => <TabIcon emoji="🤖" focused={focused} />,
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
      <Stack.Screen name="Welcome"  component={WelcomeScreen} />
      <Stack.Screen name="Login"    component={LoginScreen} />
      <Stack.Screen name="Register" component={RegisterScreen} />
      <Stack.Screen name="Legal"    component={LegalScreen} />
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
      <Stack.Screen name="FleaItem"          component={FleaItemScreen} />
      <Stack.Screen name="FleaCreate"        component={FleaCreateScreen} />
      <Stack.Screen name="FleaEdit"          component={FleaEditScreen} />
      <Stack.Screen name="MyFleaListings"    component={MyFleaListingsScreen} />
      <Stack.Screen name="FleaDeals"         component={FleaDealsScreen} />
      <Stack.Screen name="RentCabinetDashboard"  component={RentCabinetDashboardScreen} />
      <Stack.Screen name="RentCabinetBookings"  component={RentCabinetBookingsScreen} />
      <Stack.Screen name="RentCabinetTools"     component={RentCabinetToolsScreen} />
      <Stack.Screen name="ShopCabinetDashboard"  component={ShopCabinetDashboardScreen} />
      <Stack.Screen name="ShopCabinetOrders"     component={ShopCabinetOrdersScreen} />
      <Stack.Screen name="ShopCabinetProducts"   component={ShopCabinetProductsScreen} />
      <Stack.Screen name="IpDashboard"           component={IpDashboardScreen} />
      <Stack.Screen name="IpFinance"         component={IpFinanceScreen} />
      <Stack.Screen name="IpProjects"        component={IpProjectsScreen} />
      <Stack.Screen name="IpTeam"            component={IpTeamScreen} />
      <Stack.Screen name="RentItem"           component={RentItemScreen} />
      <Stack.Screen name="RentBooking"        component={RentBookingScreen} />
      <Stack.Screen name="MyRentals"          component={MyRentalsScreen} />
      <Stack.Screen name="ShopItem"           component={ShopItemScreen} />
      <Stack.Screen name="ShopCart"          component={ShopCartScreen} />
      <Stack.Screen name="ShopCheckout"      component={ShopCheckoutScreen} />
      <Stack.Screen name="ShopOrders"        component={ShopOrdersScreen} />
      <Stack.Screen name="Contracts"          component={ContractsScreen} />
      <Stack.Screen name="ContractDetail"    component={ContractDetailScreen} />
      <Stack.Screen name="Legal"             component={LegalScreen} />
      <Stack.Screen name="AdminUsers"        component={AdminUsersScreen} />
      <Stack.Screen name="AdminOrders"       component={AdminOrdersScreen} />
      <Stack.Screen name="AdminPayouts"      component={AdminPayoutsScreen} />
      <Stack.Screen name="AdminSettings"     component={AdminSettingsScreen} />
      <Stack.Screen name="Subscription"      component={SubscriptionScreen} />
      <Stack.Screen name="SmzVerification"   component={SmzVerificationScreen} />
      <Stack.Screen name="AiChat"            component={AiChatScreen} />
    </Stack.Navigator>
  );
}

export default function App() {
  const { user, loading, restore } = useAuthStore();
  const restoreCart = useCartStore((s) => s.restore);

  useEffect(() => { restore(); restoreCart(); }, []);

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

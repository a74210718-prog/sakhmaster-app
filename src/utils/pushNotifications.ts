import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { api } from '../api/client';

export function setupNotificationHandler() {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: true,
      shouldShowBanner: true,
    }),
  });
}

export async function registerPushToken(): Promise<void> {
  if (!Device.isDevice) return;

  const { status: existing } = await Notifications.getPermissionsAsync();
  let finalStatus = existing;

  if (existing !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') return;

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'Ладорея',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#10b981',
      sound: 'default',
    });
  }

  try {
    const { data: token } = await Notifications.getExpoPushTokenAsync({
      projectId: '2402d8b4-b47b-4687-b03f-7fcb927c5480',
    });

    await api.post('/push-token', {
      token,
      platform: Platform.OS === 'ios' ? 'ios' : 'android',
    });
  } catch {}
}

export function getNavigationTarget(data: Record<string, any>): { screen: string; params?: any } | null {
  if (!data) return null;

  // Новый формат: поле screen из toExpoPush()
  const screen = data.screen;
  if (screen) {
    const id = data.id ? Number(data.id) : undefined;
    switch (screen) {
      case 'OrderDetail':    return { screen: 'OrderDetail',    params: { id } };
      case 'ContractDetail': return { screen: 'ContractDetail', params: { id } };
      case 'Chat':           return { screen: 'Chat', params: { orderId: id, orderTitle: data.orderTitle } };
      case 'MyRentals':      return { screen: 'MyRentals' };
      case 'FleaDeals':      return { screen: 'FleaDeals' };
      case 'ShopOrders':     return { screen: 'ShopOrders' };
      default: return null;
    }
  }

  // Legacy формат: данные из toDatabase() без поля screen
  if (data.order_id)    return { screen: 'OrderDetail',    params: { id: Number(data.order_id) } };
  if (data.contract_id) return { screen: 'ContractDetail', params: { id: Number(data.contract_id) } };
  if (data.booking_id)  return { screen: 'MyRentals' };
  if (data.listing_id)  return { screen: 'FleaDeals' };

  return null;
}

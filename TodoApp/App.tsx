import 'react-native-gesture-handler';
import React, { useEffect } from 'react';
import { AppState } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import * as Notifications from 'expo-notifications';
import AppNavigator, { navigateToEventsOverview } from './src/navigation';
import { syncEventReminders } from './src/utils/eventNotifications';
import { error as logError } from './src/utils/debug';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export default function App() {
  useEffect(() => {
    const sync = () => {
      syncEventReminders().catch(error => logError('sync event reminders failed', error));
    };

    const handleNotificationResponse = (response: Notifications.NotificationResponse) => {
      if (response.notification.request.content.data?.type !== 'event-reminder') {
        return;
      }

      navigateToEventsOverview();
      Notifications.clearLastNotificationResponseAsync().catch(error =>
        logError('clear notification response failed', error)
      );
    };

    const responseSubscription =
      Notifications.addNotificationResponseReceivedListener(handleNotificationResponse);

    Notifications.getLastNotificationResponseAsync()
      .then(response => {
        if (response) handleNotificationResponse(response);
      })
      .catch(error => logError('get last notification response failed', error));

    sync();
    const subscription = AppState.addEventListener('change', state => {
      if (state === 'active') sync();
    });

    return () => {
      responseSubscription.remove();
      subscription.remove();
    };
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <AppNavigator />
    </GestureHandlerRootView>
  );
}

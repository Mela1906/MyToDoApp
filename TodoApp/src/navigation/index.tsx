import React from 'react';
import {
  createNavigationContainerRef,
  NavigationContainer,
  NavigatorScreenParams,
} from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Text } from 'react-native';
import { Event, Todo } from '../types';

import TodayScreen from '../screens/TodayScreen';
import TodosScreen from '../screens/TodosScreen';
import AddTodoScreen from '../screens/AddTodoScreen';
import EventsScreen from '../screens/EventsScreen';
import AddEventScreen from '../screens/AddEventScreen';
import { COLORS } from '../utils/colors';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

type TodosStackParamList = {
  TodosList: undefined;
  AddTodo: { todo?: Todo } | undefined;
};

type EventsStackParamList = {
  EventsList: undefined;
  AddEvent: { event?: Event } | undefined;
};

type RootTabParamList = {
  Heute: undefined;
  Todos: NavigatorScreenParams<TodosStackParamList>;
  Termine: NavigatorScreenParams<EventsStackParamList>;
};

export const navigationRef = createNavigationContainerRef<RootTabParamList>();
let pendingEventsOverviewNavigation = false;

export function navigateToEventsOverview() {
  if (!navigationRef.isReady()) {
    pendingEventsOverviewNavigation = true;
    return;
  }

  navigationRef.navigate('Termine', { screen: 'EventsList' });
}

function TodosStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="TodosList" component={TodosScreen} />
      <Stack.Screen name="AddTodo" component={AddTodoScreen} options={{ presentation: 'modal' }} />
    </Stack.Navigator>
  );
}

function EventsStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="EventsList" component={EventsScreen} />
      <Stack.Screen name="AddEvent" component={AddEventScreen} options={{ presentation: 'modal' }} />
    </Stack.Navigator>
  );
}

export default function AppNavigator() {
  return (
    <NavigationContainer
      ref={navigationRef}
      onReady={() => {
        if (pendingEventsOverviewNavigation) {
          pendingEventsOverviewNavigation = false;
          navigateToEventsOverview();
        }
      }}
    >
      <Tab.Navigator
        screenOptions={{
          headerShown: false,
          tabBarStyle: {
            backgroundColor: COLORS.card,
            borderTopColor: COLORS.border,
            height: 64,
            paddingBottom: 10,
          },
          tabBarActiveTintColor: COLORS.primary,
          tabBarInactiveTintColor: COLORS.subtext,
          tabBarLabelStyle: { fontSize: 12, fontWeight: '600' },
        }}
      >
        <Tab.Screen
          name="Heute"
          component={TodayScreen}
          options={{ tabBarIcon: ({ color }) => <Text style={{ fontSize: 22, color }}>🏠</Text> }}
        />
        <Tab.Screen
          name="Todos"
          component={TodosStack}
          options={{ tabBarIcon: ({ color }) => <Text style={{ fontSize: 22, color }}>✅</Text> }}
        />
        <Tab.Screen
          name="Termine"
          component={EventsStack}
          options={{ tabBarIcon: ({ color }) => <Text style={{ fontSize: 22, color }}>📅</Text> }}
        />
      </Tab.Navigator>
    </NavigationContainer>
  );
}

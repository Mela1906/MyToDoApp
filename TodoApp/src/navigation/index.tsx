import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { Text } from 'react-native';

import TodayScreen from '../screens/TodayScreen';
import TodosScreen from '../screens/TodosScreen';
import AddTodoScreen from '../screens/AddTodoScreen';
import EventsScreen from '../screens/EventsScreen';
import AddEventScreen from '../screens/AddEventScreen';
import { COLORS } from '../utils/colors';

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

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
    <NavigationContainer>
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

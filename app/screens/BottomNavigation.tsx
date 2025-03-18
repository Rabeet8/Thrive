import React from 'react';
import { View, StyleSheet,TouchableOpacity } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';

// Import screens
import HomeScreen from './HomeScreen';
// import ProfileScreen from './ProfileScreen';

// Import the AddPlantButton component for the center button
// import AddPlantButton from '../components/AddPlantButton';

const Tab = createBottomTabNavigator();

// Placeholder for profile screen if you haven't created it yet
const ProfileScreen = () => (
  <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
    <Text style={{ fontSize: 20 }}>Profile Screen</Text>
  </View>
);

const BottomNavigation = () => {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarShowLabel: false,
        tabBarStyle: styles.tabBar,
        tabBarActiveTintColor: '#357266',
        tabBarInactiveTintColor: '#BEBEBE',
      })}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{
          tabBarIcon: ({ color, size, focused }) => (
            <View style={[styles.tabItem, focused && styles.activeTab]}>
              <Ionicons name="leaf" size={22} color={color} />
            </View>
          ),
        }}
      />
      
      <Tab.Screen
        name="AddPlant"
        component={EmptyScreen} // This doesn't render - it's just a placeholder
        // options={{
        //   tabBarButton: (props) => (
        //     <AddPlantButton
        //       {...props}
        //       onPress={() => props.navigation.navigate('AddPlantForm')}
        //     />
        //   ),
        // }}
      />
      
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          tabBarIcon: ({ color, size, focused }) => (
            <View style={[styles.tabItem, focused && styles.activeTab]}>
              <Ionicons name="person" size={22} color={color} />
            </View>
          ),
        }}
      />
    </Tab.Navigator>
  );
};

// Empty screen component for the middle tab
const EmptyScreen = () => <View />;

// Component for the add plant floating button
const AddPlantButton = ({ onPress }) => (
  <TouchableOpacity
    style={styles.addButton}
    onPress={onPress}
    activeOpacity={0.8}
  >
    <Ionicons name="add" size={32} color="white" />
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  tabBar: {
    position: 'absolute',
    borderTopWidth: 0,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    height: 70,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
    paddingHorizontal: 10,
  },
  tabItem: {
    alignItems: 'center',
    justifyContent: 'center',
    height: 48,
    width: 48,
    borderRadius: 24,
  },
  activeTab: {
    backgroundColor: '#E8F5E9',
  },
  addButton: {
    top: -20,
    justifyContent: 'center',
    alignItems: 'center',
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#357266',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.2,
    shadowRadius: 3.84,
    elevation: 5,
  },
});

export default BottomNavigation;
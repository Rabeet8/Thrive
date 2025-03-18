import React from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  FlatList, 
  Image, 
  TouchableOpacity, 
  SafeAreaView,
  StatusBar 
} from 'react-native';
import BottomNavigation from './BottomNavigation';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import PlantDetailScreen from './PlantDetail';
import PlantForm from './PlantForm';

const Stack = createNativeStackNavigator();

// Sample data - replace with your actual data
const plants = [
  {
    id: '1',
    name: 'Monstera Deliciosa',
    image: require('../../assets/images/monstera.png'),
    lastWatered: 3,
  },
  {
    id: '2',
    name: 'Snake Plant',
    image: require('../../assets/images/monstera.png'),
    lastWatered: 7,
  },
  {
    id: '3',
    name: 'Peace Lily',
    image: require('../../assets/images/monstera.png'),
    lastWatered: 1,
  },
  {
    id: '4',
    name: 'Fiddle Leaf Fig',
    image: require('../../assets/images/monstera.png'),
    lastWatered: 5,
  },
  {
    id: '5',
    name: 'Pothos',
    image: require('../../assets/images/monstera.png'),
    lastWatered: 4,
  },
];

type RootStackParamList = {
  Home: undefined;
  PlantDetail: { plant: any };
  AddPlantForm: undefined;
};

type NavigationProp = NativeStackNavigationProp<RootStackParamList, 'Home'>;

interface PlantCardProps {
  plant: {
    id: string;
    name: string;
    image: any;
    lastWatered: number;
  };
  onPress: () => void;
}

const PlantCard = ({ plant, onPress }: PlantCardProps) => {
  return (
    <TouchableOpacity style={styles.card} onPress={onPress}>
      <Image source={plant.image} style={styles.plantImage} />
      <View style={styles.cardContent}>
        <Text style={styles.plantName}>{plant.name}</Text>
        <View style={styles.waterInfo}>
          <View style={styles.waterIconContainer}>
            <Ionicons name="water-outline" size={14} color="#FFFFFF" />
          </View>
          <Text style={styles.waterText}>
            {plant.lastWatered === 1 
              ? '1 day since last watered' 
              : `${plant.lastWatered} days since last watered`}
          </Text>
        </View>
      </View>
      <View style={styles.cardDecoration} />
    </TouchableOpacity>
  );
};

const MainHomeScreen = () => {
  const navigation = useNavigation<NavigationProp>();
  
  const handlePlantPress = (plant) => {
    navigation.navigate('PlantDetail', { plant });
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <View style={styles.header}>
        <Text style={styles.headerTitle}>My Plants</Text>
        <TouchableOpacity style={styles.filterButton}>
          <Ionicons name="filter-outline" size={24} color="#357266" />
        </TouchableOpacity>
      </View>
      
      <FlatList
        data={plants}
        keyExtractor={item => item.id}
        renderItem={({ item }) => (
          <PlantCard plant={item} onPress={() => handlePlantPress(item)} />
        )}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
      />

      <TouchableOpacity 
        style={styles.fab}
        onPress={() => navigation.navigate('AddPlantForm')}
      >
        <Ionicons name="add" size={24} color="#FFFFFF" />
      </TouchableOpacity>
    </SafeAreaView>
  );
};

const HomeScreen = () => {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Main" component={MainHomeScreen} />
      <Stack.Screen name="PlantDetail" component={PlantDetailScreen} />
      <Stack.Screen name="AddPlantForm" component={PlantForm} />
    </Stack.Navigator>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '600',
    color: '#357266',
  },
  filterButton: {
    padding: 5,
  },
  listContainer: {
    padding: 15,
  },
  card: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    marginBottom: 15,
    overflow: 'hidden',
    shadowColor: '#357266',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
    borderWidth: 1,
    borderColor: '#E8F3F1',
  },
  plantImage: {
    width: 110,
    height: 110,
    borderTopLeftRadius: 16,
    borderBottomLeftRadius: 16,
    backgroundColor: '#F5F9F8',
  },
  cardContent: {
    flex: 1,
    padding: 16,
    justifyContent: 'center',
  },
  plantName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2D5D54',
    marginBottom: 10,
    letterSpacing: 0.3,
  },
  waterInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  waterIconContainer: {
    backgroundColor: '#357266',
    padding: 6,
    borderRadius: 8,
    marginRight: 8,
  },
  waterText: {
    fontSize: 13,
    color: '#6B8C86',
    flex: 1,
  },
  cardDecoration: {
    position: 'absolute',
    right: 0,
    top: 0,
    bottom: 0,
    width: 6,
    backgroundColor: '#357266',
    borderTopRightRadius: 16,
    borderBottomRightRadius: 16,
  },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 20,
    backgroundColor: '#357266',
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
});

export default HomeScreen;
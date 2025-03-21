import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  FlatList, 
  TouchableOpacity, 
  SafeAreaView,
  StatusBar 
} from 'react-native';
import { Image as CacheImage } from 'react-native-expo-image-cache';
import CustomAlert from '../components/CustomAlert';
import BottomNavigation from './BottomNavigation';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import PlantDetailScreen from './PlantDetail';
import PlantForm from './PlantForm';
import { supabase } from '../../lib/supabase';

const Stack = createNativeStackNavigator();

type RootStackParamList = {
  Home: undefined;
  PlantDetail: { plant: any };
  AddPlantForm: undefined;
};

type NavigationProp = NativeStackNavigationProp<RootStackParamList, 'Home'>;

interface Plant {
  id: string;
  name: string;
  image_url: string;
  watering_frequency: number;
  last_watered?: string;
  description: string;
}

const PlantCard = ({ plant, onPress, onDelete }: { 
  plant: Plant; 
  onPress: () => void;
  onDelete: () => void;
}) => {
  const calculateDaysSinceWatered = () => {
    if (!plant.last_watered) return null;
    const lastWatered = new Date(plant.last_watered);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - lastWatered.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const daysSinceWatered = calculateDaysSinceWatered();

  return (
    <TouchableOpacity style={styles.card} onPress={onPress}>
      <CacheImage 
        uri={plant.image_url} 
        style={styles.plantImage}
        tint="light"
        preview={{ uri: plant.image_url }}
      />
      <View style={styles.cardContent}>
        <Text style={styles.plantName}>{plant.name}</Text>
        <View style={styles.waterInfo}>
          <View style={styles.waterIconContainer}>
            <Ionicons name="water-outline" size={14} color="#FFFFFF" />
          </View>
          <Text style={styles.waterText}>
            {daysSinceWatered 
              ? `${daysSinceWatered} ${daysSinceWatered === 1 ? 'day' : 'days'} since last watered`
              : `Water every ${plant.watering_frequency} ${plant.watering_frequency === 1 ? 'day' : 'days'}`
            }
          </Text>
        </View>
      </View>
      <TouchableOpacity 
        style={styles.deleteButton}
        onPress={onDelete}
      >
        <Ionicons name="trash-outline" size={20} color="#d95757" />
      </TouchableOpacity>
      <View style={styles.cardDecoration} />
    </TouchableOpacity>
  );
};

const MainHomeScreen = () => {
  const navigation = useNavigation<NavigationProp>();
  const [plants, setPlants] = useState<Plant[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteAlert, setDeleteAlert] = useState({ visible: false, plantId: null, type: '', message: '' });

  useFocusEffect(
    React.useCallback(() => {
      fetchPlants();
    }, [])
  );

  const onRefresh = React.useCallback(() => {
    fetchPlants();
  }, []);

  const fetchPlants = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No user logged in');

      const { data, error } = await supabase
        .from('plant')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setPlants(data || []);
    } catch (error) {
      console.error('Error fetching plants:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeletePlant = async (plantId: string) => {
    try {
      // Get the plant's image filename from the image_url
      const plantToDelete = plants.find(p => p.id === plantId);
      const imageUrl = plantToDelete?.image_url || '';
      const fileName = imageUrl.split('/').pop(); // Get the filename from URL

      // Delete from database first
      const { error: deleteError } = await supabase
        .from('plant')
        .delete()
        .eq('id', plantId);

      if (deleteError) {
        console.error('Delete error:', deleteError);
        throw new Error(deleteError.message);
      }

      // Delete image from storage if we have a filename
      if (fileName) {
        const { error: storageError } = await supabase.storage
          .from('plant-images')
          .remove([fileName]);

        if (storageError) {
          console.error('Storage delete error:', storageError);
        }
      }

      // Update local state
      setPlants(currentPlants => 
        currentPlants.filter(plant => plant.id !== plantId)
      );

      // Show success message
      setDeleteAlert(prev => ({
        ...prev,
        visible: true,
        type: 'success',
        message: 'Plant deleted successfully'
      }));

      // Close the alert after a short delay
      setTimeout(() => {
        setDeleteAlert({ visible: false, plantId: null, type: '', message: '' });
      }, 1500);

    } catch (error) {
      console.error('Error deleting plant:', error);
      setDeleteAlert(prev => ({
        ...prev,
        visible: true,
        type: 'error',
        message: 'Failed to delete plant. Please try again.'
      }));
      // Refresh plants list to ensure UI is in sync
      fetchPlants();
    }
  };

  const showDeleteConfirmation = (plantId: string) => {
    setDeleteAlert({
      visible: true,
      plantId,
      type: 'warning',
      message: 'Are you sure you want to delete this plant?'
    });
  };

  const handleDeleteConfirm = async () => {
    if (deleteAlert.plantId) {
      await handleDeletePlant(deleteAlert.plantId);
    }
    setDeleteAlert({ visible: false, plantId: null, type: '', message: '' });
  };

  const renderContent = () => {
    if (plants.length === 0) {
      return (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>Add your first plant</Text>
          <View style={styles.arrowContainer}>
            <Ionicons 
              name="arrow-forward" 
              size={40} 
              color="#357266" 
              style={styles.arrowIcon}
            />
          </View>
        </View>
      );
    }

    return (
      <FlatList
        data={plants}
        keyExtractor={item => item.id}
        renderItem={({ item }) => (
          <PlantCard 
            plant={item} 
            onPress={() => navigation.navigate('PlantDetail', { plantId: item.id })}
            onDelete={() => showDeleteConfirmation(item.id)}
          />
        )}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
        refreshing={loading}
        onRefresh={onRefresh}
        removeClippedSubviews={true}
        maxToRenderPerBatch={10}
        windowSize={5}
      />
    );
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
      
      {renderContent()}

      <TouchableOpacity 
        style={styles.fab}
        onPress={() => navigation.navigate('AddPlantForm')}
      >
        <Ionicons name="add" size={24} color="#FFFFFF" />
      </TouchableOpacity>

      <CustomAlert
        visible={deleteAlert.visible}
        title="Delete Plant"
        message={deleteAlert.message}
        type={deleteAlert.type}
        onClose={() => setDeleteAlert({ visible: false, plantId: null, type: '', message: '' })}
        onConfirm={handleDeleteConfirm}
        showCancelButton={true}
      />
    </SafeAreaView>
  );
};

const HomeScreen = () => {
  return (
    <Stack.Navigator 
      initialRouteName="Main"
      screenOptions={{ 
        headerShown: false,
        animation: 'fade',
        presentation: 'containedModal',
        contentStyle: {
          backgroundColor: '#FFFFFF',
        }
      }}
    >
      <Stack.Group screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Main" component={MainHomeScreen} />
        <Stack.Screen name="PlantDetail" component={PlantDetailScreen} />
        <Stack.Screen name="AddPlantForm" component={PlantForm} />
      </Stack.Group>
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
    marginTop: 40,  
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
    marginTop: 10,  // Add top margin to card list
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
    bottom: 80, // Moved up from 20
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
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    marginBottom: 100, // Add space at bottom to account for FAB
  },
  emptyText: {
    fontSize: 20,
    color: '#357266',
    fontWeight: '600',
    marginBottom: 16,
  },
  arrowContainer: {
    position: 'absolute',
    bottom: 40,
    right: '30%',
  },
  arrowIcon: {
    transform: [{ rotate: '35deg' }],
    // marginTop: 8,
  },
  deleteButton: {
    position: 'absolute',
    top: 8,
    right: 12,
    padding: 8,
    zIndex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 12,
  },
});

export default HomeScreen;
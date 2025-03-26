import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  Image, 
  ScrollView, 
  TouchableOpacity,
  SafeAreaView,
  Modal,
  Dimensions
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../../lib/supabase';
import { Image as CacheImage } from 'react-native-expo-image-cache';
import Carousel from 'react-native-reanimated-carousel';
import Animated from 'react-native-reanimated';
import * as ImagePicker from 'expo-image-picker';
import { uploadTimelineImage } from '../utils/imageUpload';
import NotificationService from '../services/NotificationService';
import CustomAlert from '../components/CustomAlert';

interface Plant {
  id: string;
  name: string;
  description: string;
  image_url: string;
  watering_frequency: number;
  last_watered?: string;
}

type PlantImage = {
  id: string;
  uri: string;
  date: Date;
};

interface TimelineImage {
  id: string;
  image_url: string;
  created_at: string;
};

interface GroupedImages {
  [key: string]: TimelineImage[];
}



const PlantDetailScreen = ({ route, navigation }) => {
  const { plantId } = route.params;
  const [plant, setPlant] = useState<Plant | null>(null);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedImage, setSelectedImage] = useState<PlantImage | null>(null);
  const [timelineImages, setTimelineImages] = useState<TimelineImage[]>([]);
  const carouselRef = React.useRef(null);
  const [isImageModalVisible, setIsImageModalVisible] = useState(false);
  const [alertConfig, setAlertConfig] = useState({
    visible: false,
    message: '',
    type: 'success',
    title: ''
  });

  useEffect(() => {
    fetchPlantDetails();
    fetchTimelineImages();
  }, [plantId]);

  const fetchPlantDetails = async () => {
    try {
      const { data, error } = await supabase
        .from('plant')
        .select('*')
        .eq('id', plantId)
        .single();

      if (error) throw error;
      setPlant(data);
    } catch (error) {
      console.error('Error fetching plant details:', error);
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  };

  const fetchTimelineImages = async () => {
    try {
      const { data, error } = await supabase
        .from('plant_timeline')
        .select('*')
        .eq('plant_id', plantId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      console.log('Timeline images:', data); // Debug log
      setTimelineImages(data || []);
    } catch (error) {
      console.error('Error fetching timeline images:', error);
    }
  };

  const handleAddTimelinePhoto = async () => {
    try {
      // Request camera permission
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      
      if (status !== 'granted') {
        alert('Sorry, we need camera permissions to make this work!');
        return;
      }

      // Launch camera
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 1,
      });

      if (!result.canceled && result.assets[0].uri) {
        const imageUrl = await uploadTimelineImage(result.assets[0].uri, plant.id);
        
        // Save to plant_timeline table
        const { error } = await supabase
          .from('plant_timeline')
          .insert({
            plant_id: plant.id,
            image_url: imageUrl,
            user_id: plant.user_id // Add user_id for RLS
          });

        if (error) throw error;
        
        // Refresh timeline images
        fetchTimelineImages();
      }
    } catch (error) {
      console.error('Error adding timeline photo:', error);
      alert('Failed to add timeline photo. Please try again.');
    }
  };

  const groupImagesByMonth = (images: TimelineImage[]): GroupedImages => {
    return images.reduce((acc, image) => {
      const date = new Date(image.created_at);
      const monthYear = date.toLocaleString('default', { month: 'long', year: 'numeric' });
      
      if (!acc[monthYear]) {
        acc[monthYear] = [];
      }
      acc[monthYear].push(image);
      return acc;
    }, {});
  };

  const openImagePreview = (image: TimelineImage) => {
    setSelectedImage({
      id: image.id,
      uri: image.image_url,
      date: new Date(image.created_at)
    });
  };

  const handleImageClick = () => {
    setIsImageModalVisible(true);
  };

  const renderTimelineCard = (image: TimelineImage) => (
    <TouchableOpacity
      key={image.id}
      style={styles.timelineCard}
      onPress={() => openImagePreview(image)}
    >
      <CacheImage 
        uri={image.image_url}
        style={styles.timelineImage}
        preview={{ uri: image.image_url }}
        tint="light"
      />
      <View style={styles.timelineInfo}>
        <Text style={styles.timelineDate}>
          {new Date(image.created_at).toLocaleDateString()}
        </Text>
      </View>
    </TouchableOpacity>
  );

  const renderTimelineSection = () => {
    const groupedImages = groupImagesByMonth(timelineImages);
    const months = Object.keys(groupedImages).sort((a, b) => {
      return new Date(b).getTime() - new Date(a).getTime();
    });

    return (
      <View style={styles.timelineSection}>
        <View style={styles.timelineHeader}>
          <Text style={styles.sectionTitle}>Growth Timeline</Text>
          <TouchableOpacity 
            style={styles.addPhotoButton}
            onPress={handleAddTimelinePhoto}
          >
            <Ionicons name="camera-outline" size={24} color="#357266" />
          </TouchableOpacity>
        </View>

        {months.length > 0 ? (
          months.map((month) => (
            <View key={month} style={styles.monthSection}>
              <Text style={styles.monthTitle}>{month}</Text>
              <ScrollView 
                horizontal 
                showsHorizontalScrollIndicator={false}
                style={styles.monthScroll}
              >
                {groupedImages[month].map(renderTimelineCard)}
              </ScrollView>
            </View>
          ))
        ) : (
          <View style={styles.emptyTimeline}>
            <Text style={styles.emptyTimelineText}>
              No growth timeline photos yet
            </Text>
          </View>
        )}
      </View>
    );
  };

  const renderInfoItems = () => [
    {
      icon: 'water',
      label: `Every ${plant.watering_frequency} ${plant.watering_frequency === 1 ? 'day' : 'days'}`,
    },
    {
      icon: 'sunny',
      label: 'Indirect light',
    },
    {
      icon: 'thermometer',
      label: '18-25°C',
    },
  ];


  const handleWaterPlant = async () => {
    if (!plant?.watering_frequency) {
      console.error('No watering frequency set');
      return;
    }

    // Show alert immediately
    setAlertConfig({
      visible: true,
      message: `Plant watered! Next reminder scheduled in ${plant.watering_frequency} ${
        plant.watering_frequency === 1 ? 'day' : 'days'
      }`,
      type: 'success',
      title: 'Watering Done'
    });

    // Handle database update and notification scheduling in background
    try {
      const currentTime = new Date().toISOString();
      const { error: updateError } = await supabase
        .from('plant')
        .update({ 
          last_watered: currentTime 
        })
        .eq('id', plant.id);

      if (updateError) {
        console.error('Database update error:', updateError);
        throw new Error('Failed to update watering time');
      }

      // Schedule notification in background
      NotificationService.schedulePlantWateringNotification(
        plant.id,
        plant.name,
        plant.watering_frequency
      ).catch(error => {
        console.error('Error scheduling notification:', error);
      });

    } catch (error) {
      console.error('Error in handleWaterPlant:', error);
      // Don't show error alert since success alert is already shown
    }
  };

  const showAlert = (message: string, type = 'success', title = '') => {
    setAlertConfig({
      visible: true,
      message,
      type,
      title
    });
  };

  if (loading || !plant) {
    return (
      <View style={styles.loadingContainer}>
        <Text>Loading plant details...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={24} color="#2D5D54" />
          </TouchableOpacity>
        </View>
        
        <TouchableOpacity onPress={handleImageClick}>
          <CacheImage 
            uri={plant.image_url}
            style={styles.plantImage} 
            resizeMode="cover"
          />
        </TouchableOpacity>

        <View style={styles.contentContainer}>
          <Text style={styles.plantName}>{plant.name}</Text>
          
          <View style={styles.infoContainer}>
            {renderInfoItems().map((item, index) => (
              <View key={index} style={styles.infoItem}>
                <Ionicons name={item.icon} size={28} color="#2D5D54" />
                <Text style={styles.infoText}>{item.label}</Text>
              </View>
            ))}
          </View>
          
          <TouchableOpacity onPress={() => setModalVisible(true)}>
            <Text style={styles.descriptionText}>
              {plant.description?.length > 150 
                ? `${plant.description.substring(0, 150)}...` 
                : plant.description}
            </Text>
            {plant.description?.length > 150 && (
              <Text style={styles.readMore}>Read more...</Text>
            )}
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.waterButton}
            onPress={handleWaterPlant}
          >
            <Ionicons name="water" size={24} color="white" />
            <Text style={styles.waterButtonText}>Water Now</Text>
          </TouchableOpacity>

          {renderTimelineSection()}
        </View>
      </ScrollView>

      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalView}>
          <ScrollView style={styles.modalContent}>
            <Text style={styles.modalTitle}>{plant.name}</Text>
            <Text style={styles.modalText}>{plant.description}</Text>
          </ScrollView>
          <TouchableOpacity 
            style={styles.closeButton}
            onPress={() => setModalVisible(false)}
          >
            <Text style={styles.closeButtonText}>Close</Text>
          </TouchableOpacity>
        </View>
      </Modal>

      <Modal
        visible={!!selectedImage}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setSelectedImage(null)}
      >
        <View style={styles.imagePreviewModal}>
          <TouchableOpacity 
            style={styles.closePreviewButton}
            onPress={() => setSelectedImage(null)}
          >
            <Ionicons name="close" size={24} color="#FFF" />
          </TouchableOpacity>
          {selectedImage && (
            <CacheImage 
              uri={selectedImage.uri}
              style={styles.previewImage}
              tint="light"
              preview={{ uri: selectedImage.uri }}
            />
          )}
        </View>
      </Modal>

      <Modal
        visible={isImageModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setIsImageModalVisible(false)}
      >
        <View style={styles.imageModalContainer}>
          <TouchableOpacity 
            style={styles.closeModalButton}
            onPress={() => setIsImageModalVisible(false)}
          >
            <Ionicons name="close" size={24} color="#FFF" />
          </TouchableOpacity>
          <CacheImage 
            uri={plant.image_url}
            style={styles.fullScreenImage}
            resizeMode="contain"
          />
        </View>
      </Modal>

      <CustomAlert
        visible={alertConfig.visible}
        message={alertConfig.message}
        type={alertConfig.type}
        title={alertConfig.title}
        onClose={() => setAlertConfig(prev => ({ ...prev, visible: false }))}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  scrollContent: {
    flexGrow: 1,
  },
  header: {
    position: 'absolute',
    top: 60, // Updated from 15
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    zIndex: 10,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  plantImage: {
    width: '90%',
    height: 300,
    marginTop: 45,
    borderRadius: 25,
    alignSelf: 'center', // Center the image
    marginHorizontal: 'auto', // Additional centering
  },
  contentContainer: {
    padding: 20,
  },
  plantName: {
    fontSize: 28, 
    fontWeight: '700',
    color: '#2D5D54',
    marginBottom: 16, 
  },
  infoContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#E8F3F1',
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
  },
  infoItem: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 8,
  },
  infoText: {
    marginTop: 8,
    fontSize: 12,
    color: '#2D5D54',
    fontWeight: '500',
    textAlign: 'center',
  },
  descriptionText: {
    fontSize: 16,
    lineHeight: 24,
    color: '#4A6D64',
    marginBottom: 8,
  },
  readMore: {
    color: '#2D5D54',
    fontWeight: '600',
    fontSize: 14,
  },
  waterButton: {
    flexDirection: 'row',
  alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#2D5D54',
    borderRadius: 16,
    paddingVertical: 16,
    marginTop: 30,
    shadowColor: '#2D5D54',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  waterButtonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 18,
    marginLeft: 10,
  },
  modalView: {
    flex: 1,
    backgroundColor: 'white',
    marginTop: 60,
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  modalContent: {
    flex: 1,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#2D5D54',
    marginBottom: 20,
  },
  modalText: {
    fontSize: 16,
    lineHeight: 24,
    color: '#4A6D64',
  },
  closeButton: {
    backgroundColor: '#E8F3F1',
    padding: 15,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 20,
  },
  closeButtonText: {
    color: '#2D5D54',
    fontWeight: '600',
    fontSize: 16,
  },
  catalogueSection: {
    marginTop: 30,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: '#E8F3F1',
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#2D5D54',
    marginBottom: 16,
  },
  monthSection: {
    marginBottom: 24,
  },
  monthTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#357266',
    marginBottom: 12,
    paddingHorizontal: 20,
  },
  monthScroll: {
    paddingHorizontal: 16,
  },
  imageGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -4,
  },
  gridImage: {
    width: '33.33%',
    padding: 4,
  },
  gridImageContent: {
    width: '100%',
    aspectRatio: 1,
    borderRadius: 8,
    backgroundColor: '#F8FAF9',
  },
  imagePreviewModal: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  previewImage: {
    width: '100%',
    height: '80%',
    backgroundColor: '#000',
    borderRadius: 8,
  },
  closePreviewButton: {
    position: 'absolute',
    top: 40,
    right: 20,
    zIndex: 1,
    padding: 10,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  timelineSection: {
    marginTop: 30,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: '#E8F3F1',
  },
  timelineHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    paddingHorizontal: 20,
  },
  timelineCard: {
    width: 200,
    marginRight: 12,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    shadowColor: '#357266',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  timelineImage: {
    width: '100%',
    height: 150,
    borderRadius: 16,
    backgroundColor: '#F5F9F8',
  },
  timelineInfo: {
    padding: 12,
  },
  timelineDate: {
    fontSize: 14,
    color: '#357266',
    fontWeight: '500',
  },
  carousel: {
    width: '100%',
    height: 280,
    marginBottom: 20,
  },
  addPhotoButton: {
    padding: 8,
    backgroundColor: '#E8F3F1',
    borderRadius: 12,
  },
  emptyTimeline: {
    padding: 20,
    alignItems: 'center',
  },
  emptyTimelineText: {
    color: '#6B8C86',
    fontSize: 16,
  },
  imageModalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  fullScreenImage: {
    width: '100%',
    height: '80%',
  },
  closeModalButton: {
    position: 'absolute',
    top: 40,
    right: 20,
    zIndex: 1,
    padding: 10,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: 20,
  },
});

export default PlantDetailScreen;
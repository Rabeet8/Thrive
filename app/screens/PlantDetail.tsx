import React, { useState } from 'react';
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

const { width: screenWidth } = Dimensions.get('window');

type PlantImage = {
  id: string;
  uri: string;
  date: Date;
};

const sampleImages: PlantImage[] = [
  { id: '1', uri: require('../../assets/images/monstera.png'), date: new Date('2024-01-15') },
  { id: '2', uri: require('../../assets/images/monstera.png'), date: new Date('2024-01-20') },
  { id: '3', uri: require('../../assets/images/monstera.png'), date: new Date('2023-12-10') },
  { id: '4', uri: require('../../assets/images/monstera.png'), date: new Date('2023-12-25') },
];

const PlantDetailScreen = ({ route, navigation }) => {
  const { plant } = route.params;
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedImage, setSelectedImage] = useState<PlantImage | null>(null);
  
  const shortDescription = "The Monstera deliciosa is a species of flowering plant native to tropical forests. Popular as a houseplant due to its spectacular leaves and easy care requirements.";
  
  const fullDescription = "The Monstera deliciosa is a species of flowering plant native to tropical forests of southern Mexico, south to Panama. It has been introduced to many tropical areas, and has become a mildly invasive species in Hawaii, Seychelles, Ascension Island and the Society Islands. It is very popular as a houseplant due to its spectacular leaves and its ability to grow in low light conditions.\n\nCare instructions: Water when the top inch of soil is dry. Prefers bright, indirect light but can tolerate lower light conditions. Enjoy the natural fenestration (holes) that develop as the plant matures.";

  const groupImagesByMonth = (images: PlantImage[]) => {
    const grouped = images.reduce((acc, img) => {
      const month = img.date.toLocaleString('default', { month: 'long', year: 'numeric' });
      if (!acc[month]) {
        acc[month] = [];
      }
      acc[month].push(img);
      return acc;
    }, {});
    return Object.entries(grouped).sort((a, b) => 
      new Date(b[0]) - new Date(a[0])
    );
  };

  const renderImageCatalogue = () => (
    <View style={styles.catalogueSection}>
      <Text style={styles.sectionTitle}>Growth Timeline</Text>
      {groupImagesByMonth(sampleImages).map(([month, images]) => (
        <View key={month} style={styles.monthSection}>
          <View style={styles.monthHeader}>
            <Text style={styles.monthTitle}>{month}</Text>
            <Text style={styles.imageCount}>{images.length} photos</Text>
          </View>
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.carouselContainer}
          >
            {images.map((image: PlantImage) => (
              <TouchableOpacity
                key={image.id}
                style={styles.carouselImage}
                onPress={() => setSelectedImage(image)}
              >
                <Image source={image.uri} style={styles.carouselImageContent} />
                <View style={styles.imageDateOverlay}>
                  <Text style={styles.imageDateText}>
                    {image.date.toLocaleDateString('default', { day: 'numeric', month: 'short' })}
                  </Text>
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      ))}
    </View>
  );

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
        
        <Image 
          source={plant.image}
          style={styles.plantImage} 
          resizeMode="cover"
        />
        
        <View style={styles.contentContainer}>
          <Text style={styles.plantName}>{plant.name}</Text>
          
          <View style={styles.infoContainer}>
            <View style={styles.infoItem}>
              <Ionicons name="water" size={28} color="#2D5D54" />
              <Text style={styles.infoText}>Water weekly</Text>
            </View>
            <View style={styles.infoItem}>
              <Ionicons name="leaf" size={28} color="#2D5D54" />
              <Text style={styles.infoText}>Tropical</Text>
            </View>
            <View style={styles.infoItem}>
              <Ionicons name="heart" size={28} color="#2D5D54" />
              <Text style={styles.infoText}>Easy care</Text>
            </View>
          </View>
          
          <TouchableOpacity onPress={() => setModalVisible(true)}>
            <Text style={styles.descriptionText}>{shortDescription}</Text>
            <Text style={styles.readMore}>Read more...</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.waterButton}>
            <Ionicons name="water" size={24} color="white" />
            <Text style={styles.waterButtonText}>Water Now</Text>
          </TouchableOpacity>

          {renderImageCatalogue()}
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
            <Text style={styles.modalText}>{fullDescription}</Text>
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
            <Image 
              source={selectedImage.uri} 
              style={styles.previewImage}
              resizeMode="contain"
            />
          )}
        </View>
      </Modal>
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
    top: 15,
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
    width: '100%',
    height: 300,
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
    justifyContent: 'space-around',
    backgroundColor: '#E8F3F1',
    borderRadius: 16, // reduced from 20
    padding: 16, // reduced from 20
    marginBottom: 20, // reduced from 25
  },
  infoItem: {
    alignItems: 'center',
  },
  infoText: {
    marginTop: 6, // reduced from 8
    fontSize: 12, // reduced from 14
    color: '#2D5D54',
    fontWeight: '500',
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
    fontSize: 22,
    fontWeight: '700',
    color: '#2D5D54',
    marginBottom: 20,
    paddingHorizontal: 4,
  },
  monthSection: {
    marginBottom: 24,
  },
  monthHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    paddingHorizontal: 4,
  },
  monthTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#4A6D64',
  },
  imageCount: {
    fontSize: 14,
    color: '#6B8C86',
    fontWeight: '500',
  },
  carouselContainer: {
    paddingHorizontal: 4,
  },
  carouselImage: {
    width: screenWidth * 0.35,
    marginRight: 12,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#F8FAF9',
    shadowColor: '#357266',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  carouselImageContent: {
    width: '100%',
    height: screenWidth * 0.35,
    borderRadius: 12,
  },
  imageDateOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 8,
    backgroundColor: 'rgba(0,0,0,0.3)',
    borderBottomLeftRadius: 12,
    borderBottomRightRadius: 12,
  },
  imageDateText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '500',
  },
  imagePreviewModal: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  previewImage: {
    width: screenWidth,
    height: screenWidth,
    resizeMode: 'contain',
  },
  closePreviewButton: {
    position: 'absolute',
    top: 40,
    right: 20,
    zIndex: 1,
    padding: 10,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 20,
  },
});

export default PlantDetailScreen;
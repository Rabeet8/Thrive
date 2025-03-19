import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Image,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { supabase } from '../../lib/supabase';
import { decode } from 'base64-arraybuffer';
import CustomAlert from '../components/CustomAlert';

const AddPlantFormScreen = ({ navigation }) => {
  const [plantName, setPlantName] = useState('');
  const [description, setDescription] = useState('');
  const [image, setImage] = useState(null);
  const [isWateringModalVisible, setWateringModalVisible] = useState(false);
  const [selectedWateringDays, setSelectedWateringDays] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [alertConfig, setAlertConfig] = useState({
    visible: false,
    message: '',
    type: 'success',
    title: ''
  });

  const showAlert = (message, type = 'success', title = '', onDismiss = () => {}) => {
    setAlertConfig({
      visible: true,
      message,
      type,
      title
    });
    // Store the onDismiss callback to be called when alert is closed
    alertDismissCallback.current = onDismiss;
  };

  const hideAlert = () => {
    setAlertConfig(prev => ({ ...prev, visible: false }));
    // Call the stored callback when alert is dismissed
    if (alertDismissCallback.current) {
      alertDismissCallback.current();
      alertDismissCallback.current = null;
    }
  };

  // Add ref for storing alert dismiss callback
  const alertDismissCallback = React.useRef(null);

  const pickImage = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    
    if (status !== 'granted') {
      showAlert('Camera permission is required to add plant photos.', 'error', 'Permission Required');
      return;
    }
    
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
    });

    if (!result.canceled) {
      setImage(result.assets[0].uri);
    }
  };

  const uploadImage = async (uri) => {
    try {
      const response = await fetch(uri);
      const blob = await response.blob();
      
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = async () => {
          try {
            const base64 = reader.result.split(',')[1];
            const fileName = `${Date.now()}.jpg`;
            
            const { data, error } = await supabase.storage
              .from('plant-images')
              .upload(fileName, decode(base64), {
                contentType: 'image/jpeg',
                upsert: true
              });

            if (error) throw error;

            const { data: { publicUrl } } = supabase.storage
              .from('plant-images')
              .getPublicUrl(fileName);

            resolve(publicUrl);
          } catch (error) {
            reject(error);
          }
        };
        reader.onerror = (error) => reject(error);
        reader.readAsDataURL(blob);
      });
    } catch (error) {
      console.error('Error uploading image:', error);
      throw error;
    }
  };

  const handleSubmit = async () => {
    if (!plantName.trim()) {
      showAlert('Please enter a plant name', 'warning', 'Missing Information');
      return;
    }
    
    if (!image) {
      showAlert('Please add a plant photo', 'warning', 'Missing Information');
      return;
    }

    try {
      setUploading(true);

      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      if (userError) {
        console.error('User error:', userError);
        throw new Error('Authentication error: ' + userError.message);
      }
      
      if (!user) {
        throw new Error('No authenticated user found');
      }

      const imageUrl = await uploadImage(image);

      const plantData = {
        user_id: user.id,
        name: plantName.trim(),
        description: description?.trim() || '',
        image_url: imageUrl,
        watering_frequency: selectedWateringDays || 0,
      };
      
      const { data, error: insertError } = await supabase
        .from('Plant')
        .insert([plantData])
        .select('*')
        .maybeSingle();

      if (insertError) {
        console.error('Insert error details:', {
          code: insertError.code,
          message: insertError.message,
          details: insertError.details,
          hint: insertError.hint
        });
        throw new Error(`Database error: ${insertError.message}`);
      }

      if (!data) {
        throw new Error('No data returned after insert');
      }

      console.log('Successfully inserted plant:', data);
      showAlert(
        'Plant added successfully!',
        'success',
        'Success',
        () => navigation.goBack() // Navigate only after alert is dismissed
      );
    } catch (error) {
      console.error('Full error details:', {
        name: error.name,
        message: error.message,
        stack: error.stack
      });
      showAlert(
        error.message || 'Unknown error occurred',
        'error',
        'Error Saving Plant'
      );
    } finally {
      setUploading(false);
    }
  };

  const WateringModal = ({ visible, onClose, onSelect }) => {
    const days = Array.from({ length: 30 }, (_, i) => i + 1);
    
    return (
      <Modal
        visible={visible}
        transparent={true}
        animationType="slide"
        onRequestClose={onClose}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Select Watering Frequency</Text>
            <ScrollView style={styles.daysContainer}>
              {days.map((day) => (
                <TouchableOpacity
                  key={day}
                  style={styles.dayOption}
                  onPress={() => {
                    onSelect(day);
                    onClose();
                  }}
                >
                  <Text style={styles.dayText}>
                    {day === 1 ? '1 day' : `${day} days`}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            <TouchableOpacity style={styles.closeModalButton} onPress={onClose}>
              <Text style={styles.closeModalText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.header}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => navigation.goBack()}
            >
              <Ionicons name="arrow-back" size={24} color="#357266" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Add New Plant</Text>
            <View style={{ width: 24 }} />
          </View>

          <View style={styles.imageSection}>
            {image ? (
              <View style={styles.imageContainer}>
                <Image source={{ uri: image }} style={styles.plantImage} />
                <TouchableOpacity
                  style={styles.changeImageButton}
                  onPress={pickImage}
                >
                  <Ionicons name="camera" size={20} color="#FFFFFF" />
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity style={styles.addImageButton} onPress={pickImage}>
                <Ionicons name="camera-outline" size={40} color="#357266" />
                <Text style={styles.addImageText}>Add Plant Photo</Text>
              </TouchableOpacity>
            )}
          </View>

          <View style={styles.formSection}>
            <Text style={styles.label}>Plant Name</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter plant name"
              value={plantName}
              onChangeText={setPlantName}
              placeholderTextColor="#999"
            />

            <Text style={styles.label}>Description</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Enter plant description, care tips, etc."
              value={description}
              onChangeText={setDescription}
              placeholderTextColor="#999"
              multiline
              numberOfLines={5}
              textAlignVertical="top"
            />
            
            <View style={styles.careInfoSection}>
              <Text style={styles.sectionTitle}>Care Information</Text>
              <View style={styles.careInfoItem}>
                <View style={styles.careInfoHeader}>
                  <Ionicons name="water-outline" size={22} color="#357266" />
                  <Text style={styles.careInfoLabel}>Watering Frequency</Text>
                </View>
                <TouchableOpacity 
                  style={styles.careInfoButton}
                  onPress={() => setWateringModalVisible(true)}
                >
                  <Text style={styles.careInfoButtonText}>
                    {selectedWateringDays 
                      ? `Every ${selectedWateringDays} day${selectedWateringDays > 1 ? 's' : ''}`
                      : 'Select frequency'}
                  </Text>
                  <Ionicons name="chevron-down" size={16} color="#357266" />
                </TouchableOpacity>
              </View>
            </View>
          </View>

          <TouchableOpacity 
            style={[styles.submitButton, uploading && styles.submitButtonDisabled]} 
            onPress={handleSubmit}
            disabled={uploading}
          >
            <Text style={styles.submitButtonText}>
              {uploading ? 'Saving...' : 'Add Plant'}
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
      <WateringModal
        visible={isWateringModalVisible}
        onClose={() => setWateringModalVisible(false)}
        onSelect={setSelectedWateringDays}
      />
      <CustomAlert
        visible={alertConfig.visible}
        message={alertConfig.message}
        type={alertConfig.type}
        title={alertConfig.title}
        onClose={hideAlert}
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
    paddingBottom: 40,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 15,
  },
  backButton: {
    padding: 5,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#357266',
  },
  imageSection: {
    alignItems: 'center',
    marginVertical: 20,
  },
  addImageButton: {
    width: 200,
    height: 200,
    borderRadius: 12,
    backgroundColor: '#F8F8F8',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#E0E0E0',
    borderStyle: 'dashed',
  },
  addImageText: {
    marginTop: 10,
    color: '#357266',
    fontWeight: '500',
  },
  imageContainer: {
    width: 200,
    height: 200,
    borderRadius: 12,
    overflow: 'hidden',
  },
  plantImage: {
    width: '100%',
    height: '100%',
  },
  changeImageButton: {
    position: 'absolute',
    bottom: 10,
    right: 10,
    backgroundColor: 'rgba(53, 114, 102, 0.8)',
    borderRadius: 20,
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
  },
  formSection: {
    paddingHorizontal: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#F8F8F8',
    borderRadius: 12,
    padding: 15,
    fontSize: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  textArea: {
    height: 120,
    paddingTop: 15,
  },
  careInfoSection: {
    marginTop: 25,
    backgroundColor: '#F8FAF9',
    borderRadius: 16,
    padding: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#357266',
    marginBottom: 20,
  },
  careInfoItem: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E8F3F1',
  },
  careInfoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  careInfoLabel: {
    fontSize: 16,
    color: '#357266',
    marginLeft: 10,
    fontWeight: '500',
  },
  careInfoButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F8FAF9',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: '#E8F3F1',
  },
  careInfoButtonText: {
    fontSize: 15,
    color: '#357266',
  },
  submitButton: {
    backgroundColor: '#357266',
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 20,
    margin: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 16,
    textAlign: 'center',
  },
  submitButtonDisabled: {
    opacity: 0.7,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 20,
    paddingHorizontal: 16,
    paddingBottom: 30,
    maxHeight: '80%',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#357266',
    textAlign: 'center',
    marginBottom: 20,
  },
  daysContainer: {
    maxHeight: 400,
  },
  dayOption: {
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E8F3F1',
  },
  dayText: {
    fontSize: 16,
    color: '#357266',
    textAlign: 'center',
  },
  closeModalButton: {
    marginTop: 20,
    padding: 16,
    backgroundColor: '#F8FAF9',
    borderRadius: 12,
    alignItems: 'center',
  },
  closeModalText: {
    color: '#357266',
    fontSize: 16,
    fontWeight: '500',
  },
});

export default AddPlantFormScreen;
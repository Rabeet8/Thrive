import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, useWindowDimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface OnboardingStep {
  title: string;
  description: string;
  icon: string;
}

const onboardingSteps: OnboardingStep[] = [
  {
    title: `Never forget to water your plants`,
    description: `Get timely reminders customized to each plant's needs`,
    icon: `water`,
  },
  {
    title: `Track growth with visual timelines`,
    description: `Document your plant's journey with photos and notes`,
    icon: `leaf`,
  },
  {
    title: `Keep a Plant Diary`,
    description: `Record fertilizing schedules, pruning dates, and repotting activities`,
    icon: `calendar`,
  },
];

export default function OnboardingScreen({ onComplete }: { onComplete: () => void }) {
  const [currentStep, setCurrentStep] = useState(0);
  const { width } = useWindowDimensions();

  const handleComplete = async () => {
    try {
      // Set the value before calling onComplete
      await AsyncStorage.setItem('hasSeenOnboarding', 'true');
    } catch (error) {
      console.error('Error saving onboarding status:', error);
    } finally {
      // Always call onComplete even if storage fails
      onComplete();
    }
  };

  const renderItem = ({ item, index }: { item: OnboardingStep; index: number }) => (
    <View style={[styles.slide, { width }]}>
      <Ionicons name={item.icon as any} size={60} color="#357266" />
      <Text style={styles.title}>{item.title}</Text>
      <Text style={styles.description}>{item.description}</Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <FlatList
        data={onboardingSteps}
        renderItem={renderItem}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={(e) => {
          const newIndex = Math.round(e.nativeEvent.contentOffset.x / width);
          setCurrentStep(newIndex);
        }}
        keyExtractor={(_, index) => index.toString()}
      />
      
      <View style={styles.pagination}>
        {onboardingSteps.map((_, index) => (
          <View
            key={index}
            style={[
              styles.paginationDot,
              { backgroundColor: currentStep === index ? '#357266' : '#A5E1AD' }
            ]}
          />
        ))}
      </View>
      
      <TouchableOpacity
        style={styles.button}
        onPress={handleComplete}
      >
        <Text style={styles.buttonText}>
          {currentStep === onboardingSteps.length - 1 ? 'Get Started' : 'Skip'}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white',
  },
  slide: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: '600',
    color: '#357266',
    textAlign: 'center',
    marginTop: 20,
    marginBottom: 10,
  },
  description: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  pagination: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 40,
  },
  paginationDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginHorizontal: 4,
  },
  button: {
    backgroundColor: '#357266',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 30,
    marginHorizontal: 20,
    marginBottom: 40,
  },
  buttonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
  },
});
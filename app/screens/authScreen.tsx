import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
  Keyboard
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { supabase } from '../../lib/supabase';
import AsyncStorage from '@react-native-async-storage/async-storage';
import OnboardingScreen from './OnboardingScreen';
import CustomAlert from '../components/CustomAlert';
type AuthMode = 'login' | 'signup';

interface AuthProps {
  onAuthenticate: () => void;
}

export default function AuthScreen({ onAuthenticate }: { onAuthenticate: () => void }) {
  const [mode, setMode] = useState<AuthMode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showOnboarding, setShowOnboarding] = useState(true);
  const [isInitializing, setIsInitializing] = useState(true);
  const [alertConfig, setAlertConfig] = useState<{
    visible: boolean;
    title: string;
    message: string;
    type: 'success' | 'error' | 'warning';
  }>({
    visible: false,
    title: '',
    message: '',
    type: 'success'
  });
  const router = useRouter();

  useEffect(() => {
    checkOnboardingStatus();
  }, []);

  const checkOnboardingStatus = async () => {
    try {
      const hasSeenOnboarding = await AsyncStorage.getItem('hasSeenOnboarding');
      setShowOnboarding(hasSeenOnboarding !== 'true');
    } catch (error) {
      console.error('Error checking onboarding status:', error);
      setShowOnboarding(false); // Default to not showing onboarding if there's an error
    } finally {
      setIsInitializing(false);
    }
  };

  if (isInitializing) {
    return null; // Or a loading spinner
  }

  if (showOnboarding) {
    return <OnboardingScreen onComplete={() => setShowOnboarding(false)} />;
  }

  const handleSubmit = async () => {
    if (!email || !password) {
      setError('Please fill in all fields');
      return;
    }

    setLoading(true);
    setError('');

    try {
      if (mode === 'signup') {
        if (!name) {
          setError('Please enter your name');
          return;
        }
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              full_name: name,
            },
          },
        });
        if (error) throw error;
        
        setError(''); 
        setEmail('');
        setPassword('');
        setName('');
        setMode('login'); 
        setAlertConfig({
          visible: true,
          title: 'Success',
          message: 'Account created! Please login to continue.',
          type: 'success'
        });
        return;
      } else {
        
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) {
          if (error.message.includes('Email not confirmed')) {
            throw new Error('Please confirm your email before logging in.');
          }
          throw error;
        }
        
        await onAuthenticate();
        router.replace('/screens/HomeScreen');
      }
    } catch (error: any) {
      setError(error.message);
      setAlertConfig({
        visible: true,
        title: 'Error',
        message: error.message,
        type: 'error'
      });
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!email) {
      setAlertConfig({
        visible: true,
        title: 'Error',
        message: 'Please enter your email address',
        type: 'error'
      });
      return;
    }
    

    try {
      const { data, error } = await supabase.auth.resetPasswordForEmail(email);
      if (error) throw error;
      setAlertConfig({
        visible: true,
        title: 'Password Reset',
        message: 'Password reset email has been sent to your email address.',
        type: 'success'
      });
    } catch (error: any) {
      setAlertConfig({
        visible: true,
        title: 'Error',
        message: 'Error sending password reset email. Please try again.',
        type: 'error'
      });
    }
  };

  const toggleMode = () => {
    setMode(mode === 'login' ? 'signup' : 'login');
  };

  

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 25}
    >
      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        bounces={false}
      >
        <TouchableOpacity 
          activeOpacity={1} 
          onPress={Keyboard.dismiss}
          style={styles.dismissKeyboard}
        >
          <View style={styles.logoContainer}>
        <Image 
  source={require('../../assets/images/icon.jpg')} 
  style={[styles.logo, { width: 170}]} 
/>
        <Text style={styles.logoText}>Thrive</Text>
        </View>

        <View style={styles.tabContainer}>
          <TouchableOpacity
            style={[styles.tab, mode === 'login' && styles.activeTab]}
            onPress={() => setMode('login')}
          >
            <Text style={[styles.tabText, mode === 'login' && styles.activeTabText]}>Login</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, mode === 'signup' && styles.activeTab]}
            onPress={() => setMode('signup')}
          >
            <Text style={[styles.tabText, mode === 'signup' && styles.activeTabText]}>Sign Up</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.formContainer}>
          {error ? <Text style={styles.errorText}>{error}</Text> : null}
          
          {mode === 'signup' && (
            <View style={styles.inputContainer}>
              <Ionicons name="person-outline" size={22} color="#357266" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Your Name"
                value={name}
                onChangeText={setName}
                placeholderTextColor="#999"
              />
            </View>
          )}

          <View style={styles.inputContainer}>
            <Ionicons name="mail-outline" size={22} color="#357266" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Email Address"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              placeholderTextColor="#999"
            />
          </View>

          <View style={styles.inputContainer}>
            <Ionicons name="lock-closed-outline" size={22} color="#357266" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Password"
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
              placeholderTextColor="#999"
            />
            <TouchableOpacity 
              style={styles.eyeIcon} 
              onPress={() => setShowPassword(!showPassword)}
            >
              <Ionicons 
                name={showPassword ? "eye-off-outline" : "eye-outline"} 
                size={22} 
                color="#357266" 
              />
            </TouchableOpacity>
          </View>

          {mode === 'login' && (
            <TouchableOpacity 
              style={styles.forgotPassword}
              onPress={handleForgotPassword}
            >
              <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity 
            style={[styles.button, loading && styles.buttonDisabled]}
            onPress={handleSubmit}
            disabled={loading}
          >
            <Text style={styles.buttonText}>
              {loading 
                ? 'Please wait...' 
                : mode === 'login' 
                  ? 'Login' 
                  : 'Create Account'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.switchMode} onPress={toggleMode}>
            <Text style={styles.switchModeText}>
              {mode === 'login' 
                ? "Don't have an account? Sign Up" 
                : "Already have an account? Login"}
            </Text>
          </TouchableOpacity>
        </View>
        </TouchableOpacity>
      </ScrollView>
      <CustomAlert
        visible={alertConfig.visible}
        title={alertConfig.title}
        message={alertConfig.message}
        type={alertConfig.type}
        onClose={() => setAlertConfig(prev => ({ ...prev, visible: false }))}
      />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: Platform.OS === 'ios' ? 100 : 80,
    marginTop: 40, 
  },
  logoText: {
    fontSize: 20,
    fontWeight: '800',
    color: '#357266',  
    },
  logoContainer: {
    alignItems: 'center',
    marginTop: 60,
    marginBottom: 30,
  },
  logo: {
    width: 80,
    height: 50,
    resizeMode: 'contain',
  },
  appName: {
    fontSize: 24,
    fontWeight: '600',
    color: '#357266',
    marginTop: 10,
  },
  tabContainer: {
    flexDirection: 'row',
    marginHorizontal: 20,
    marginBottom: 20,
    borderRadius: 10,
    backgroundColor: '#F5F5F5',
    padding: 5,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 8,
  },
  activeTab: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  tabText: {
    fontWeight: '500',
    color: '#777',
  },
  activeTabText: {
    color: '#357266',
    fontWeight: '600',
  },
  formContainer: {
    paddingHorizontal: 20,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 12,
    height: 55,
    marginBottom: 16,
    paddingHorizontal: 15,
    backgroundColor: '#FAFAFA',
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    height: '100%',
    color: '#333',
  },
  eyeIcon: {
    padding: 5,
  },
  forgotPassword: {
    alignSelf: 'flex-end',
    marginBottom: 20,
  },
  forgotPasswordText: {
    color: '#357266',
    fontWeight: '500',
  },
  button: {
    backgroundColor: '#357266',
    height: 55,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  buttonDisabled: {
    backgroundColor: '#A5A5A5',
    opacity: 0.7,
  },
  switchMode: {
    alignItems: 'center',
    marginTop:10,
  },
  switchModeText: {
    color: '#357266',
    fontWeight: '500',
  },
  errorText: {
    color: '#FF3B30',
    fontSize: 14,
    marginBottom: 16,
    textAlign: 'center',
  },
  dismissKeyboard: {
    flex: 1,
  },
});
import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

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
  const router = useRouter();

  const handleSubmit = () => {
    // Here you would implement actual authentication logic
    console.log(`Submitting ${mode} with email: ${email}`);
    // onAuthenticate();
  };

  const toggleMode = () => {
    setMode(mode === 'login' ? 'signup' : 'login');
  };

  const handleNext = async () => {
    await onAuthenticate();
    router.replace('/screens/HomeScreen');
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.logoContainer}>
        <Image 
  source={require('../../assets/images/icon.jpg')} 
  style={[styles.logo, { width: 170}]}  // Increased from 80 to 120
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
            <TouchableOpacity style={styles.forgotPassword}>
              <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity style={styles.button} onPress={handleSubmit}>
            <Text style={styles.buttonText}>
              {mode === 'login' ? 'Login' : 'Create Account'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.button} onPress={handleNext}>
            <Text style={styles.buttonText}>
              { 'Next' }
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
      </ScrollView>
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
    paddingBottom: 40,
  },
  logoText: {
    fontSize: 20,
    fontWeight: '800',
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
  
  switchMode: {
    alignItems: 'center',
    marginTop:10,
  },
  switchModeText: {
    color: '#357266',
    fontWeight: '500',
  },
});
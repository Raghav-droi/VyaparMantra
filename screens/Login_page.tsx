import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  Animated,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { getAuth, signInWithPhoneNumber, PhoneAuthProvider, signInWithCredential, signInWithCustomToken } from '@react-native-firebase/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';
// import { Eye, EyeOff, CheckCircle, RefreshCw } from 'lucide-react-native';
import { useNavigation } from '../App';

type LoginStep = 'phone' | 'otp' | 'password' | 'success';

interface LoginPageProps {
  userType: 'retail' | 'wholesale';
}

export default function LoginPage({ userType }: LoginPageProps) {
  const navigation = useNavigation();
  const auth = getAuth();
  
  console.log('LoginPage rendered with userType:', userType);
  
  // State management
  const [currentStep, setCurrentStep] = useState<LoginStep>('phone');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [password, setPassword] = useState('');
  const [confirmation, setConfirmation] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showOtp, setShowOtp] = useState(false);
  const [otpTimer, setOtpTimer] = useState(0);
  const [canResendOtp, setCanResendOtp] = useState(false);
  const [hasNavigated, setHasNavigated] = useState(false);
  
  // Refs for focus management
  const phoneRef = useRef<TextInput>(null);
  const otpRef = useRef<TextInput>(null);
  const passwordRef = useRef<TextInput>(null);
  
  // Animation
  const successPulse = useRef(new Animated.Value(1)).current;

  // OTP Timer
  useEffect(() => {
    if (currentStep === 'otp' && otpTimer > 0) {
      const timer = setTimeout(() => setOtpTimer(prev => prev - 1), 1000);
      return () => clearTimeout(timer);
    } else if (otpTimer === 0) {
      setCanResendOtp(true);
    }
  }, [currentStep, otpTimer]);

  // Success animation
  useEffect(() => {
    if (currentStep === 'success') {
      const animation = Animated.loop(
        Animated.sequence([
          Animated.timing(successPulse, {
            toValue: 1.1,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.timing(successPulse, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
          }),
        ])
      );
      animation.start();
      return () => animation.stop();
    }
  }, [currentStep, successPulse]);

  // Auto-navigation after success
  useEffect(() => {
    if (currentStep === 'success' && !hasNavigated) {
      console.log('Success step reached, userType:', userType, 'hasNavigated:', hasNavigated);
      const timer = setTimeout(() => {
        console.log('Navigating to dashboard for userType:', userType);
        setHasNavigated(true);
        if (userType === 'wholesale') {
          console.log('Navigating to WholesalerDashboard');
          navigation.navigate('WholesalerDashboard');
        } else {
          console.log('Navigating to RetailerDashboard');
          navigation.navigate('RetailerDashboard');
        }
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [currentStep, hasNavigated, userType, navigation]);

  // Phone number validation
  const isValidPhone = (phoneNumber: string) => {
    return /^[6-9]\d{9}$/.test(phoneNumber);
  };

  // Handle phone number input
  const handlePhoneChange = (text: string) => {
    const cleaned = text.replace(/\D/g, '');
    if (cleaned.length <= 10) {
      setPhone(cleaned);
    }
  };

  // Handle OTP input
  const handleOtpChange = (text: string) => {
    const cleaned = text.replace(/\D/g, '');
    if (cleaned.length <= 6) {
      setOtp(cleaned);
    }
  };

  // Send OTP
  const handleSendOtp = async () => {
    if (!isValidPhone(phone)) {
      Alert.alert('Invalid Phone', 'Please enter a valid 10-digit mobile number');
      return;
    }

    setIsLoading(true);
    try {
      const phoneNumber = `+91${phone}`;
      const confirmationResult = await signInWithPhoneNumber(auth, phoneNumber);
      setConfirmation(confirmationResult);
      setCurrentStep('otp');
      setOtpTimer(60);
      setCanResendOtp(false);
    } catch (error: any) {
      console.error('OTP send error:', error);
      Alert.alert('Error', 'Failed to send OTP. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Verify OTP
  const handleVerifyOtp = async () => {
    if (otp.length !== 6) {
      Alert.alert('Invalid OTP', 'Please enter the 6-digit OTP');
      return;
    }

    setIsLoading(true);
    try {
      const credential = PhoneAuthProvider.credential(confirmation.verificationId, otp);
      await signInWithCredential(auth, credential);
      setCurrentStep('success');
    } catch (error: any) {
      console.error('OTP verification error:', error);
      Alert.alert('Error', 'Invalid OTP. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Password login
  const handlePasswordLogin = async () => {
    if (!isValidPhone(phone)) {
      Alert.alert('Invalid Phone', 'Please enter a valid 10-digit mobile number');
      return;
    }

    if (!password.trim()) {
      Alert.alert('Invalid Password', 'Please enter your password');
      return;
    }

    setIsLoading(true);
    try {
      console.log('Attempting password login for phone:', phone, 'userType:', userType);
      const endpoint = userType === 'wholesale' ? 'loginWithPassword' : 'loginWithPassword/retailer-login';
      const response = await fetch(`https://asia-south1-vm-authentication-4d4ea.cloudfunctions.net/${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          phone: phone,
          password: password,
        }),
      });

      console.log('Response status:', response.status);
      console.log('Response headers:', response.headers);
      
      // Check if response is ok
      if (!response.ok) {
        const errorText = await response.text();
        console.error('HTTP error response:', errorText);
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      // Check if response is JSON
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        const text = await response.text();
        console.error('Non-JSON response:', text);
        throw new Error('Server returned non-JSON response');
      }

      const data = await response.json();
      console.log('Response data:', data);
      
      if (data.token) {
        // Login successful - authenticate with Firebase using the custom token
        try {
          const auth = getAuth();
          console.log('Signing in with custom token...');
          
          // Sign in with the custom token
          await signInWithCustomToken(auth, data.token);
          console.log('Successfully signed in with custom token');
          
          const actualUserType = data.userType || userType; // Use server response or fallback to prop
          
          // Validate that the user type matches what we're trying to log in as
          if (data.userType && data.userType !== userType) {
            Alert.alert('Login Failed', `This phone number is registered as a ${data.userType === 'wholesale' ? 'Wholesaler' : 'Retailer'}. Please use the correct login option.`);
            return;
          }
          
          try {
            const timestamp = Date.now();
            await AsyncStorage.setItem(`userType_${phone}`, actualUserType);
            await AsyncStorage.setItem(`userType_${phone}_timestamp`, timestamp.toString());
            console.log('Stored user type:', actualUserType, 'for phone:', phone, 'at timestamp:', timestamp);
          } catch (storageError) {
            console.error('Error storing user type:', storageError);
          }
        } catch (authError) {
          console.error('Error signing in with custom token:', authError);
          Alert.alert('Authentication Error', 'Failed to authenticate with Firebase. Please try again.');
          return;
        }
        setCurrentStep('success');
      } else {
        Alert.alert('Login Failed', data.message || 'Invalid credentials');
      }
    } catch (error) {
      console.error('Password login error:', error);
      Alert.alert('Error', 'Login failed. Please try again or use OTP login.');
    } finally {
      setIsLoading(false);
    }
  };

  // Resend OTP
  const handleResendOtp = async () => {
    setOtp('');
    await handleSendOtp();
  };

  // Switch to password login
  const switchToPassword = () => {
              setCurrentStep('password');
    setPassword('');
    setTimeout(() => passwordRef.current?.focus(), 100);
  };

  // Switch to OTP login
  const switchToOtp = () => {
              setCurrentStep('phone');
    setPhone('');
    setTimeout(() => phoneRef.current?.focus(), 100);
  };

  // Render phone input step
  const renderPhoneStep = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>Enter Mobile Number</Text>
      <Text style={styles.stepSubtitle}>
        We'll send you a verification code
      </Text>
      
      <View style={styles.inputContainer}>
              <View style={styles.phoneRow}>
                <Text style={styles.prefix}>+91</Text>
                <TextInput
            ref={phoneRef}
            style={styles.phoneInput}
            value={phone}
                  onChangeText={handlePhoneChange}
            placeholder="Enter 10-digit mobile number"
                  keyboardType="number-pad"
                  maxLength={10}
                  autoFocus={true}
            returnKeyType="done"
            blurOnSubmit={false}
            onSubmitEditing={handleSendOtp}
            autoCorrect={false}
            autoCapitalize="none"
                />
              </View>
            </View>

                <TouchableOpacity
        style={[styles.primaryBtn, (!isValidPhone(phone) || isLoading) && styles.disabledBtn]}
        onPress={handleSendOtp}
        disabled={!isValidPhone(phone) || isLoading}
            >
              {isLoading ? (
                  <ActivityIndicator color="#fff" />
              ) : (
          <Text style={styles.primaryBtnText}>Send OTP</Text>
              )}
            </TouchableOpacity>

      <TouchableOpacity style={styles.secondaryBtn} onPress={switchToPassword}>
        <Text style={styles.secondaryBtnText}>Login with Password</Text>
          </TouchableOpacity>
      </View>
    );

  // Render OTP input step
  const renderOtpStep = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>Enter OTP</Text>
      <Text style={styles.stepSubtitle}>
        We've sent a 6-digit code to +91{phone}
      </Text>
      
      <View style={styles.inputContainer}>
        <View style={styles.otpContainer}>
              <TextInput
            ref={otpRef}
            style={styles.otpInput}
            value={otp}
            onChangeText={handleOtpChange}
            placeholder="Enter 6-digit OTP"
                keyboardType="number-pad"
            maxLength={6}
                autoFocus={true}
            secureTextEntry={!showOtp}
            returnKeyType="done"
            blurOnSubmit={true}
            onSubmitEditing={handleVerifyOtp}
            autoCorrect={false}
            autoCapitalize="none"
          />
          <TouchableOpacity
            style={styles.eyeBtn}
            onPress={() => setShowOtp(!showOtp)}
          >
            <Text style={styles.eyeText}>{showOtp ? '🙈' : '👁️'}</Text>
          </TouchableOpacity>
        </View>
      </View>

              <TouchableOpacity
        style={[styles.primaryBtn, (otp.length !== 6 || isLoading) && styles.disabledBtn]}
                onPress={handleVerifyOtp}
        disabled={otp.length !== 6 || isLoading}
              >
                {isLoading ? (
                    <ActivityIndicator color="#fff" />
                ) : (
          <Text style={styles.primaryBtnText}>Verify OTP</Text>
                )}
              </TouchableOpacity>

      <View style={styles.resendContainer}>
        {otpTimer > 0 ? (
          <Text style={styles.timerText}>Resend OTP in {otpTimer}s</Text>
        ) : (
          <TouchableOpacity onPress={handleResendOtp} disabled={isLoading}>
            <Text style={styles.resendText}>Resend OTP</Text>
              </TouchableOpacity>
            )}
          </View>

      <TouchableOpacity style={styles.secondaryBtn} onPress={switchToOtp}>
        <Text style={styles.secondaryBtnText}>Change Number</Text>
      </TouchableOpacity>
    </View>
  );

  // Render password input step
  const renderPasswordStep = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>Enter Password</Text>
      <Text style={styles.stepSubtitle}>
        Login with your password for +91{phone}
      </Text>
      
      <View style={styles.inputContainer}>
        <View style={styles.passwordRow}>
          <TextInput
            ref={passwordRef}
            style={styles.passwordInput}
            value={password}
            onChangeText={setPassword}
            placeholder="Enter your password"
            secureTextEntry={!showPassword}
            maxLength={32}
            autoFocus={true}
            returnKeyType="done"
            blurOnSubmit={true}
            onSubmitEditing={handlePasswordLogin}
            autoCorrect={false}
            autoCapitalize="none"
          />
          <TouchableOpacity
            style={styles.eyeBtn}
            onPress={() => setShowPassword(!showPassword)}
          >
            <Text style={styles.eyeText}>{showPassword ? '🙈' : '👁️'}</Text>
          </TouchableOpacity>
        </View>
      </View>

      <TouchableOpacity
        style={[styles.primaryBtn, (!password.trim() || isLoading) && styles.disabledBtn]}
        onPress={handlePasswordLogin}
        disabled={!password.trim() || isLoading}
      >
        {isLoading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.primaryBtnText}>Login</Text>
        )}
      </TouchableOpacity>

      <TouchableOpacity style={styles.secondaryBtn} onPress={switchToOtp}>
        <Text style={styles.secondaryBtnText}>Login with OTP</Text>
      </TouchableOpacity>
      </View>
    );

  // Render success step
  const renderSuccessStep = () => (
    <View style={styles.stepContainer}>
      <Animated.View style={[styles.successIcon, { transform: [{ scale: successPulse }] }]}>
        <Text style={styles.successIconText}>✅</Text>
          </Animated.View>
      
          <Text style={styles.successTitle}>Login Successful!</Text>
      <Text style={styles.successSubtitle}>
        Welcome back to your {userType === 'wholesale' ? 'wholesaler' : 'retailer'} dashboard
          </Text>
      
      <View style={styles.successInfo}>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Phone Number</Text>
          <Text style={styles.infoValue}>+91 {phone}</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Status</Text>
          <Text style={styles.statusBadge}>Verified</Text>
        </View>
      </View>
      
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingIcon}>🔄</Text>
        <Text style={styles.loadingText}>Redirecting to dashboard...</Text>
      </View>
    </View>
  );

  return (
      <KeyboardAvoidingView
      style={styles.container} 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.header}>
        <Text style={styles.title}>Welcome Back</Text>
        <Text style={styles.subtitle}>
          {userType === 'wholesale' ? 'Wholesaler' : 'Retailer'} Login
        </Text>
          </View>

      <View style={styles.content}>
        {currentStep === 'phone' && renderPhoneStep()}
        {currentStep === 'otp' && renderOtpStep()}
        {currentStep === 'password' && renderPasswordStep()}
        {currentStep === 'success' && renderSuccessStep()}
        </View>
      </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    paddingTop: 60,
    paddingHorizontal: 24,
    paddingBottom: 32,
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1e3a8a',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#6b7280',
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
  },
  stepContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  stepTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1f2937',
    textAlign: 'center',
    marginBottom: 8,
  },
  stepSubtitle: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
    marginBottom: 32,
  },
  inputContainer: {
    marginBottom: 24,
  },
  phoneRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    paddingHorizontal: 16,
    height: 56,
  },
  prefix: {
    fontSize: 16,
    color: '#6b7280',
    marginRight: 8,
    fontWeight: '500',
  },
  phoneInput: {
    flex: 1,
    fontSize: 16,
    color: '#111827',
  },
  otpContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    paddingHorizontal: 16,
    height: 56,
  },
  otpInput: {
    flex: 1,
    fontSize: 20,
    color: '#111827',
    letterSpacing: 4,
    textAlign: 'center',
  },
  passwordRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    paddingHorizontal: 16,
    height: 56,
  },
  passwordInput: {
    flex: 1,
    fontSize: 16,
    color: '#111827',
  },
  eyeBtn: {
    padding: 8,
  },
  eyeText: {
    fontSize: 20,
  },
  successIconText: {
    fontSize: 64,
  },
  loadingIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  primaryBtn: {
    backgroundColor: '#1e3a8a',
    height: 56,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  primaryBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  disabledBtn: {
    backgroundColor: '#9ca3af',
  },
  secondaryBtn: {
    height: 56,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    backgroundColor: '#fff',
  },
  secondaryBtnText: {
    color: '#1e3a8a',
    fontSize: 16,
    fontWeight: '500',
  },
  resendContainer: {
    alignItems: 'center',
    marginBottom: 16,
  },
  timerText: {
    color: '#6b7280',
    fontSize: 14,
  },
  resendText: {
    color: '#1e3a8a',
    fontSize: 14,
    fontWeight: '500',
  },
  successIcon: {
    alignItems: 'center',
    marginBottom: 24,
  },
  successTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#16a34a',
    textAlign: 'center',
    marginBottom: 8,
  },
  successSubtitle: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
    marginBottom: 32,
  },
  successInfo: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  infoLabel: {
    fontSize: 14,
    color: '#6b7280',
  },
  infoValue: {
    fontSize: 14,
    color: '#111827',
    fontWeight: '500',
  },
  statusBadge: {
    backgroundColor: '#dcfce7',
    color: '#16a34a',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    fontSize: 12,
    fontWeight: '500',
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    color: '#6b7280',
    fontSize: 14,
    marginLeft: 8,
  },
});

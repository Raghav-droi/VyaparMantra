import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  Animated,
  Alert,
  StyleSheet,
} from 'react-native';
import auth, { getAuth } from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  Phone,
  ArrowRight,
  ArrowLeft,
  Shield,
  CheckCircle,
  Clock,
  RefreshCw,
  Lock,
  MessageSquare,
  Eye,
  EyeOff,
} from 'lucide-react-native';
import { useNavigation } from '../App';

type LoginStep = 'method' | 'password' | 'phone' | 'otp' | 'success';
type LoginMethod = 'password' | 'otp';

export function LoginPage({ userType: propUserType }: { userType?: string }) {
  const navigation = useNavigation();
  const userType = propUserType || navigation.params?.userType || 'wholesale'; // default to wholesaler

  const [currentStep, setCurrentStep] = useState<LoginStep>('method');
  const [loginMethod, setLoginMethod] = useState<LoginMethod>('password');
  const [passwordPhone, setPasswordPhone] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [otpPhone, setOtpPhone] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [otpTimer, setOtpTimer] = useState(30);
  const [canResendOtp, setCanResendOtp] = useState(false);
  const [confirmation, setConfirmation] = useState<any>(null);
  const [userTypeState, setUserTypeState] = useState<string | null>(null);
  const [phone, setPhone] = useState('');
  const [showOtp, setShowOtp] = useState(false);
  const [hasNavigated, setHasNavigated] = useState(false);
  const successPulse = useRef(new Animated.Value(1)).current;
  
  // Stable TextInput components to prevent re-renders
  const PasswordPhoneInput = React.memo(() => (
    <TextInput
      value={passwordPhone}
      onChangeText={(text) => setPasswordPhone(text.replace(/\D/g, '').slice(0, 10))}
      keyboardType="number-pad"
      placeholder="Enter 10-digit mobile number"
      style={styles.phoneInput}
      maxLength={10}
      autoFocus={true}
      returnKeyType="next"
      blurOnSubmit={false}
      autoCorrect={false}
      autoCapitalize="none"
    />
  ));

  const PasswordInput = React.memo(() => (
    <TextInput
      value={password}
      onChangeText={setPassword}
      placeholder="Enter your password"
      style={styles.passwordInput}
      secureTextEntry={!showPassword}
      maxLength={32}
      returnKeyType="done"
      blurOnSubmit={true}
      autoCorrect={false}
      autoCapitalize="none"
    />
  ));

  const OtpPhoneInput = React.memo(() => (
    <TextInput
      value={otpPhone}
      onChangeText={(text) => setOtpPhone(text.replace(/\D/g, '').slice(0, 10))}
      keyboardType="number-pad"
      placeholder="Enter 10-digit mobile number"
      style={styles.phoneInput}
      maxLength={10}
      autoFocus={true}
      returnKeyType="next"
      blurOnSubmit={false}
      autoCorrect={false}
      autoCapitalize="none"
    />
  ));

  const OtpCodeInput = React.memo(() => (
    <TextInput
      value={otpCode}
      onChangeText={(text) => setOtpCode(text.replace(/\D/g, '').slice(0, 6))}
      keyboardType="number-pad"
      placeholder="Enter 6-digit OTP"
      style={styles.otpInputField}
      maxLength={6}
      autoFocus={true}
      secureTextEntry={!showOtp}
      placeholderTextColor="#9ca3af"
      returnKeyType="done"
      blurOnSubmit={true}
      autoCorrect={false}
      autoCapitalize="none"
    />
  ));

  // OTP Timer countdown
  useEffect(() => {
    if (currentStep === 'otp' && otpTimer > 0) {
      const timer = setTimeout(() => setOtpTimer((prev) => prev - 1), 1000);
      return () => clearTimeout(timer);
    } else if (otpTimer === 0) {
      setCanResendOtp(true);
    }
  }, [currentStep, otpTimer]);

  // Success pulse animation
  useEffect(() => {
    if (currentStep === 'success') {
      Animated.loop(
        Animated.sequence([
          Animated.timing(successPulse, { toValue: 1.08, duration: 700, useNativeDriver: true }),
          Animated.timing(successPulse, { toValue: 1, duration: 700, useNativeDriver: true }),
        ]),
      ).start();
    }
  }, [currentStep, successPulse]);

  // Password Login Handler
  const handlePasswordLogin = async () => {
    if (passwordPhone.length !== 10 || password.length < 6) {
      Alert.alert('Error', 'Enter valid phone and password');
      return;
    }
    setIsLoading(true);
    try {
      // Use the correct endpoint based on userType
      const endpoint = userType === 'retail' 
        ? 'https://asia-south1-vm-authentication-4d4ea.cloudfunctions.net/loginWithPassword/retailer-login'
        : 'https://asia-south1-vm-authentication-4d4ea.cloudfunctions.net/loginWithPassword';
      
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: passwordPhone, password }),
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        Alert.alert('Error', errorText || 'Login failed');
        setIsLoading(false);
        return;
      }
      const { token } = await response.json();
      await auth().signInWithCustomToken(token);

      // Store the user type for future reference
      setUserTypeState(userType);
      
      try {
        await AsyncStorage.setItem(`userType_${passwordPhone}`, userType);
        console.log(`Stored user type: ${userType} for phone: ${passwordPhone}`);
      } catch (error) {
        console.log('Error storing user type:', error);
      }
      
      // Set success step to show success message and auto-navigate
      setCurrentStep('success');
      console.log('Login successful, showing success step');
    } catch (err) {
      Alert.alert('Error', 'Login failed');
    }
    setIsLoading(false);
  };

  // OTP Login Handlers
  const handleSendOtp = async () => {
    if (otpPhone.length !== 10) {
      Alert.alert('Error', 'Enter valid phone number');
      return;
    }
    setIsLoading(true);
    try {
      const collectionName = userType === 'retail' ? 'retailer' : 'wholesaler';
      const userDoc = await firestore().collection(collectionName).doc(otpPhone).get();
      if (!userDoc.exists) {
        Alert.alert('Error', 'Phone number not registered');
        setIsLoading(false);
        return;
      }
      const confirmationResult = await getAuth().signInWithPhoneNumber('+91' + otpPhone);
      setConfirmation(confirmationResult);
      setCurrentStep('otp');
      setOtpTimer(30);
      setCanResendOtp(false);
      setOtpCode('');
      setShowOtp(false);
      Alert.alert('OTP Sent', 'Check your SMS for the OTP');
    } catch (err) {
      Alert.alert('Error', 'Failed to send OTP');
    }
    setIsLoading(false);
  };

  const handleVerifyOtp = async () => {
    if (otpCode.length !== 6) {
      Alert.alert('Error', 'Enter the complete 6-digit OTP');
      return;
    }
    if (!confirmation) {
      Alert.alert('Error', 'No OTP confirmation found');
      return;
    }
    setIsLoading(true);
    try {
      await confirmation.confirm(otpCode);
      setCurrentStep('success');
      
      // Store the user type for future reference
      try {
        await AsyncStorage.setItem(`userType_${otpPhone}`, userType);
        console.log(`Stored user type: ${userType} for phone: ${otpPhone}`);
      } catch (error) {
        console.log('Error storing user type:', error);
      }
      
      // Let App.tsx handle the navigation based on user type
      console.log('OTP verification successful, App.tsx will handle navigation');
    } catch (err) {
      Alert.alert('Error', 'Invalid OTP');
    }
    setIsLoading(false);
  };

  const handleResendOtp = async () => {
    setIsLoading(true);
    try {
      const confirmationResult = await getAuth().signInWithPhoneNumber('+91' + otpPhone);
      setConfirmation(confirmationResult);
      setOtpTimer(30);
      setCanResendOtp(false);
      setOtpCode('');
      setShowOtp(false);
      Alert.alert('OTP Sent', 'Check your SMS for the OTP');
    } catch (err) {
      Alert.alert('Error', 'Failed to resend OTP');
    }
    setIsLoading(false);
  };

  // UI Components
  const MethodStep = () => (
    <View style={styles.card}>
      <View style={styles.cardBody}>
        <View style={styles.headerCenter}>
          <View style={styles.iconCircleBlue}>
            <Shield color="#2563eb" size={32} />
          </View>
          <Text style={styles.title}>
            {userType === 'retail' ? 'Retailer Login' : 'Wholesaler Login'}
          </Text>
          <Text style={styles.muted}>Choose your preferred login method</Text>
        </View>
        <View>
          <TouchableOpacity
            style={[styles.methodBtn, { marginBottom: 12 }]}
            onPress={() => {
              setLoginMethod('password');
              setCurrentStep('password');
            }}
          >
            <View style={styles.methodIconCircle}>
              <Lock color="#2563eb" size={22} />
            </View>
            <View>
              <Text style={styles.methodTitle}>Login with Password</Text>
              <Text style={styles.methodDesc}>Use your phone number and password</Text>
            </View>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.methodBtn}
            onPress={() => {
              setLoginMethod('otp');
              setCurrentStep('phone');
            }}
          >
            <View style={[styles.methodIconCircle, { backgroundColor: "#bbf7d0" }]}>
              <MessageSquare color="#16a34a" size={22} />
            </View>
            <View>
              <Text style={styles.methodTitle}>Login with OTP</Text>
              <Text style={styles.methodDesc}>Get a verification code via SMS</Text>
            </View>
          </TouchableOpacity>
        </View>
        <View style={styles.infoBoxOrange}>
          <View style={styles.rowCenter}>
            <Shield size={16} color="#c2410c" />
            <Text style={styles.infoTitle}>  Secure & Verified</Text>
          </View>
          <Text style={styles.infoText}>
            {userType === 'retail'
              ? 'Join thousands of verified retailers. Quick setup, instant access to wholesalers.'
              : 'Join thousands of verified wholesalers. Quick setup, instant access to retailers.'}
          </Text>
        </View>
        <Text style={styles.footerNote}>
          By continuing, you agree to our Terms of Service and Privacy Policy
        </Text>
      </View>
    </View>
  );

  const PasswordStep = () => {
    return (
      <View style={styles.card}>
        <View style={styles.cardBody}>
          <View style={styles.headerCenter}>
            <View style={styles.iconCircleBlue}>
              <Lock color="#2563eb" size={32} />
            </View>
            <Text style={styles.title}>Login with Password</Text>
            <Text style={styles.muted}>Enter your credentials to continue</Text>
          </View>
          <View>
            <View style={{ marginBottom: 12 }}>
              <Text style={styles.label}>Phone Number</Text>
              <View style={styles.phoneRow}>
                <Text style={styles.prefix}>+91</Text>
                <PasswordPhoneInput />
              </View>
            </View>
            <View style={{ marginBottom: 12 }}>
              <Text style={styles.label}>Password</Text>
              <View style={styles.passwordRow}>
                <PasswordInput />
                <TouchableOpacity
                  onPress={() => setShowPassword(!showPassword)}
                  style={styles.eyeBtn}
                >
                  {showPassword ? (
                    <EyeOff color="#888" size={20} />
                  ) : (
                    <Eye color="#888" size={20} />
                  )}
                </TouchableOpacity>
              </View>
            </View>
            <TouchableOpacity
              onPress={handlePasswordLogin}
              disabled={passwordPhone.length !== 10 || password.length < 6 || isLoading}
              style={[
                styles.primaryBtn,
                (passwordPhone.length !== 10 || password.length < 6 || isLoading) && styles.btnDisabled,
              ]}
              activeOpacity={0.8}
            >
              {isLoading ? (
                <View style={styles.btnContent}>
                  <RefreshCw size={18} color="#fff" style={{ marginRight: 8 }} />
                  <ActivityIndicator color="#fff" />
                  <Text style={styles.btnText}>  Signing In...</Text>
                </View>
              ) : (
                <View style={styles.btnContent}>
                  <Text style={styles.btnText}>Sign In</Text>
                  <ArrowRight size={18} color="#fff" style={{ marginLeft: 8 }} />
                </View>
              )}
            </TouchableOpacity>
          </View>
          <TouchableOpacity style={styles.ghostBtn}>
            <Text style={styles.ghostText}>Forgot Password?</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.outlineBtn}
            onPress={() => setCurrentStep('method')}
          >
            <View style={styles.rowCenter}>
              <ArrowLeft size={16} color="#111827" style={{ marginRight: 8 }} />
              <Text style={styles.outlineText}>Back to Login Options</Text>
            </View>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const PhoneStep = () => {
    return (
      <View style={styles.card}>
        <View style={styles.cardBody}>
          <View style={styles.headerCenter}>
            <View style={styles.iconCircleGreen}>
              <MessageSquare color="#16a34a" size={32} />
            </View>
            <Text style={styles.title}>Login with OTP</Text>
            <Text style={styles.muted}>Enter your phone number to receive an OTP</Text>
          </View>
          <View>
            <Text style={styles.label}>Phone Number</Text>
            <View style={styles.phoneRow}>
              <Text style={styles.prefix}>+91</Text>
              <OtpPhoneInput />
            </View>
            <TouchableOpacity
              onPress={handleSendOtp}
              disabled={otpPhone.length !== 10 || isLoading}
              style={[
                styles.primaryBtn,
                (otpPhone.length !== 10 || isLoading) && styles.btnDisabled,
              ]}
              activeOpacity={0.8}
            >
              {isLoading ? (
                <View style={styles.btnContent}>
                  <RefreshCw size={18} color="#fff" style={{ marginRight: 8 }} />
                  <ActivityIndicator color="#fff" />
                  <Text style={styles.btnText}>  Sending OTP...</Text>
                </View>
              ) : (
                <View style={styles.btnContent}>
                  <Text style={styles.btnText}>Send OTP</Text>
                  <ArrowRight size={18} color="#fff" style={{ marginLeft: 8 }} />
                </View>
              )}
            </TouchableOpacity>
          </View>
          <TouchableOpacity
            style={styles.outlineBtn}
            onPress={() => setCurrentStep('method')}
          >
            <View style={styles.rowCenter}>
              <ArrowLeft size={16} color="#111827" style={{ marginRight: 8 }} />
              <Text style={styles.outlineText}>Back to Login Options</Text>
            </View>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const OtpStep = () => {
    return (
      <View style={styles.card}>
        <View style={styles.cardBody}>
          <View style={styles.headerCenter}>
            <View style={styles.iconCircleGreen}>
              <CheckCircle color="#16a34a" size={32} />
            </View>
            <Text style={styles.title}>Verify OTP</Text>
            <Text style={styles.muted}>
              We've sent a 6-digit code to{'\n'}
              <Text style={styles.boldLine}>+91 {otpPhone}</Text>
            </Text>
          </View>
          <View>
            <View style={{ marginBottom: 12 }}>
              <Text style={styles.label}>Enter OTP</Text>
              <View style={styles.otpInputContainer}>
                <OtpCodeInput />
                <TouchableOpacity
                  onPress={() => setShowOtp(!showOtp)}
                  style={styles.otpEyeBtn}
                >
                  {showOtp ? (
                    <EyeOff color="#888" size={20} />
                  ) : (
                    <Eye color="#888" size={20} />
                  )}
                </TouchableOpacity>
              </View>
            </View>
            <View style={{ marginBottom: 12 }}>
              <TouchableOpacity
                onPress={handleVerifyOtp}
                disabled={otpCode.length !== 6 || isLoading}
                style={[
                  styles.primaryBtn,
                  (otpCode.length !== 6 || isLoading) && styles.btnDisabled,
                ]}
                activeOpacity={0.8}
              >
                {isLoading ? (
                  <View style={styles.btnContent}>
                    <RefreshCw size={18} color="#fff" style={{ marginRight: 8 }} />
                    <ActivityIndicator color="#fff" />
                    <Text style={styles.btnText}>  Verifying...</Text>
                  </View>
                ) : (
                  <View style={styles.btnContent}>
                    <Text style={styles.btnText}>Verify & Continue</Text>
                    <ArrowRight size={18} color="#fff" style={{ marginLeft: 8 }} />
                  </View>
                )}
              </TouchableOpacity>
            </View>
          </View>
          <View style={styles.center}>
            {!canResendOtp ? (
              <View style={styles.rowCenter}>
                <Clock size={16} color="#6b7280" />
                <Text style={styles.resendMuted}>  Resend OTP in {otpTimer}s</Text>
              </View>
            ) : (
              <TouchableOpacity
                onPress={handleResendOtp}
                disabled={isLoading}
                style={styles.ghostBtn}
                activeOpacity={0.7}
              >
                {isLoading ? (
                  <View style={styles.rowCenter}>
                    <RefreshCw size={16} color="#1e3a8a" style={{ marginRight: 6 }} />
                    <Text style={styles.ghostText}>Resending...</Text>
                  </View>
                ) : (
                  <Text style={styles.ghostText}>Resend OTP</Text>
                )}
              </TouchableOpacity>
            )}
          </View>
          <TouchableOpacity
            style={styles.outlineBtn}
            onPress={() => {
              setCurrentStep('phone');
              setOtpCode('');
              setOtpTimer(30);
              setCanResendOtp(false);
            }}
          >
            <View style={styles.rowCenter}>
              <ArrowLeft size={16} color="#111827" style={{ marginRight: 8 }} />
              <Text style={styles.outlineText}>Change Phone Number</Text>
            </View>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const SuccessStep = () => {
    // Auto-navigate after showing success message
    useEffect(() => {
      if (hasNavigated) return; // Prevent multiple navigations
      
      const timer = setTimeout(() => {
        console.log('Auto-navigating to dashboard...');
        setHasNavigated(true);
        if (userType === 'wholesale') {
          navigation.navigate('WholesalerDashboard');
        } else {
          navigation.navigate('RetailerDashboard');
        }
      }, 2000); // 2 seconds delay

      return () => clearTimeout(timer);
    }, [userType, hasNavigated]);

    return (
      <View style={styles.card}>
        <View style={styles.cardBody}>
          <View style={styles.headerCenter}>
            <Animated.View
              style={[styles.iconCircleGreen, { transform: [{ scale: successPulse }] }]}
            >
              <CheckCircle color="#16a34a" size={32} />
            </Animated.View>
            <Text style={styles.successTitle}>Login Successful!</Text>
            <Text style={styles.muted}>
              {userType === 'retail'
                ? 'Welcome back to your retailer dashboard'
                : 'Welcome back to your wholesaler dashboard'}
            </Text>
            <Text style={[styles.muted, { marginTop: 8, fontSize: 12 }]}>
              Redirecting to dashboard...
            </Text>
          </View>
        <View style={styles.successBox}>
          <View style={styles.rowBetween}>
            <Text style={styles.kvLabel}>Phone Number</Text>
            <Text style={styles.badgeSecondary}>
              +91 {passwordPhone || otpPhone}
            </Text>
          </View>
          <View style={styles.rowBetween}>
            <Text style={styles.kvLabel}>Status</Text>
            <Text style={styles.badgeGreen}>Verified</Text>
          </View>
        </View>
        <View style={styles.center}>
          <View style={styles.rowCenter}>
            <RefreshCw size={16} color="#6b7280" style={{ marginRight: 6 }} />
            <Text style={styles.resendMuted}>Redirecting to dashboard...</Text>
          </View>
        </View>
      </View>
    </View>
    );
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#fff' }}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.select({ ios: 'padding', android: undefined })}
      >
        <View style={{ flex: 1 }}>
          <View style={styles.bgLayer} />
          <View style={styles.container}>
            {currentStep === 'method' && <MethodStep />}
            {currentStep === 'password' && <PasswordStep />}
            {currentStep === 'phone' && <PhoneStep />}
            {currentStep === 'otp' && <OtpStep />}
            {currentStep === 'success' && <SuccessStep />}
          </View>
          <View style={styles.blurA} />
          <View style={styles.blurB} />
          <View style={styles.blurC} />
          <View style={styles.blurD} />
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  bgLayer: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#fb923c',
    opacity: 0.25,
  },
  container: {
    flex: 1,
    padding: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  card: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: 'rgba(255,255,255,0.95)',
    borderRadius: 16,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 8 },
    elevation: 6,
    borderWidth: 0,
  },
  cardBody: { padding: 20 },
  headerCenter: { alignItems: 'center' },
  iconCircleBlue: {
    width: 64, height: 64, borderRadius: 32,
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: '#dbeafe',
    marginBottom: 8,
  },
  iconCircleGreen: {
    width: 64, height: 64, borderRadius: 32,
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: '#dcfce7',
    marginBottom: 8,
  },
  title: { fontSize: 20, fontWeight: '700', color: '#1f2937', marginBottom: 8 },
  successTitle: { fontSize: 20, fontWeight: '700', color: '#16a34a', marginBottom: 8 },
  muted: { fontSize: 13, color: '#4b5563', textAlign: 'center', marginBottom: 8 },
  boldLine: { fontWeight: '600', color: '#1f2937' },
  label: { fontSize: 13, color: '#374151', fontWeight: '600', marginBottom: 4 },
  phoneRow: {
    marginTop: 8,
    flexDirection: 'row',
    alignItems: 'center',
    height: 48,
    borderRadius: 10,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    paddingHorizontal: 12,
  },
  prefix: { color: '#6b7280', marginRight: 8 },
  phoneInput: { flex: 1, fontSize: 16, color: '#111827' },
  otpInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 10,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    marginTop: 8,
    height: 48,
    paddingHorizontal: 12,
  },
  otpInputField: {
    flex: 1,
    fontSize: 20,
    color: '#111827',
    letterSpacing: 4,
    textAlign: 'center',
    fontWeight: '600',
  },
  otpEyeBtn: { 
    padding: 4,
    marginLeft: 8,
  },
  passwordRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 10,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    paddingHorizontal: 12,
    marginTop: 8,
    height: 48,
  },
  passwordInput: { flex: 1, fontSize: 16, color: '#111827' },
  eyeBtn: { padding: 4 },
  primaryBtn: {
    height: 48,
    borderRadius: 10,
    backgroundColor: '#1e3a8a',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  btnDisabled: { opacity: 0.6 },
  btnContent: { flexDirection: 'row', alignItems: 'center' },
  btnText: { color: '#fff', fontWeight: '700', fontSize: 16 },
  infoBoxOrange: {
    backgroundColor: '#fff7ed',
    borderWidth: 1,
    borderColor: '#fed7aa',
    padding: 12,
    borderRadius: 12,
    marginTop: 16,
  },
  infoTitle: { fontSize: 13, fontWeight: '600', color: '#1f2937' },
  infoText: { fontSize: 12, color: '#4b5563' },
  footerNote: { fontSize: 11, color: '#6b7280', textAlign: 'center', marginTop: 12 },
  methodBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f3f4f6',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 18,
    marginVertical: 4,
    borderWidth: 2,
    borderColor: '#e5e7eb',
  },
  methodIconCircle: {
    width: 40, height: 40, borderRadius: 20,
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: '#dbeafe',
    marginRight: 10,
  },
  methodTitle: { fontWeight: 'bold', fontSize: 15, color: '#1f2937' },
  methodDesc: { fontSize: 12, color: '#6b7280' },
  outlineBtn: {
    height: 44,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  outlineText: { color: '#111827', fontWeight: '600' },
  ghostBtn: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#eff6ff',
    marginTop: 8,
    alignItems: 'center',
  },
  ghostText: { color: '#1e3a8a', fontSize: 14, fontWeight: '600' },
  otpInput: {
    width: '100%',
    height: 56,
    borderRadius: 10,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    fontSize: 20,
    color: '#111827',
    marginTop: 8,
    marginBottom: 8,
  },
  center: { alignItems: 'center' },
  rowCenter: { flexDirection: 'row', alignItems: 'center' },
  rowBetween: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  resendMuted: { fontSize: 13, color: '#6b7280' },
  successBox: {
    backgroundColor: '#ecfdf5',
    borderWidth: 1,
    borderColor: '#bbf7d0',
    padding: 12,
    borderRadius: 12,
    marginTop: 16,
  },
  kvLabel: { fontSize: 13, color: '#4b5563' },
  badgeSecondary: { color: '#111827', fontSize: 12, fontWeight: '600' },
  badgeGreen: { color: '#065f46', fontSize: 12, fontWeight: '700' },
  blurA: {
    position: 'absolute',
    top: 40,
    left: 24,
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(255,255,255,0.12)',
  },
  blurB: {
    position: 'absolute',
    bottom: 40,
    right: 24,
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: 'rgba(255,255,255,0.12)',
  },
  blurC: {
    position: 'absolute',
    left: 0,
    top: '50%',
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  blurD: {
    position: 'absolute',
    right: 40,
    top: '25%',
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
});

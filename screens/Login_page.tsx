import React, { useState, useEffect, useRef } from 'react';
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
  Keyboard,
  TouchableWithoutFeedback,
} from 'react-native';
import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';
import CryptoJS from 'crypto-js';
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

type LoginStep = 'method' | 'password' | 'phone' | 'otp' | 'success';
type LoginMethod = 'password' | 'otp';

export function WholesalerLoginPage({ navigation }: any) {
  const [currentStep, setCurrentStep] = useState<LoginStep>('method');
  const [loginMethod, setLoginMethod] = useState<LoginMethod>('password');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [otp, setOtp] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [otpTimer, setOtpTimer] = useState(30);
  const [canResendOtp, setCanResendOtp] = useState(false);
  const [confirmation, setConfirmation] = useState<any>(null);
  const successPulse = useRef(new Animated.Value(1)).current;

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
    if (phoneNumber.length !== 10 || password.length < 6) {
      Alert.alert('Error', 'Enter valid phone and password');
      return;
    }
    setIsLoading(true);
    try {
      // Call your Firebase Function for password login
      const response = await fetch(
        'https://us-central1-vm-authentication-4d4ea.cloudfunctions.net/loginWithPassword',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ phone: phoneNumber, password }),
        }
      );
      if (!response.ok) {
        const errorText = await response.text();
        Alert.alert('Error', errorText || 'Login failed');
        setIsLoading(false);
        return;
      }
      const { token } = await response.json();
      await auth().signInWithCustomToken(token);
      setCurrentStep('success');
      setTimeout(() => {
        navigation.replace('WholesalerDashboard');
      }, 2000);
    } catch (err) {
      Alert.alert('Error', 'Login failed');
    }
    setIsLoading(false);
  };

  // OTP Login Handlers
  const handleSendOtp = async () => {
    if (phoneNumber.length !== 10) {
      Alert.alert('Error', 'Enter valid phone number');
      return;
    }
    setIsLoading(true);
    try {
      const userDoc = await firestore().collection('wholesaler').doc(phoneNumber).get();
      if (!userDoc.exists) {
        Alert.alert('Error', 'Phone number not registered');
        setIsLoading(false);
        return;
      }
      const confirmationResult = await auth().signInWithPhoneNumber('+91' + phoneNumber);
      setConfirmation(confirmationResult);
      setCurrentStep('otp');
      setOtpTimer(30);
      setCanResendOtp(false);
      setOtp('');
      Alert.alert('OTP Sent', 'Check your SMS for the OTP');
    } catch (err) {
      Alert.alert('Error', 'Failed to send OTP');
    }
    setIsLoading(false);
  };

  const handleVerifyOtp = async () => {
    if (otp.length !== 6) {
      Alert.alert('Error', 'Enter the complete 6-digit OTP');
      return;
    }
    if (!confirmation) {
      Alert.alert('Error', 'No OTP confirmation found');
      return;
    }
    setIsLoading(true);
    try {
      await confirmation.confirm(otp);
      setCurrentStep('success');
      setTimeout(() => {
        navigation.replace('WholesalerDashboard');
      }, 2000);
    } catch (err) {
      Alert.alert('Error', 'Invalid OTP');
    }
    setIsLoading(false);
  };

  const handleResendOtp = async () => {
    setIsLoading(true);
    try {
      const confirmationResult = await auth().signInWithPhoneNumber('+91' + phoneNumber);
      setConfirmation(confirmationResult);
      setOtpTimer(30);
      setCanResendOtp(false);
      setOtp('');
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
          <Text style={styles.title}>Wholesaler Login</Text>
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
            Join thousands of verified wholesalers. Quick setup, instant access to retailers.
          </Text>
        </View>
        <Text style={styles.footerNote}>
          By continuing, you agree to our Terms of Service and Privacy Policy
        </Text>
      </View>
    </View>
  );

  const PasswordStep = () => (
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
              <TextInput
                value={phoneNumber}
                onChangeText={(t) => setPhoneNumber(t.replace(/\D/g, '').slice(0, 10))}
                keyboardType="number-pad"
                placeholder="Enter 10-digit mobile number"
                style={styles.phoneInput}
                maxLength={10}
              />
            </View>
            {phoneNumber.length > 0 && phoneNumber.length !== 10 && (
              <Text style={styles.errorText}>Please enter a valid 10-digit phone number</Text>
            )}
          </View>
          <View style={{ marginBottom: 12 }}>
            <Text style={styles.label}>Password</Text>
            <View style={styles.passwordRow}>
              <TextInput
                value={password}
                onChangeText={setPassword}
                placeholder="Enter your password"
                style={styles.passwordInput}
                secureTextEntry={!showPassword}
                maxLength={32}
              />
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
            {password.length > 0 && password.length < 6 && (
              <Text style={styles.errorText}>Password must be at least 6 characters</Text>
            )}
          </View>
          <TouchableOpacity
            onPress={handlePasswordLogin}
            disabled={phoneNumber.length !== 10 || password.length < 6 || isLoading}
            style={[
              styles.primaryBtn,
              (phoneNumber.length !== 10 || password.length < 6 || isLoading) && styles.btnDisabled,
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

  const PhoneStep = () => (
    <View style={{ padding: 20 }}>
      <Text>Phone Number</Text>
      <TextInput
        value={phoneNumber}
        onChangeText={(t) => setPhoneNumber(t.replace(/\D/g, '').slice(0, 10))}
        keyboardType="number-pad"
        placeholder="Enter 10-digit mobile number"
        style={{ borderWidth: 1, borderColor: '#ccc', padding: 10, color: '#000' }}
        maxLength={10}
      />
    </View>
  );

  const OtpStep = () => (
    <View style={styles.card}>
      <View style={styles.cardBody}>
        <View style={styles.headerCenter}>
          <View style={styles.iconCircleGreen}>
            <CheckCircle color="#16a34a" size={32} />
          </View>
          <Text style={styles.title}>Verify OTP</Text>
          <Text style={styles.muted}>
            We've sent a 6-digit code to{'\n'}
            <Text style={styles.boldLine}>+91 {phoneNumber}</Text>
          </Text>
        </View>
        <View>
          <View style={{ marginBottom: 12 }}>
            <Text style={styles.label}>Enter OTP</Text>
            <TextInput
              value={otp}
              onChangeText={(t) => setOtp(t.replace(/\D/g, '').slice(0, 6))}
              keyboardType="number-pad"
              placeholder="Enter 6-digit OTP"
              style={styles.otpInput}
              maxLength={6}
              textAlign="center"
            />
            {otp.length > 0 && otp.length !== 6 && (
              <Text style={styles.errorText}>Please enter the complete 6-digit OTP</Text>
            )}
          </View>
          <View style={{ marginBottom: 12 }}>
            <TouchableOpacity
              onPress={handleVerifyOtp}
              disabled={otp.length !== 6 || isLoading}
              style={[
                styles.primaryBtn,
                (otp.length !== 6 || isLoading) && styles.btnDisabled,
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
            setOtp('');
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

  const SuccessStep = () => (
    <View style={styles.card}>
      <View style={styles.cardBody}>
        <View style={styles.headerCenter}>
          <Animated.View
            style={[styles.iconCircleGreen, { transform: [{ scale: successPulse }] }]}
          >
            <CheckCircle color="#16a34a" size={32} />
          </Animated.View>
          <Text style={styles.successTitle}>Login Successful!</Text>
          <Text style={styles.muted}>Welcome back to your wholesaler dashboard</Text>
        </View>
        <View style={styles.successBox}>
          <View style={styles.rowBetween}>
            <Text style={styles.kvLabel}>Phone Number</Text>
            <Text style={styles.badgeSecondary}>+91 {phoneNumber}</Text>
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

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#fff' }}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.select({ ios: 'padding', android: undefined })}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
          <View style={{ flex: 1 }}>
            <View style={styles.bgLayer} />
            <View style={styles.container}>
              {currentStep === 'method' && <MethodStep />}
              {currentStep === 'password' && <PasswordStep />}
              {currentStep === 'phone' && <PhoneStep />}
              {currentStep === 'otp' && <OtpStep />}
              {currentStep === 'success' && <SuccessStep />}
            </View>
            {/* Decorative blobs */}
            <View style={styles.blurA} />
            <View style={styles.blurB} />
            <View style={styles.blurC} />
            <View style={styles.blurD} />
          </View>
        </TouchableWithoutFeedback>
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
  errorText: { color: '#ef4444', fontSize: 12, marginTop: 6 },
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

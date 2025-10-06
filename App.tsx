import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import auth from '@react-native-firebase/auth';
import SplashScreen from './screens/SplashScreen';
import Home_Page_Login from './Home_Page_Login';
import { WholesalerLoginPage } from './screens/Login_page';
import RegistrationForm from './RegistrationForm';
import WholesalerDashboard from './screens/WholesalerDashboard';
import RetailerSuccessPage from './screens/Re_regs';

export type RootStackParamList = {
  Splash: undefined;
  Home: undefined;
  Login: undefined;
  RegistrationForm: undefined;
  WholesalerDashboard: { userId?: string };
  Re_regs: { userType?: string; docName?: string };
};

const Stack = createStackNavigator<RootStackParamList>();

const App = () => {
  const [loading, setLoading] = useState(true);
  const [showSplash, setShowSplash] = useState(true);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    // Show splash for 3 seconds
    const splashTimeout = setTimeout(() => {
      setShowSplash(false);
    }, 3000);

    return () => clearTimeout(splashTimeout);
  }, []);

  useEffect(() => {
    if (!showSplash) {
      const unsubscribe = auth().onAuthStateChanged((firebaseUser) => {
        setUser(firebaseUser);
        setLoading(false);
      });
      return unsubscribe;
    }
  }, [showSplash]);

  if (showSplash || loading) {
    return <SplashScreen />;
  }

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Home" component={Home_Page_Login} />
        <Stack.Screen name="Login" component={WholesalerLoginPage} />
        <Stack.Screen name="RegistrationForm" component={RegistrationForm} />
        <Stack.Screen name="Re_regs" component={RetailerSuccessPage} />
        <Stack.Screen name="WholesalerDashboard" component={WholesalerDashboard} />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default App;

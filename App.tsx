import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { BackHandler, ToastAndroid } from 'react-native';
import { getAuth, onAuthStateChanged } from '@react-native-firebase/auth';
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
  const [backPressedOnce, setBackPressedOnce] = useState(false);

  useEffect(() => {
    // Show splash for 3 seconds
    const splashTimeout = setTimeout(() => {
      setShowSplash(false);
    }, 3000);

    return () => clearTimeout(splashTimeout);
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(getAuth(), user => {
      setUser(user);
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  useEffect(() => {
    const onBackPress = () => {
      if (user) {
        if (backPressedOnce) {
          BackHandler.exitApp();
        } else {
          ToastAndroid.show('Press back again to exit the app', ToastAndroid.SHORT);
          setBackPressedOnce(true);
          setTimeout(() => setBackPressedOnce(false), 2000);
          return true;
        }
      }
      return false;
    };
    const subscription = BackHandler.addEventListener('hardwareBackPress', onBackPress);
    return () => subscription.remove();
  }, [user, backPressedOnce]);

  if (showSplash || loading) {
    return <SplashScreen />;
  }

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {user ? (
          <Stack.Screen name="WholesalerDashboard" component={WholesalerDashboard} />
        ) : (
          <>
            <Stack.Screen name="Home" component={Home_Page_Login} />
            <Stack.Screen name="Login" component={WholesalerLoginPage} />
            <Stack.Screen name="RegistrationForm" component={RegistrationForm} />
            <Stack.Screen name="Re_regs" component={RetailerSuccessPage} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default App;

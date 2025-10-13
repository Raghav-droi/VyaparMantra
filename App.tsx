import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { BackHandler, ToastAndroid } from 'react-native';
import { getAuth, onAuthStateChanged } from '@react-native-firebase/auth';
import { getFirestore, doc, getDoc } from '@react-native-firebase/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage';

import SplashScreen from './screens/SplashScreen';
import Home_Page_Login from './Home_Page_Login';
import { LoginPage } from './screens/Login_page';
import RegistrationForm from './RegistrationForm';
import WholesalerDashboard from './screens/WholesalerDashboard';
import RetailerDashboard from './screens/RetailerDashboard';
import RetailerSuccessPage from './screens/Re_regs';
import SearchProducts from './screens/SearchProducts';
import ProductDetails from './screens/ProductDetails';
import OrderTracking from './screens/OrderTracking';

export type RootStackParamList = {
  Splash: undefined;
  Home: undefined;
  Login: undefined;
  RegistrationForm: undefined;
  WholesalerDashboard: { userId?: string };
  RetailerDashboard: { userId?: string };
  Re_regs: { userType?: string; docName?: string };
  SearchProducts: undefined;
  ProductDetails: undefined;
  OrderTracking: undefined;
};

const Stack = createStackNavigator<RootStackParamList>();

const App = () => {
  const [loading, setLoading] = useState(true);
  const [showSplash, setShowSplash] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [userType, setUserType] = useState<string | null>(null);
  const [backPressedOnce, setBackPressedOnce] = useState(false);
  const [initialRoute, setInitialRoute] = useState<string | null>(null);

  useEffect(() => {
    // Show splash for 3 seconds
    const splashTimeout = setTimeout(() => {
      setShowSplash(false);
    }, 3000);

    return () => clearTimeout(splashTimeout);
  }, []);

  useEffect(() => {
    console.log('App loaded, checking user...');
    const unsubscribe = onAuthStateChanged(getAuth(), async (firebaseUser) => {
      console.log('Auth state changed:', firebaseUser);
      setUser(firebaseUser);
      setLoading(false);
      if (firebaseUser?.phoneNumber) {
        const phone = firebaseUser.phoneNumber.replace('+91', '');
        const db = getFirestore();
        console.log('Checking user type for phone:', phone);
        
        // Since both users have the same phone number, we need to check both collections
        // and determine which one was used for login
        const wholesalerDoc = await getDoc(doc(db, 'wholesaler', phone));
        const retailerDoc = await getDoc(doc(db, 'retailer', phone));
        
        // If user exists in both collections, check stored login context
        if (wholesalerDoc.exists() && retailerDoc.exists()) {
          console.log('User exists in both collections, checking stored login context...');
          
          try {
            const storedUserType = await AsyncStorage.getItem(`userType_${phone}`);
            if (storedUserType === 'wholesale') {
              console.log('Stored context: wholesaler');
              setUserType('wholesale');
              setInitialRoute('WholesalerDashboard');
              return;
            } else if (storedUserType === 'retail') {
              console.log('Stored context: retailer');
              setUserType('retail');
              setInitialRoute('RetailerDashboard');
              return;
            } else {
              console.log('No stored context, defaulting to wholesaler');
              setUserType('wholesale');
              setInitialRoute('WholesalerDashboard');
              return;
            }
          } catch (error) {
            console.log('Error reading stored context, defaulting to wholesaler');
            setUserType('wholesale');
            setInitialRoute('WholesalerDashboard');
            return;
          }
        }
        
        // Check wholesaler first
        if (wholesalerDoc.exists()) {
          console.log('User is wholesaler, setting route to WholesalerDashboard');
          setUserType('wholesale');
          setInitialRoute('WholesalerDashboard');
          return;
        }
        
        // Check retailer
        if (retailerDoc.exists()) {
          console.log('User is retailer, setting route to RetailerDashboard');
          setUserType('retail');
          setInitialRoute('RetailerDashboard');
          return;
        }
        
        console.log('No user type found for phone:', phone);
        setUserType(null);
        setInitialRoute(null);
      } else {
        console.log('No phone number found');
        setUserType(null);
        setInitialRoute(null);
      }
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

  // Determine initial route
  const getInitialRouteName = () => {
    if (!user) return 'Home';
    if (initialRoute) return initialRoute;
    return 'Home';
  };

  return (
    <NavigationContainer>
      <Stack.Navigator 
        initialRouteName={getInitialRouteName()}
        screenOptions={{ headerShown: false }}
      >
        {!user && (
          <>
            <Stack.Screen name="Home" component={Home_Page_Login} />
            <Stack.Screen name="Login" component={LoginPage} />
            <Stack.Screen name="RegistrationForm" component={RegistrationForm} />
            <Stack.Screen name="Re_regs" component={RetailerSuccessPage} />
          </>
        )}
        {/* Always register both dashboard screens */}
        <Stack.Screen name="WholesalerDashboard" component={WholesalerDashboard} />
        <Stack.Screen name="RetailerDashboard" component={RetailerDashboard} />
        <Stack.Screen name="SearchProducts" component={SearchProducts} />
        <Stack.Screen name="ProductDetails" component={ProductDetails} />
        <Stack.Screen name="OrderTracking" component={OrderTracking} />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default App;

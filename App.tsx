import React, { useEffect, useState, createContext, useContext } from 'react';
import { BackHandler, ToastAndroid, View } from 'react-native';
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

// Navigation Context
type NavigationContextType = {
  navigate: (screen: string, params?: any) => void;
  goBack: () => void;
  currentScreen: string;
  params: any;
};

const NavigationContext = createContext<NavigationContextType>({
  navigate: () => {},
  goBack: () => {},
  currentScreen: 'Home',
  params: {},
});

export const useNavigation = () => useContext(NavigationContext);

const App = () => {
  const [loading, setLoading] = useState(true);
  const [showSplash, setShowSplash] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [userType, setUserType] = useState<string | null>(null);
  const [backPressedOnce, setBackPressedOnce] = useState(false);
  const [initialRoute, setInitialRoute] = useState<string | null>(null);
  const [currentScreen, setCurrentScreen] = useState<string>('Home');
  const [screenParams, setScreenParams] = useState<any>({});
  const [navigationHistory, setNavigationHistory] = useState<Array<{screen: string, params: any}>>([]);

  useEffect(() => {
    // Show splash for 3 seconds
    const splashTimeout = setTimeout(() => {
      setShowSplash(false);
    }, 3000);

    return () => clearTimeout(splashTimeout);
  }, []);

  useEffect(() => {
    console.log('App loaded, checking user...');
    const auth = getAuth();
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      console.log('Auth state changed:', currentUser);
      console.log('Current user phone:', currentUser?.phoneNumber);
      setUser(currentUser);

      if (currentUser) {
        try {
          const phoneNumber = currentUser.phoneNumber?.replace('+91', '');
          console.log('Checking user type for phone:', phoneNumber);

          let storedUserType = null;
          let foundPhoneNumber = phoneNumber;

          if (phoneNumber) {
            // User has phone number in auth object
            storedUserType = await AsyncStorage.getItem(`userType_${phoneNumber}`);
            console.log('Stored user type:', storedUserType, 'for phone:', phoneNumber);
          } else {
            // User doesn't have phone number, check all stored user types
            console.log('No phone number in auth object, checking all stored user types');
            const keys = await AsyncStorage.getAllKeys();
            const userTypeKeys = keys.filter(key => key.startsWith('userType_'));
            
            if (userTypeKeys.length > 0) {
              // Get the most recent user type
              const latestKey = userTypeKeys[userTypeKeys.length - 1];
              storedUserType = await AsyncStorage.getItem(latestKey);
              foundPhoneNumber = latestKey.replace('userType_', '');
              console.log('Found stored user type:', storedUserType, 'for phone:', foundPhoneNumber);
            }
          }

          if (storedUserType) {
            setUserType(storedUserType);
            if (storedUserType === 'wholesale') {
              console.log('Setting route to WholesalerDashboard');
              setInitialRoute('WholesalerDashboard');
              setCurrentScreen('WholesalerDashboard');
            } else {
              console.log('Setting route to RetailerDashboard');
              setInitialRoute('RetailerDashboard');
              setCurrentScreen('RetailerDashboard');
            }
          } else {
            const db = getFirestore();
            // Try to find user by phone number first
            const userDoc = await getDoc(doc(db, 'users', foundPhoneNumber));

            if (userDoc.exists()) {
              const userData = userDoc.data();
              const fetchedUserType = userData?.userType;
              console.log('Fetched user type from Firestore:', fetchedUserType);

              if (fetchedUserType) {
                setUserType(fetchedUserType);
                await AsyncStorage.setItem(`userType_${foundPhoneNumber}`, fetchedUserType);

                if (fetchedUserType === 'wholesale') {
                  setInitialRoute('WholesalerDashboard');
                  setCurrentScreen('WholesalerDashboard');
                } else {
                  setInitialRoute('RetailerDashboard');
                  setCurrentScreen('RetailerDashboard');
                }
              }
            } else {
              // Fallback: try to find by UID
              const userDocByUid = await getDoc(doc(db, 'users', currentUser.uid));
              if (userDocByUid.exists()) {
                const userData = userDocByUid.data();
                const fetchedUserType = userData?.userType;
                console.log('Fetched user type from Firestore by UID:', fetchedUserType);

                if (fetchedUserType) {
                  setUserType(fetchedUserType);
                  await AsyncStorage.setItem(`userType_${foundPhoneNumber}`, fetchedUserType);

                  if (fetchedUserType === 'wholesale') {
                    setInitialRoute('WholesalerDashboard');
                    setCurrentScreen('WholesalerDashboard');
                  } else {
                    setInitialRoute('RetailerDashboard');
                    setCurrentScreen('RetailerDashboard');
                  }
                }
              }
            }
          }
        } catch (error) {
          console.error('Error fetching user type:', error);
        }
      } else {
        setUserType(null);
        setInitialRoute(null);
        setCurrentScreen('Home');
      }

      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (user && initialRoute) {
      console.log('Navigating to:', initialRoute);
      setCurrentScreen(initialRoute);
    }
  }, [user, initialRoute]);

  // Back button handler
  useEffect(() => {
    const onBackPress = () => {
      // If user is logged in and on dashboard, prevent going back to login
      if (user && (currentScreen === 'RetailerDashboard' || currentScreen === 'WholesalerDashboard')) {
        if (backPressedOnce) {
          BackHandler.exitApp();
        } else {
          ToastAndroid.show('Press back again to exit the app', ToastAndroid.SHORT);
          setBackPressedOnce(true);
          setTimeout(() => setBackPressedOnce(false), 2000);
          return true;
        }
      }

      // If user is not logged in, allow normal navigation
      if (!user) {
        if (navigationHistory.length > 0) {
          // Navigate back in history
          const previous = navigationHistory[navigationHistory.length - 1];
          setNavigationHistory(navigationHistory.slice(0, -1));
          setCurrentScreen(previous.screen);
          setScreenParams(previous.params);
          return true;
        }
        return false;
      }

      // For other logged-in screens, allow back navigation within the app
      if (navigationHistory.length > 0) {
        const previous = navigationHistory[navigationHistory.length - 1];
        // Don't allow going back to login/home screens
        if (previous.screen === 'Login' || previous.screen === 'Home') {
          return true; // Block the navigation
        }
        setNavigationHistory(navigationHistory.slice(0, -1));
        setCurrentScreen(previous.screen);
        setScreenParams(previous.params);
        return true;
      }

      return false;
    };
    const subscription = BackHandler.addEventListener('hardwareBackPress', onBackPress);
    return () => subscription.remove();
  }, [user, backPressedOnce, navigationHistory, currentScreen]);

  if (showSplash || loading) {
    return <SplashScreen />;
  }

  // Navigation functions
  const navigate = (screen: string, params: any = {}) => {
    // Clear navigation history when navigating to dashboards (after login)
    if (screen === 'RetailerDashboard' || screen === 'WholesalerDashboard') {
      setNavigationHistory([]);
    } else {
      setNavigationHistory([...navigationHistory, { screen: currentScreen, params: screenParams }]);
    }
    setCurrentScreen(screen);
    setScreenParams(params);
  };

  const goBack = () => {
    if (navigationHistory.length > 0) {
      const previous = navigationHistory[navigationHistory.length - 1];
      setNavigationHistory(navigationHistory.slice(0, -1));
      setCurrentScreen(previous.screen);
      setScreenParams(previous.params);
    }
  };

  const navigationValue = {
    navigate,
    goBack,
    currentScreen,
    params: screenParams,
  };

  // Render current screen
  const renderScreen = () => {
    console.log('Rendering screen:', currentScreen);
    switch (currentScreen) {
      case 'Home':
        return <Home_Page_Login />;
      case 'Login':
        return <LoginPage userType={screenParams.userType || 'retail'} />;
      case 'RegistrationForm':
        return <RegistrationForm />;
      case 'Re_regs':
        return <RetailerSuccessPage />;
      case 'WholesalerDashboard':
        return <WholesalerDashboard />;
      case 'RetailerDashboard':
        return <RetailerDashboard />;
      case 'SearchProducts':
        return <SearchProducts />;
      case 'ProductDetails':
        return <ProductDetails />;
      case 'OrderTracking':
        return <OrderTracking />;
      default:
        return <Home_Page_Login />;
    }
  };

  return (
    <NavigationContext.Provider value={navigationValue}>
      <View style={{ flex: 1 }}>
        {renderScreen()}
      </View>
    </NavigationContext.Provider>
  );
};

export default App;

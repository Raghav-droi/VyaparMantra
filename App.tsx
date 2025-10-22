import React, { useEffect, useState, createContext, useContext } from 'react';
import { BackHandler, ToastAndroid, View } from 'react-native';
import { getAuth, onAuthStateChanged } from '@react-native-firebase/auth';
import { getFirestore, doc, getDoc } from '@react-native-firebase/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage';

import SplashScreen from './screens/SplashScreen';
import Home_Page_Login from './Home_Page_Login';
import LoginPage from './screens/Login_page';
import RegistrationForm from './RegistrationForm';
import WholesalerDashboard from './screens/WholesalerDashboard';
import RetailerDashboard from './screens/RetailerDashboard';
import RetailerSuccessPage from './screens/Re_regs';
import SearchProducts from './screens/SearchProducts';
import ProductDetails from './screens/ProductDetails';
import OrderTracking from './screens/OrderTracking';
import RetailerProfile from './screens/RetailerProfile';
import ProductWholesalers from './screens/ProductWholesalers';

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

export const useNavigation = () => {
  const context = useContext(NavigationContext);
  console.log('useNavigation called, context:', context);
  return context;
};

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
      console.log('Splash timeout reached, hiding splash');
      setShowSplash(false);
    }, 3000);

    return () => clearTimeout(splashTimeout);
  }, []);

  useEffect(() => {
    console.log('App loaded, checking user...');
    const auth = getAuth();
    
    // Set a timeout to ensure loading is set to false even if auth fails
    const loadingTimeout = setTimeout(() => {
      console.log('Loading timeout reached, setting loading to false');
      setLoading(false);
    }, 5000); // 5 second timeout
    
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      console.log('Auth state changed:', currentUser);
      console.log('Current user phone:', currentUser?.phoneNumber);
      console.log('Current loading state:', loading);
      
      setUser(currentUser);
      
      // Skip processing if user is null and we're already on home screen
      if (!currentUser && currentScreen === 'Home') {
        console.log('No user and already on home, skipping...');
        return;
      }

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
              // Find the most recent user type by checking timestamps
              let mostRecentTimestamp = 0;
              let mostRecentKey = '';
              
              for (const key of userTypeKeys) {
                const phone = key.replace('userType_', '');
                const timestampKey = `userType_${phone}_timestamp`;
                const timestamp = await AsyncStorage.getItem(timestampKey);
                
                if (timestamp && parseInt(timestamp) > mostRecentTimestamp) {
                  mostRecentTimestamp = parseInt(timestamp);
                  mostRecentKey = key;
                }
              }
              
              if (mostRecentKey) {
                storedUserType = await AsyncStorage.getItem(mostRecentKey);
                foundPhoneNumber = mostRecentKey.replace('userType_', '');
                console.log('Found most recent user type:', storedUserType, 'for phone:', foundPhoneNumber, 'timestamp:', mostRecentTimestamp);
              } else {
                // Fallback to the last key if no timestamps found
                const latestKey = userTypeKeys[userTypeKeys.length - 1];
                storedUserType = await AsyncStorage.getItem(latestKey);
                foundPhoneNumber = latestKey.replace('userType_', '');
                console.log('Fallback - found user type:', storedUserType, 'for phone:', foundPhoneNumber);
              }
              
              console.log('All available user types:', userTypeKeys);
            } else {
              // No stored user type found, set loading to false and go to home
              console.log('No stored user type found, redirecting to home');
              setLoading(false);
              return;
            }
          }

          if (storedUserType) {
            setUserType(storedUserType);
            if (storedUserType === 'wholesale') {
              console.log('Setting route to WholesalerDashboard');
              setInitialRoute('WholesalerDashboard');
              if (currentScreen !== 'WholesalerDashboard') {
                setCurrentScreen('WholesalerDashboard');
              }
            } else {
              console.log('Setting route to RetailerDashboard');
              setInitialRoute('RetailerDashboard');
              if (currentScreen !== 'RetailerDashboard') {
                setCurrentScreen('RetailerDashboard');
              }
            }
          } else {
            const db = getFirestore();
            // Try to find user by phone number first
            if (foundPhoneNumber) {
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
                    if (currentScreen !== 'WholesalerDashboard') {
                      setCurrentScreen('WholesalerDashboard');
                    }
                  } else {
                    setInitialRoute('RetailerDashboard');
                    if (currentScreen !== 'RetailerDashboard') {
                      setCurrentScreen('RetailerDashboard');
                    }
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
                      if (currentScreen !== 'WholesalerDashboard') {
                        setCurrentScreen('WholesalerDashboard');
                      }
                    } else {
          setInitialRoute('RetailerDashboard');
                      if (currentScreen !== 'RetailerDashboard') {
                        setCurrentScreen('RetailerDashboard');
                      }
                    }
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

      console.log('Setting loading to false');
      setLoading(false);
      clearTimeout(loadingTimeout);
    });

    return () => {
      unsubscribe();
      clearTimeout(loadingTimeout);
    };
  }, []);

  useEffect(() => {
    console.log('Navigation effect triggered - user:', !!user, 'initialRoute:', initialRoute, 'currentScreen:', currentScreen);
    // Only redirect to dashboard if user is logged in and we're on a non-dashboard screen
    // but not if we're on a sub-screen of the dashboard (like SearchProducts, ProductWholesalers, etc.)
    if (user && initialRoute && 
        (currentScreen === 'Home' || currentScreen === 'Login' || currentScreen === 'RegistrationForm' || currentScreen === 'Re_regs') &&
        currentScreen !== initialRoute) {
      console.log('Navigating to:', initialRoute);
      setCurrentScreen(initialRoute);
    }
  }, [user, initialRoute, currentScreen]);

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

  console.log('Render check - showSplash:', showSplash, 'loading:', loading, 'currentScreen:', currentScreen);

  if (showSplash || loading) {
    console.log('Showing splash screen');
    return <SplashScreen />;
  }

  // Safety check - if we're not showing splash and not loading, ensure we have a valid screen
  if (!currentScreen || currentScreen === '') {
    console.log('No current screen set, defaulting to Home');
    setCurrentScreen('Home');
  }

  // Navigation functions
  const navigate = (screen: string, params: any = {}) => {
    console.log('Navigate called - from:', currentScreen, 'to:', screen, 'params:', params);
    
    // Clear navigation history when navigating to dashboards (after login)
    if (screen === 'RetailerDashboard' || screen === 'WholesalerDashboard') {
      setNavigationHistory([]);
    } else {
      setNavigationHistory([...navigationHistory, { screen: currentScreen, params: screenParams }]);
    }
    setCurrentScreen(screen);
    setScreenParams(params);
    console.log('Navigation state updated - currentScreen:', screen, 'params:', params);
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
    console.log('Rendering screen:', currentScreen, 'with params:', screenParams);
    switch (currentScreen) {
      case 'Home':
        return <Home_Page_Login />;
      case 'Login':
        console.log('Rendering LoginPage with userType:', screenParams.userType || 'retail');
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
      case 'RetailerProfile':
        return <RetailerProfile />;
      case 'ProductWholesalers':
        return <ProductWholesalers />;
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

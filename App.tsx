import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import SplashScreen from './screens/SplashScreen';
import Home_Page_Login from './Home_Page_Login';
import RegistrationForm from './RegistrationForm';
import RetailerProfile from './screens/RetailerProfile';
import WholesalerProfile from './screens/WholesalerProfile';

const Stack = createStackNavigator();

const MainApp = () => (
  <NavigationContainer>
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Home" component={Home_Page_Login} />
      <Stack.Screen name="RegistrationForm" component={RegistrationForm} />
      <Stack.Screen name="RetailerProfile" component={RetailerProfile} />
      <Stack.Screen name="WholesalerProfile" component={WholesalerProfile} />
    </Stack.Navigator>
  </NavigationContainer>
);

const App = () => {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 3000);
    return () => clearTimeout(timer);
  }, []);

  if (loading) {
    return <SplashScreen />;
  }

  return <MainApp />;
};

export default App;

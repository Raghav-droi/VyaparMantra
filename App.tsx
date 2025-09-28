import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import SplashScreen from './SplashScreen';
import Home_Page_Login from './Home_Page_Login';
import RegistrationForm from './RegistrationForm';

const Stack = createStackNavigator();

const MainApp = () => (
  <NavigationContainer>
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Home" component={Home_Page_Login} />
      <Stack.Screen name="RegistrationForm" component={RegistrationForm} />
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

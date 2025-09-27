import React, { useEffect, useState } from 'react';
import { View, Text } from 'react-native';
import SplashScreen from './SplashScreen';
import Home_Page_Login from './Home_Page_Login';

const MainApp = () => {
  return (
   <Home_Page_Login/>
  )
};

const App = () => {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 3000); // Show splash 3 seconds
    return () => clearTimeout(timer);
  }, []);

  if (loading) {
    return <SplashScreen />;
  }

  return <MainApp />;
};

export default App;

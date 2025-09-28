import React, { useState } from 'react';
import { Image, View, StyleSheet } from 'react-native';

export function ImageWithFallback({ src, style }) {
  const [error, setError] = useState(false);
  return (
    <View style={[styles.wrapper, style]}>
      {!error ? (
        <Image
          source={{ uri: src }}
          style={[styles.image, style]}
          onError={() => setError(true)}
        />
      ) : (
        <View style={[styles.fallback, style]} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {},
  image: { width: '100%', height: '100%', borderRadius: 999 },
  fallback: { backgroundColor: '#eee', width: '100%', height: '100%', borderRadius: 999 },
});

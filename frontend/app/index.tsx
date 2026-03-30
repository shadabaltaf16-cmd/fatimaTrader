import { useEffect } from 'react';
import { Platform } from 'react-native';

export default function Index() {
  useEffect(() => {
    if (Platform.OS === 'web') {
      window.location.href = '/tabs';
    }
  }, []);

  return null;
}

import { Redirect } from 'expo-router';
import { Platform } from 'react-native';

export default function Index() {
  if (Platform.OS === 'web') {
    return <Redirect href="/landing" />;
  }
  return <Redirect href="/planetarium" />;
}

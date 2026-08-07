import 'expo-router/entry';
import { AppRegistry } from 'react-native';
import BubbleChatRoot from './src/features/notifications/components/BubbleChatRoot';

// Android bubbles use their own React surface so they do not create a second Expo Router store.
AppRegistry.registerComponent('bubble', () => BubbleChatRoot);

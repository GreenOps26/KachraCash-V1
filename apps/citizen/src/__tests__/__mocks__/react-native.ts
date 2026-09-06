export const Platform = { OS: 'ios', select: (objs: Record<string, unknown>) => objs['ios'] || objs['default'] };
export const StyleSheet = { create: (styles: unknown) => styles };
export const Alert = { alert: () => {} };

export const Linking = {
  openURL: async (_url: string) => true,
  canOpenURL: async (_url: string) => true,
  addEventListener: () => ({ remove: () => {} }),
};

export const View = 'View';
export const Text = 'Text';
export const TouchableOpacity = 'TouchableOpacity';
export const StatusBar = 'StatusBar';
export const SafeAreaView = 'SafeAreaView';
export const ScrollView = 'ScrollView';
export const Modal = 'Modal';
export const ActivityIndicator = 'ActivityIndicator';
export const TextInput = 'TextInput';
export const Image = 'Image';

export default {
  Platform,
  StyleSheet,
  Alert,
  Linking,
  View,
  Text,
  TouchableOpacity,
  StatusBar,
  SafeAreaView,
  ScrollView,
  Modal,
  ActivityIndicator,
  TextInput,
  Image,
};

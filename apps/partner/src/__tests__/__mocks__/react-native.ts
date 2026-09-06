export const Platform = { OS: 'android', select: (objs: Record<string, unknown>) => objs['android'] };
export const StyleSheet = { create: (styles: unknown) => styles };
export const Alert = { alert: () => {} };
export const View = 'View';
export const Text = 'Text';
export const TouchableOpacity = 'TouchableOpacity';
export const StatusBar = 'StatusBar';
export const SafeAreaView = 'SafeAreaView';
export const ScrollView = 'ScrollView';
export const Modal = 'Modal';
export const ActivityIndicator = 'ActivityIndicator';

export default {
  Platform,
  StyleSheet,
  Alert,
  View,
  Text,
  TouchableOpacity,
  StatusBar,
  SafeAreaView,
  ScrollView,
  Modal,
  ActivityIndicator,
};

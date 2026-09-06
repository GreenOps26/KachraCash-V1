import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['src/__tests__/**/*.test.ts'],
  },
  resolve: {
    alias: {
      'react-native': path.resolve(__dirname, 'src/__tests__/__mocks__/react-native.ts'),
      'expo-sqlite': path.resolve(__dirname, 'src/__tests__/__mocks__/expo-sqlite.ts'),
    },
  },
});

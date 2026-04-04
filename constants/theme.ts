/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

import { Platform } from 'react-native';

/** 紫罗兰主色（亮色主题） */
const tintColorLight = '#7f5aa6';
/** 紫罗兰主色（深色主题） */
const tintColorDark = '#caa6eb';

export const Colors = {
  light: {
    text: '#2f2438',
    background: '#f6f1f8',
    tint: tintColorLight,
    icon: '#8d7a9f',
    tabIconDefault: '#b7a8c7',
    tabIconSelected: tintColorLight,
    surface: '#fbf8fd',
    surfaceSoft: '#f1e9f8',
    border: '#dfd1eb',
    elevated: '#ffffff',
    chip: '#ece1f5',
    chipActive: '#d8c3eb',
    overlay: 'rgba(34, 16, 48, 0.45)',
    gold: '#b99462',
  },
  dark: {
    text: '#f1e8fb',
    background: '#191325',
    tint: tintColorDark,
    icon: '#aa97bb',
    tabIconDefault: '#6f5f82',
    tabIconSelected: tintColorDark,
    surface: '#231a34',
    surfaceSoft: '#2a1f3d',
    border: '#43335f',
    elevated: '#2e2442',
    chip: '#302346',
    chipActive: '#493468',
    overlay: 'rgba(11, 7, 18, 0.65)',
    gold: '#d3b181',
  },
};

export const Fonts = Platform.select({
  ios: {
    /** iOS `UIFontDescriptorSystemDesignDefault` */
    sans: 'system-ui',
    /** iOS `UIFontDescriptorSystemDesignSerif` */
    serif: 'ui-serif',
    /** iOS `UIFontDescriptorSystemDesignRounded` */
    rounded: 'ui-rounded',
    /** iOS `UIFontDescriptorSystemDesignMonospaced` */
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: "'Noto Sans SC', 'PingFang SC', 'Microsoft YaHei', system-ui, sans-serif",
    serif: "'Noto Serif SC', 'Songti SC', Georgia, serif",
    rounded: "'SF Pro Rounded', 'Hiragino Maru Gothic ProN', Meiryo, 'MS PGothic', sans-serif",
    mono: "SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
  },
});

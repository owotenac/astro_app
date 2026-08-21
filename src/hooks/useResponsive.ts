import { Platform, useWindowDimensions } from 'react-native';

const MOBILE_BREAKPOINT = 768;

export function useResponsive() {
  const { width, height } = useWindowDimensions();
  const isPortrait = height > width;
  const isMobile = Platform.OS !== 'web' || width < MOBILE_BREAKPOINT;
  const isMobilePortrait = isMobile && isPortrait;

  return {
    width,
    height,
    isPortrait,
    isMobile,
    isMobilePortrait,
  };
}

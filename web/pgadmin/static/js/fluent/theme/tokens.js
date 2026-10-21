/////////////////////////////////////////////////////////////
//
// pgAdmin 4 - Fluent fork
//
// Portions Copyright (C) 2013 - 2026, The pgAdmin Development Team
// This software is released under the PostgreSQL Licence
//
//////////////////////////////////////////////////////////////

/* Fluent 2 / Windows 11 design tokens used by the fork's design system.
 * Values follow the WinUI 3 light and dark theme resources, flattened to
 * opaque colours where pgAdmin needs a solid surface.
 */

export const FLUENT_DEFAULT_ACCENT = '#0078D4';

export const fontFamily = [
  '"Segoe UI Variable Text"',
  '"Segoe UI Variable"',
  '"Segoe UI"',
  'system-ui',
  '-apple-system',
  'BlinkMacSystemFont',
  'Roboto',
  '"Helvetica Neue"',
  'Arial',
  'sans-serif',
  '"Segoe UI Emoji"',
  '"Segoe UI Symbol"',
].join(',');

export const fontFamilyDisplay = [
  '"Segoe UI Variable Display"',
  '"Segoe UI Variable"',
  '"Segoe UI"',
  'system-ui',
  'sans-serif',
].join(',');

export const fontFamilyMono = [
  '"Cascadia Mono"',
  '"Cascadia Code"',
  'Consolas',
  '"Source Code Pro"',
  'SFMono-Regular',
  'Menlo',
  'monospace',
].join(',');

export const radius = {
  control: 4,
  overlay: 8,
  window: 8,
};

export const motion = {
  fast: '83ms',
  normal: '167ms',
  slow: '250ms',
  easing: 'cubic-bezier(0, 0, 0, 1)',
  easingAccelerate: 'cubic-bezier(0.7, 0, 1, 0.5)',
};

const light = {
  mode: 'light',
  shellBg: '#F3F3F3',
  layerBg: '#F9F9F9',
  layerAltBg: '#FBFBFB',
  surfaceBg: '#FFFFFF',
  cardBg: '#FFFFFF',
  flyoutBg: '#F9F9F9',
  tooltipBg: '#F9F9F9',
  text: '#1B1B1B',
  textSecondary: '#5D5D5D',
  textDisabled: '#A0A0A0',
  strokeSurface: '#E5E5E5',
  strokeDivider: '#E0E0E0',
  strokeCard: '#EBEBEB',
  strokeControl: '#E5E5E5',
  strokeControlStrong: '#8A8A8A',
  controlBg: '#FDFDFD',
  controlHoverBg: '#F6F6F6',
  controlPressedBg: '#F2F2F2',
  controlDisabledBg: '#F5F5F5',
  subtleHoverBg: 'rgba(0, 0, 0, 0.0373)',
  subtlePressedBg: 'rgba(0, 0, 0, 0.0241)',
  subtleSelectedBg: 'rgba(0, 0, 0, 0.0578)',
  scrollThumb: 'rgba(0, 0, 0, 0.4458)',
  scrollThumbHover: 'rgba(0, 0, 0, 0.6)',
  error: '#C42B1C',
  errorBg: '#FDE7E9',
  success: '#0F7B0F',
  successBg: '#DFF6DD',
  warning: '#9D5D00',
  warningFill: '#F7B500',
  warningBg: '#FFF4CE',
  info: '#005FB8',
  shadowFlyout: '0 8px 16px rgba(0, 0, 0, 0.14)',
  shadowDialog: '0 32px 64px rgba(0, 0, 0, 0.1876), 0 2px 21px rgba(0, 0, 0, 0.1474)',
  shadowCard: '0 2px 4px rgba(0, 0, 0, 0.04)',
  shadowTooltip: '0 4px 8px rgba(0, 0, 0, 0.14)',
};

const dark = {
  mode: 'dark',
  shellBg: '#202020',
  layerBg: '#2B2B2B',
  layerAltBg: '#2D2D2D',
  surfaceBg: '#272727',
  cardBg: '#2B2B2B',
  flyoutBg: '#2C2C2C',
  tooltipBg: '#2C2C2C',
  text: '#FFFFFF',
  textSecondary: '#C5C5C5',
  textDisabled: '#787878',
  strokeSurface: '#1C1C1C',
  strokeDivider: '#3A3A3A',
  strokeCard: '#1C1C1C',
  strokeControl: '#3A3A3A',
  strokeControlStrong: '#9A9A9A',
  controlBg: '#2D2D2D',
  controlHoverBg: '#323232',
  controlPressedBg: '#272727',
  controlDisabledBg: '#2A2A2A',
  subtleHoverBg: 'rgba(255, 255, 255, 0.0605)',
  subtlePressedBg: 'rgba(255, 255, 255, 0.0419)',
  subtleSelectedBg: 'rgba(255, 255, 255, 0.0837)',
  scrollThumb: 'rgba(255, 255, 255, 0.5442)',
  scrollThumbHover: 'rgba(255, 255, 255, 0.7)',
  error: '#FF99A4',
  errorBg: '#442726',
  success: '#6CCB5F',
  successBg: '#393D1B',
  warning: '#FCE100',
  warningFill: '#FCE100',
  warningBg: '#433519',
  info: '#60CDFF',
  shadowFlyout: '0 8px 16px rgba(0, 0, 0, 0.26)',
  shadowDialog: '0 32px 64px rgba(0, 0, 0, 0.37), 0 2px 21px rgba(0, 0, 0, 0.37)',
  shadowCard: '0 2px 4px rgba(0, 0, 0, 0.13)',
  shadowTooltip: '0 4px 8px rgba(0, 0, 0, 0.26)',
};

/* SQL syntax colours, based on the Light+ / Dark+ editor themes most
 * Windows developers already know from VS Code and SSMS. */
const editorLight = {
  keyword: '#0000FF',
  number: '#098658',
  string: '#A31515',
  variable: '#001080',
  type: '#267F99',
  comment: '#008000',
  punctuation: '#3B3B3B',
  operator: '#3B3B3B',
  name: '#795E26',
};

const editorDark = {
  keyword: '#569CD6',
  number: '#B5CEA8',
  string: '#CE9178',
  variable: '#9CDCFE',
  type: '#4EC9B0',
  comment: '#6A9955',
  punctuation: '#D4D4D4',
  operator: '#D4D4D4',
  name: '#DCDCAA',
};

export function getTokens(mode) {
  return mode === 'dark' ?
    {...dark, editor: editorDark} :
    {...light, editor: editorLight};
}

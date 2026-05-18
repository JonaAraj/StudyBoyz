import Constants from 'expo-constants';

const expoConfig = Constants.expoConfig ?? (Constants as any).manifest;
const extra = expoConfig?.extra || {};

const API_BASE_URL =
  extra.API_BASE_URL ||
  process.env.EXPO_API_BASE_URL ||
  'https://studyboyz.onrender.com/api';

export default API_BASE_URL;

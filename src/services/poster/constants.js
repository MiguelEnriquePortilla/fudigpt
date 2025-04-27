// src/services/poster/constants.js

// API Endpoints
export const POSTER_API_URL = 'https://joinposter.com/api';
export const POSTER_OAUTH_URL = 'https://joinposter.com/api/v2/auth';

// OAuth config
export const POSTER_CLIENT_ID = process.env.REACT_APP_POSTER_CLIENT_ID;
export const POSTER_CLIENT_SECRET = process.env.REACT_APP_POSTER_CLIENT_SECRET;
export const POSTER_REDIRECT_URI = process.env.REACT_APP_POSTER_REDIRECT_URI;

// Firestore collections
export const COLLECTION_RESTAURANT_DATA = 'poster_data';
export const COLLECTION_MENU = 'menu';
export const COLLECTION_INVENTORY = 'inventory';
export const COLLECTION_TRANSACTIONS = 'transactions';
export const COLLECTION_TOKENS = 'poster_tokens';
export const COLLECTION_RESTAURANTS = 'restaurants';

// Sync settings
export const MAX_SYNC_DAYS = 30;
export const RETRY_ATTEMPTS = 3;
export const RETRY_BACKOFF_MS = 1000;
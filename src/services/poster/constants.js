// src/services/poster/constants.js

// API Endpoints
export const POSTER_API_URL = 'https://joinposter.com/api';
export const POSTER_AUTH_URL = 'https://joinposter.com/api/v2/auth';

// OAuth config
export const POSTER_APP_ID = process.env.REACT_APP_POSTER_APP_ID || '4021';
export const POSTER_APP_SECRET = process.env.REACT_APP_POSTER_APP_SECRET || 'bce702a7b394b9962165bf55c12b8ddc';
export const POSTER_REDIRECT_URI = process.env.REACT_APP_POSTER_REDIRECT_URI || window.location.origin + '/auth-callback';

// Firestore collections and paths
export const COLLECTION_USERS = 'users';
export const COLLECTION_INTEGRATION = 'integration';
export const COLLECTION_POSTER = 'poster';
export const COLLECTION_POSTER_DATA = 'poster_data';
export const COLLECTION_PRODUCTS = 'products';
export const COLLECTION_INVENTORY = 'inventory';
export const COLLECTION_SALES = 'sales';
export const COLLECTION_ITEMS = 'items';

// Paths para acceso a Firestore (para evitar strings hardcodeados)
export const getPosterIntegrationPath = (userId) => `${COLLECTION_USERS}/${userId}/${COLLECTION_INTEGRATION}/${COLLECTION_POSTER}`;
export const getPosterDataPath = (userId, collection) => `${COLLECTION_USERS}/${userId}/${COLLECTION_POSTER_DATA}/${collection}/${COLLECTION_ITEMS}`;

// Sync settings
export const MAX_SYNC_DAYS = 30;
export const RETRY_ATTEMPTS = 3;
export const RETRY_BACKOFF_MS = 1000;
import { configureStore, combineReducers } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';
import cartReducer from './slices/cartSlice';
import wishlistReducer from './slices/wishlistSlice';
import customRequestReducer from './slices/customRequestSlice';
import notificationReducer from './slices/notificationSlice';

const appReducer = combineReducers({
  auth: authReducer,
  cart: cartReducer,
  wishlist: wishlistReducer,
  customRequests: customRequestReducer,
  notifications: notificationReducer,
});

const rootReducer = (state, action) => {
  if (
    action.type === 'auth/logout' || 
    action.type === 'auth/logoutUser/fulfilled' ||
    action.type === 'auth/loginSuccess' ||
    action.type === 'auth/checkAuthStatus/rejected'
  ) {
    state = {
      auth: state.auth
    };
  }
  return appReducer(state, action);
};

export const store = configureStore({
  reducer: rootReducer,
});
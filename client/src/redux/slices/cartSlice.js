import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../utils/axios';

// Async Thunks
export const fetchCart = createAsyncThunk(
  'cart/fetchCart',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get('/cart');
      const data = response.data?.cart ? response.data : response;
      return data.cart || data;
    } catch (error) {
      return rejectWithValue(error.message || 'Failed to fetch cart');
    }
  }
);

export const addToCart = createAsyncThunk(
  'cart/addToCart',
  async ({ productId, quantity = 1, variant }, { rejectWithValue }) => {
    try {
      const response = await api.post('/cart/add', { productId, quantity, variant });
      const data = response.data?.cart ? response.data : response;
      return data.cart || data;
    } catch (error) {
      return rejectWithValue(error.message || 'Failed to add item to cart');
    }
  }
);

export const updateCartItem = createAsyncThunk(
  'cart/updateCartItem',
  async ({ itemId, quantity }, { rejectWithValue }) => {
    try {
      const response = await api.put('/cart/update', { itemId, quantity });
      const data = response.data?.cart ? response.data : response;
      return data.cart || data;
    } catch (error) {
      return rejectWithValue(error.message || 'Failed to update item quantity');
    }
  }
);

export const removeFromCart = createAsyncThunk(
  'cart/removeFromCart',
  async (itemId, { rejectWithValue }) => {
    try {
      const response = await api.delete(`/cart/${itemId}`);
      const data = response.data?.cart ? response.data : response;
      return data.cart || data;
    } catch (error) {
      return rejectWithValue(error.message || 'Failed to remove item');
    }
  }
);

export const clearCart = createAsyncThunk(
  'cart/clearCart',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.delete('/cart');
      const data = response.data?.cart ? response.data : response;
      return data.cart || data;
    } catch (error) {
      return rejectWithValue(error.message || 'Failed to clear cart');
    }
  }
);

export const applyCoupon = createAsyncThunk(
  'cart/applyCoupon',
  async (code, { rejectWithValue }) => {
    try {
      const response = await api.post('/cart/coupon', { code });
      const data = response.data?.cart ? response.data : response;
      return data.cart || data;
    } catch (error) {
      return rejectWithValue(error.message || 'Failed to apply coupon');
    }
  }
);

export const removeCoupon = createAsyncThunk(
  'cart/removeCoupon',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.delete('/cart/coupon');
      const data = response.data?.cart ? response.data : response;
      return data.cart || data;
    } catch (error) {
      return rejectWithValue(error.message || 'Failed to remove coupon');
    }
  }
);

const initialState = {
  items: [],
  totalItems: 0,
  subtotal: 0,
  couponDiscount: 0,
  couponCode: null,
  total: 0,
  isOpen: false,
  isLoading: false,
  error: null,
};

const updateCartState = (state, cart) => {
  if (!cart) return;
  state.items = cart.items || [];
  state.totalItems = cart.totalItems || 0;
  state.subtotal = cart.subtotal || 0;
  state.couponDiscount = cart.couponDiscount || 0;
  state.couponCode = cart.couponCode || null;
  state.total = cart.total || 0;
};

const cartSlice = createSlice({
  name: 'cart',
  initialState,
  reducers: {
    setCart: (state, action) => {
      updateCartState(state, action.payload);
    },
    toggleCart: (state) => {
      state.isOpen = !state.isOpen;
    },
    openCart: (state) => {
      state.isOpen = true;
    },
    closeCart: (state) => {
      state.isOpen = false;
    },
    clearCartState: (state) => {
      return { ...initialState, isOpen: state.isOpen };
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch Cart
      .addCase(fetchCart.fulfilled, (state, action) => {
        updateCartState(state, action.payload);
      })
      // Add To Cart
      .addCase(addToCart.fulfilled, (state, action) => {
        updateCartState(state, action.payload);
      })
      // Update Cart Item
      .addCase(updateCartItem.fulfilled, (state, action) => {
        updateCartState(state, action.payload);
      })
      // Remove From Cart
      .addCase(removeFromCart.fulfilled, (state, action) => {
        updateCartState(state, action.payload);
      })
      // Clear Cart
      .addCase(clearCart.fulfilled, (state, action) => {
        updateCartState(state, action.payload);
      })
      // Apply Coupon
      .addCase(applyCoupon.fulfilled, (state, action) => {
        updateCartState(state, action.payload);
      })
      // Remove Coupon
      .addCase(removeCoupon.fulfilled, (state, action) => {
        updateCartState(state, action.payload);
      });
  },
});

export const { setCart, toggleCart, openCart, closeCart, clearCartState } = cartSlice.actions;
export default cartSlice.reducer;

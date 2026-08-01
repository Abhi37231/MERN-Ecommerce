import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from "../../utils/axios";

export const createCustomRequest = createAsyncThunk(
  'customRequests/create',
  async (formData, { rejectWithValue }) => {
    try {
      const response = await api.post('/custom-requests', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      return response.data.customRequest || response.customRequest;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to create request');
    }
  }
);

export const fetchMyRequests = createAsyncThunk(
  'customRequests/fetchMy',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get('/custom-requests/my-requests');
      return response.data.requests || response.requests;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch requests');
    }
  }
);

export const fetchAllRequests = createAsyncThunk(
  'customRequests/fetchAll',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get('/custom-requests');
      return response.data.requests || response.requests;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch all requests');
    }
  }
);

export const updateRequestStatus = createAsyncThunk(
  'customRequests/updateStatus',
  async ({ id, ...data }, { rejectWithValue }) => {
    try {
      const response = await api.put(`/custom-requests/${id}`, data);
      return response.data.customRequest || response.customRequest;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to update request');
    }
  }
);

export const acceptQuote = createAsyncThunk(
  'customRequests/acceptQuote',
  async (id, { rejectWithValue }) => {
    try {
      const response = await api.post(`/custom-requests/${id}/accept`);
      return response.data.customRequest || response.customRequest;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to accept quote');
    }
  }
);

export const addMessage = createAsyncThunk(
  'customRequests/addMessage',
  async ({ id, text }, { rejectWithValue }) => {
    try {
      const response = await api.post(`/custom-requests/${id}/messages`, { text });
      return response.data?.customRequest || response.customRequest;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to add message');
    }
  }
);

export const deleteRequest = createAsyncThunk(
  'customRequests/deleteRequest',
  async (id, { rejectWithValue }) => {
    try {
      await api.delete(`/custom-requests/${id}`);
      return id;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to delete request');
    }
  }
);

const customRequestSlice = createSlice({
  name: 'customRequests',
  initialState: {
    requests: [],
    loading: false,
    error: null,
  },
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch My Requests
      .addCase(fetchMyRequests.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchMyRequests.fulfilled, (state, action) => {
        state.loading = false;
        state.requests = action.payload;
      })
      .addCase(fetchMyRequests.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Fetch All Requests (Admin)
      .addCase(fetchAllRequests.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchAllRequests.fulfilled, (state, action) => {
        state.loading = false;
        state.requests = action.payload;
      })
      .addCase(fetchAllRequests.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Create Request
      .addCase(createCustomRequest.pending, (state) => {
        state.loading = true;
      })
      .addCase(createCustomRequest.fulfilled, (state, action) => {
        state.loading = false;
        state.requests.unshift(action.payload);
      })
      .addCase(createCustomRequest.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Update Request
      .addCase(updateRequestStatus.fulfilled, (state, action) => {
        const index = state.requests.findIndex(r => r._id === action.payload._id);
        if (index !== -1) {
          state.requests[index] = action.payload;
        }
      })
      // Accept Quote
      .addCase(acceptQuote.fulfilled, (state, action) => {
        const index = state.requests.findIndex(r => r._id === action.payload._id);
        if (index !== -1) {
          state.requests[index] = action.payload;
        }
      })
      // Add Message
      .addCase(addMessage.fulfilled, (state, action) => {
        const index = state.requests.findIndex(r => r._id === action.payload._id);
        if (index !== -1) {
          state.requests[index] = action.payload;
        }
      })
      // Delete Request
      .addCase(deleteRequest.fulfilled, (state, action) => {
        state.requests = state.requests.filter(r => r._id !== action.payload);
      });
  },
});

export const { clearError } = customRequestSlice.actions;
export default customRequestSlice.reducer;

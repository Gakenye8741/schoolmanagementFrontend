import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

interface AuthState {
    user: any | null;
    isAuthenticated: boolean;
    role: string | null;
}

const initialState: AuthState = {
    user: null,
    isAuthenticated: false,
    role: null,
};

const authSlice = createSlice({
    name: 'auth',
    initialState,
    reducers: {
        setCredentials: (state, action: PayloadAction<{ user: any }>) => {
            state.user = action.payload.user;
            state.role = action.payload.user?.role || null;
            state.isAuthenticated = true;
        },
        clearCredentials: (state) => {
            state.user = null;
            state.role = null;
            state.isAuthenticated = false;
        },
    },
});

export const { setCredentials, clearCredentials } = authSlice.actions;
export default authSlice.reducer;
import { configureStore } from "@reduxjs/toolkit";
import storage from "redux-persist/lib/storage";
import { persistReducer, persistStore } from "redux-persist";
import authReducer from "../features/Auth/AuthSlice";
import { authApi } from "../features/Apis/Auth.Api";
import { schoolApi } from "../features/Apis/School.Api";
import { termApi } from "../features/Apis/Academic.Api";
import { classesApi } from "../features/Apis/Class.Api";
import { studentApi } from "../features/Apis/students.Api";
import { usersApi } from "../features/Apis/Users.Api";

// Create Persist Configuration for auth Slice
const authPersistConfiguration = {
  key: 'auth',
  storage,
  whitelist: ['user', 'token', 'isAuthenticated', 'role'],
};

// Create A persistent Reducer for the AUTH
const persistedAuthReducer = persistReducer(authPersistConfiguration, authReducer);

export const store = configureStore({
  reducer: {
    auth: persistedAuthReducer, // <-- Added here so state.auth exists
    [authApi.reducerPath]: authApi.reducer,
    [schoolApi.reducerPath]: schoolApi.reducer,
    [termApi.reducerPath]: termApi.reducer,
    [classesApi.reducerPath]: classesApi.reducer,
    [studentApi.reducerPath]: studentApi.reducer,
    [usersApi.reducerPath]: usersApi.reducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false,
    }).concat(authApi.middleware,schoolApi.middleware,termApi.middleware,classesApi.middleware,studentApi.middleware,usersApi.middleware),
});

export const persister = persistStore(store);
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
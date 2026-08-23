import { configureStore } from "@reduxjs/toolkit";
import { persistStore, persistReducer } from "redux-persist";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { mainApi } from "../api/mainQuery";
import themeReducer from "./features/themeSlice";

const persistConfig = {
  key: "theme",
  storage: AsyncStorage,
};

const persistedThemeReducer = persistReducer(persistConfig, themeReducer);

export const store = configureStore({
  reducer: {
    theme: persistedThemeReducer,
    [mainApi.reducerPath]: mainApi.reducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({ serializableCheck: false }).concat(mainApi.middleware),
});

export const persistor = persistStore(store);

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

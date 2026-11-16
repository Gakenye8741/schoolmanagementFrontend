import { configureStore } from "@reduxjs/toolkit";
import storage from "redux-persist/lib/storage";
import { persistReducer, persistStore } from "redux-persist";
import authReducer from "../features/Auth/AuthSlice";
import { authApi } from "../features/Apis/Auth.Api";
import { schoolApi } from "../features/Apis/School.Api";
import { termApi } from "../features/Apis/Term.Api";
import { classesApi } from "../features/Apis/Class.Api";
import { studentApi } from "../features/Apis/students.Api";
import { usersApi } from "../features/Apis/Users.Api";
import { academicStructureApi } from "../features/Apis/academicStructure.Api";
import { curriculumApi } from "../features/Apis/Curriculum.Api";
import { disciplineApi } from "../features/Apis/Discipline.Api";
import { eventsApi } from "../features/Apis/Events.Api";
import { examsApi } from "../features/Apis/Exams.Api";
import { expensesApi } from "../features/Apis/Expenses.Api";
import { gradingScalesApi } from "../features/Apis/gradeScake.Api";
import { timetablesApi } from "../features/Apis/Timetables.Api";
import { notificationsApi } from "../features/Apis/Notifications.Api";
import { reportCardsApi } from "../features/Apis/ReportCard.Api";
import { attendanceApi } from "../features/Apis/Attendance.Apis";
import { feesApi } from "../features/Apis/Fees.Api";
import { homeworkApi } from "../features/Apis/Homework.Api";

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
    [academicStructureApi.reducerPath]: academicStructureApi.reducer,
    [curriculumApi.reducerPath]: curriculumApi.reducer,
    [disciplineApi.reducerPath]: disciplineApi.reducer,
    [eventsApi.reducerPath]: eventsApi.reducer,
    [examsApi.reducerPath]:examsApi.reducer,
    [expensesApi.reducerPath]: expensesApi.reducer,
    [gradingScalesApi.reducerPath]: gradingScalesApi.reducer,
    [timetablesApi.reducerPath]: timetablesApi.reducer,
    [notificationsApi.reducerPath]: notificationsApi.reducer,
    [reportCardsApi.reducerPath]: reportCardsApi.reducer,
    [attendanceApi.reducerPath]: attendanceApi.reducer,
    [feesApi.reducerPath]: feesApi.reducer,
    [homeworkApi.reducerPath]: homeworkApi.reducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false,
    }).concat(authApi.middleware,schoolApi.middleware,termApi.middleware,classesApi.middleware,studentApi.middleware,usersApi.middleware,academicStructureApi.middleware,curriculumApi.middleware,disciplineApi.middleware,eventsApi.middleware,examsApi.middleware,expensesApi.middleware,gradingScalesApi.middleware,timetablesApi.middleware,notificationsApi.middleware,reportCardsApi.middleware,attendanceApi.middleware,feesApi.middleware,homeworkApi.middleware),
});

export const persister = persistStore(store);
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
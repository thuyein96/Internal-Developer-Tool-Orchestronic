import { configureStore } from "@reduxjs/toolkit"
import repoReducer from "@/components/requests/state/repo-slice"

export const store = configureStore({
  reducer: {
    repoName: repoReducer,
  },
})

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch

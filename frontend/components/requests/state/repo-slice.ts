import { createSlice, PayloadAction } from "@reduxjs/toolkit"

interface RepoState {
  value: string
}

const initialState: RepoState = {
  value: "",
}

const repoSlice = createSlice({
  name: "repo",
  initialState,
  reducers: {
    setRepoName: (state, action: PayloadAction<string>) => {
      state.value = action.payload
    },
  },
})

export const { setRepoName } = repoSlice.actions
export default repoSlice.reducer

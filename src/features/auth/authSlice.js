import { createSlice } from '@reduxjs/toolkit';

// Hydrate from localStorage so a refresh keeps the session.
const stored = (() => {
  try {
    const raw = localStorage.getItem('crm_auth');
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
})();

const initialState = {
  token: stored?.token || null,
  user: stored?.user || null,
};

const persist = (state) => {
  try {
    localStorage.setItem(
      'crm_auth',
      JSON.stringify({ token: state.token, user: state.user })
    );
  } catch {
    /* ignore quota errors */
  }
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setCredentials: (state, { payload }) => {
      state.token = payload.accessToken ?? state.token;
      if (payload.user) state.user = payload.user;
      persist(state);
    },
    setUser: (state, { payload }) => {
      state.user = payload;
      persist(state);
    },
    logOut: (state) => {
      state.token = null;
      state.user = null;
      try {
        localStorage.removeItem('crm_auth');
      } catch {
        /* ignore */
      }
    },
  },
});

export const { setCredentials, setUser, logOut } = authSlice.actions;
export default authSlice.reducer;

// Selectors (stable references → fewer re-renders).
export const selectToken = (s) => s.auth.token;
export const selectUser = (s) => s.auth.user;
export const selectRole = (s) => s.auth.user?.role;
export const selectIsAuthed = (s) => Boolean(s.auth.token);

import session from 'express-session';
import MemoryStore from 'memorystore';

const SESSION_SECRET = process.env.SESSION_SECRET || 'your-secret-key';
const SessionStore = MemoryStore(session);

export const sessionConfig = {
  secret: SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  store: new SessionStore({
    checkPeriod: 86400000, // 24 hours
  }),
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    maxAge: 24 * 60 * 60 * 1000, // 24 hours
  },
}; 
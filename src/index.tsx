import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';
import { auth } from './services/firebase';

// Expose auth helper for dev testing (get Firebase ID token from browser console)
// Usage: getToken()
(window as any).getToken = async () => {
  const user = auth.currentUser;
  if (!user) {
    console.log('No user logged in');
    return null;
  }
  const token = await user.getIdToken();
  console.log(token);
  return token;
};

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();

import React from 'react';
import ReactDOM from 'react-dom';
import App from './App';
import './index.css';

// Auth client right away
fetch('api/auth', {
  accept: 'application/json',
}).then(function(response) {
  if (response.status >= 200 && response.status < 300) {
    return response;
  } else {
    const error = new Error(`HTTP Error ${response.statusText}`);
    error.status = response.statusText;
    error.response = response;
    console.log(error); // eslint-disable-line no-console
    throw error;
  }
}).then(function(response) {
  return response.json();
}).then(function(response) {
  window.client_token = response;
});

ReactDOM.render(
  <App />,
  document.getElementById('root')
);
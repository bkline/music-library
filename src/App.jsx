/**
 * @fileoverview Proof of concept for React library catalog application.
 * @author Bob Kline
 * @date 2024-11-08
 */
import React, { useEffect, useState } from 'react';
import ReactDOM from 'react-dom/client';
import { Container } from 'react-bootstrap';
import { toast, ToastContainer } from 'react-toastify';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'react-bootstrap-typeahead/css/Typeahead.css';
import 'react-bootstrap-typeahead/css/Typeahead.bs5.css';
import 'react-toastify/dist/ReactToastify.css';
import $ from 'jquery';
import LoginForm from './LoginForm';
import Router from './Router';
import 'bootstrap/dist/js/bootstrap.bundle.min';
import './style.css';

// Import the JSON config at build time.
import config from '../config.json';

// Make jQuery globally available.
window.$ = $;
window.jQuery = $;

// import SortableTypeahead from './SortableTypeahead';
const App = () => {

  // Keep track of persistent values.
  const [waiting, setWaiting] = useState(true);
  const [user, setUser] = useState(null);
  const params = new URLSearchParams(window.location.search);
  const debugging = !!params.get('debug');
  const maintenance_mode = false;

  // Get the user login account information..
  useEffect(() => {
    const parms = debugging ? '?debug=true' : '';
    const fetchUserData = async () => {
      try {
        const response = await fetch(`/library/api/session${parms}`);
        if (!response.ok) {
          throw new Error('Network error');
        }
        const data = await response.json();
        const username = data.name ?? '';
        setUser(username ? data : null);
      } catch (err) {
        console.error('failure', err);
        toast.error(`Failure fetching session information: ${err.message}`);
      } finally {
        setWaiting(false);
      }
    };
    fetchUserData();
  }, []);
  if (waiting) {
    return <div>Waiting ...</div>
  }
  if (maintenance_mode) {
    if (!params.get('under-construction') && user?.name != 'bobk') {
      return (
        <Container className="app-wrapper container mt-5">
          <h1>Sorry For The Dust</h1>
          <div className="d-flex align-items-center">
            <img
              src="static/under-construction.jpg"
              className="float-start me-3"
            />
            <p className="text-danger fs-3 ms-2">
              The Music Library Catalog site is currently undergoing
              some maintainence work.<br/> We'll be back soon!
            </p>
          </div>
        </Container>
      );
    }
  }

  // Release the session.
  const logout = async () => {
    const parms = debugging ? '?debug=true' : '';
    const url = `/library/api/session${parms}`;
    try {
      const response = await fetch(url, { method: 'DELETE' });
      if (!response.ok) {
        throw new Error('Network error');
      }
      const data = await response.json();
      if (data.status === 'success') {
        const msg = 'Thanks for spending quality time with the library. 🎶';
        toast.success(msg);
        setUser(null);
      } else {
        toast.warn(data.message);
      }
    } catch (error) {
      toast.error(`Failure logging out: ${error.message}`);
    }
  };

  // Create the top-level component for the page.
  return (
    <Container className="app-wrapper container mt-5">
      <ToastContainer theme="light" />
      {user && (
        <Router
          config={config}
          user={user}
          logout={logout}
          debugging={debugging}
        />
      )}
      {!user && <LoginForm setUser={setUser} debugging={debugging} />}
    </Container>
  );
};

// Plug in the top-level component at the template's root element.
const rootElement = document.getElementById('root');
const root = ReactDOM.createRoot(rootElement);
root.render(<App />);

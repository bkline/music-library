/**
 * @fileoverview Proof of concept for React library catalog application.
 * @author Bob Kline
 * @date 2024-11-08
 */
import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { toast } from 'react-toastify';
import Menu from './Menu';
import Catalog from './Catalog';
import LoginForm from './LoginForm';
import LookupTable from './LookupTable';
import Reports from './Reports';
import Report from './Report';
import Print from './Print';
import Accounts from './Accounts';
import Account from './Account';
import Audit from './Audit';
import Help from './Help';

const Router = ({ config }) => {

  // Keep track of persistent values.
  const [waiting, setWaiting] = useState(true);
  const [user, setUser] = useState(null);
  const params = new URLSearchParams(window.location.search);
  const debugging = !!params.get('debug');

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

  /**
   * Handle several conditions.
   *  1. The site is in maintenance mode (only available for logged-in admins).
   *  2. This is a new site with no login accounts.
   *  3. Not a new site, but no user has an active session on this browser.
   *  4. A valid user is logged in.
   */
  return (
    <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      {config.maintenance_mode && user?.admin && (
        <p className="h2 mb-5 text-danger text-center text-weight-bold font-italic">
          🚧 Site is in maintenance mode! 🚧
        </p>
      )}
      {config.maintenance_mode && !user?.admin ? (
        <>
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
        </>
      ) : user && user.id === 0 ? (
        <Accounts config={config} user={user} setUser={setUser} debugging={debugging} />
      ) : !user ? (
        <LoginForm setUser={setUser} debugging={debugging} />
      ) : (
        <>
          <Menu config={config} user={user} logout={logout} />
          <Routes>
            <Route path="/library"
                   element={<Reports config={config} user={user} debugging={debugging} />} />
            <Route path="/library/report/:request"
                   element={<Report config={config} user={user} debugging={debugging} />} />
            <Route path="/library/edit"
                   element={<Catalog config={config} user={user} debugging={debugging} />} />
            <Route path="/library/:id"
                   element={<Print config={config} user={user} debugging={debugging} />} />
            <Route path="/library/lookup/:table"
                   element={<LookupTable config={config} user={user} debugging={debugging} />} />
            <Route path="/library/accounts"
                   element={<Accounts config={config} user={user} setUser={setUser} debugging={debugging} />} />
            <Route path="/library/accounts/:id"
                   element={<Account config={config} user={user} debugging={debugging} />} />
            <Route path="/library/audit"
                   element={<Audit config={config} user={user} debugging={debugging} />} />
            <Route path="/library/help" element={<Help user={user} />} />
          </Routes>
        </>
      )}
    </BrowserRouter>
  );
};

export default Router;

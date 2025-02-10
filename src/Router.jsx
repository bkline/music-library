/**
 * @fileoverview Proof of concept for React library catalog application.
 * @author Bob Kline
 * @date 2024-11-08
 */
import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Menu from './Menu';
import Catalog from './Catalog';
import LookupTable from './LookupTable';
import Reports from './Reports';
import Report from './Report';
import Print from './Print';
import Accounts from './Accounts';
import Account from './Account';
import Audit from './Audit';
import Help from './Help';

const Router = (props) => (
  <BrowserRouter
    future={{ v7_startTransition: true, v7_relativeSplatPath: true }}
  >
    <Menu config={props.config} user={props.user} logout={props.logout} />
    <Routes>
      <Route path="/library"
             element={<Reports {...props} />} />
      <Route path="/library/report/:request"
             element={<Report {...props} />} />
      <Route path="/library/edit"
             element={<Catalog {...props} />} />
      <Route path="/library/:id"
             element={<Print {...props} />} />
      <Route path="/library/lookup/:table"
             element={<LookupTable {...props} />} />
      <Route path="/library/accounts"
             element={<Accounts {...props} />} />
      <Route path="/library/accounts/:id"
             element={<Account {...props} />} />
      <Route path="/library/audit"
             element={<Audit {...props} />} />
      <Route path="/library/help" element={<Help user={props.user} />} />
    </Routes>
  </BrowserRouter>
);

export default Router;

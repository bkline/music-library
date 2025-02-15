/**
 * @fileoverview Proof of concept for React library catalog application.
 * @author Bob Kline
 * @date 2024-11-08
 */
import React from 'react';
import ReactDOM from 'react-dom/client';
import { Container } from 'react-bootstrap';
import { ToastContainer } from 'react-toastify';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'react-bootstrap-typeahead/css/Typeahead.css';
import 'react-bootstrap-typeahead/css/Typeahead.bs5.css';
import 'react-toastify/dist/ReactToastify.css';
import $ from 'jquery';
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

  // Create the top-level component for the page.
  return (
    <Container className="app-wrapper container mt-5">
      <ToastContainer theme="light" />
      <Router config={config} />
    </Container>
  );
};

// Plug in the top-level component at the template's root element.
const rootElement = document.getElementById('root');
const root = ReactDOM.createRoot(rootElement);
root.render(<App />);

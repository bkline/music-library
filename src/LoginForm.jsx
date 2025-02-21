/**
 * @fileoverview Proof of concept for React library catalog application.
 * @author Bob Kline
 * @date 2024-12-11
 */
import React, { useState, useEffect, useRef } from 'react';
import { Form, Button} from 'react-bootstrap';
import { toast } from 'react-toastify';

const LoginForm = ({ setUser, debugging, prod }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  // Utility function to detect mobile devices
  const isMobileDevice = () => /Mobi|Android/i.test(navigator.userAgent);

  // Used to set the focus of the form's first field.
  const usernameInputRef = useRef(null);

  // Set the focus to the first field on the form.
  useEffect(() => {
    if (usernameInputRef.current && !isMobileDevice()) {
      usernameInputRef.current.focus();
    }
  }, []);

  // Create an new session for the user.
  const login = async (e) => {
    e.preventDefault();
    const parms = debugging ? '?debug=true' : '';
    try {
      const response = await fetch(`/library/api/session${parms}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });
      const data = await response.json();
      if (data.status === 'success') {
        setUser(data.account);
        toast.success('Login successful. 🎉');
      } else {
        toast.warn(data.message);
      }
    } catch (error) {
      console.error(error);
      toast.warn('Please try again.');
    }
  };

  return (
    <>
      <h1>Log In</h1>
      {prod && (
        <p className="text-danger ms-2 border border-danger rounded p-2">
          ⚠️ This is a test server. Do not do any production work on this server,
          as it will not be stored in the actual catalog. If you thought you were
          logging into the production server, then <a href={prod}>{prod}</a> is
          the link you want.
        </p>
      )}
      <Form onSubmit={login}>
        <Form.Group controlId="username">
          <Form.Label>Username</Form.Label>
          <Form.Control
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
            style={{ textTransform: "none" }}
            placeholder="Enter your account name"
            autoComplete="off"
            autoCapitalize="off"
            ref={usernameInputRef}
          />
        </Form.Group>
        <Form.Group controlId="password">
          <Form.Label>Password</Form.Label>
          <Form.Control
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </Form.Group>
        <Button variant="primary" type="submit" className="mt-3">
          Login
        </Button>
      </Form>
    </>
  );
};

export default LoginForm;

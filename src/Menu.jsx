/**
 * @fileoverview Menu navigation bar
 * @author Bob Kline
 * @date 2024-11-08
 */
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Navbar, Nav, NavDropdown } from 'react-bootstrap';

const Menu = ({ config, user, logout }) => {

  // Note where we are.
  const location = useLocation();

  // Collect the auxiliary tables we need to manage.
  const lookupTables = Object.entries(config.lookup_tables)
    .map(([key, value]) => ({ slug: key, label: value.menu_label }))
    .sort((a, b) => a.label.localeCompare(b.label));

  return (
    <Navbar bg="light" expand="lg">
      <Navbar.Toggle aria-controls="basic-navbar-nav" />
      <Navbar.Collapse id="basic-navbar-nav">
        <Nav className="ms-auto" activeKey={location.pathname}>
          <Nav.Link as={Link} to="/library" eventKey="/library">
            Browse
          </Nav.Link>
          {user && !user.readonly && (
            <>
            <Nav.Link as={Link} to="/library/edit" eventKey="/library/edit">
              Edit
            </Nav.Link>
              <NavDropdown title="Lookup Tables" id="basic-nav-dropdown">
                {lookupTables.map((table, tableIndex) => (
                  <NavDropdown.Item
                    key={tableIndex}
                    as={Link}
                    to={`/library/lookup/${table.slug}`}
                    eventKey={`/library/lookup/${table.slug}`}
                  >
                    {table.label}
                  </NavDropdown.Item>
                ))}
              </NavDropdown>
            </>
          )}
          {user && user.admin && (
            <>
              <Nav.Link
                as={Link}
                to="/library/accounts"
                eventKey="/library/accounts"
              >
                Accounts
              </Nav.Link>
              <Nav.Link
                as={Link}
                to="/library/audit"
                eventKey="/library/audit"
              >
                Audit Trail
              </Nav.Link>
            </>
          )}
          <Nav.Link as={Link} to="/library/help" eventKey="/library/help">
            Help
          </Nav.Link>
          <Nav.Link
            as={Link}
            onClick={logout}
            className="me-2"
            to="#"
            id="logout-button"
          >
            Logout
          </Nav.Link>
        </Nav>
      </Navbar.Collapse>
    </Navbar>
  );
};

export default Menu;

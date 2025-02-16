/**
 * @fileoverview Menu navigation bar
 * @author Bob Kline
 * @date 2024-11-08
 */
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Table } from 'react-bootstrap';
import { toast } from 'react-toastify';
import Account from './Account';

const Accounts = (props) => {

  const cols = ['Account', 'Name', 'Password', 'Role', 'State', 'Comment'];
  const suppress = ['Password', 'Comment'];
  const [accounts, setAccounts] = useState([]);
  const [account, setAccount] = useState(null);
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const fetchAccounts = async () => {
    const parms = props.debugging ? '?debug=true' : '';
    const url = `/library/api/account${parms}`;
    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error('Network error');
      }
      const data = await response.json();
      setAccounts(data);
    } catch (error) {
      console.error(error);
      toast.error(`Failure fetching accounts: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Load the login accounts for the site.
  useEffect(() => {
    setLoading(true);
    fetchAccounts();
  }, []);
  if (loading) {
    return <div>Loading...</div>;
  }

  // Callback for the Create button.
  const handleAdd = () => {
    setAccount({
      account_readonly: props.user.id !== 0,
      account_admin: props.user.id === 0,
      account_status: 'Active',
    });
    setEditing(true);
  };

  // Callback for a record's Edit button.
  const handleEdit = (record) => {
    setAccount(record);
    setEditing(true);
  };

  const handleSave = () => {
    setEditing(false);
    setAccount(null);
    setLoading(true);
    if (props.user.id === 0) {
      props.setUser(null);
      navigate('/library');
    } else {
      fetchAccounts();
    }
  };

  const handleCancel = () => {
    setEditing(false);
    setAccount(null);
  };

  if (editing) {
    return (
      <Account
        {...props}
        record={account}
        onSave={handleSave}
        onCancel={handleCancel}
      />
    );
  }


  return (
    <>
      <h1>User Login Accounts</h1>
      {props.user.id === 0 && (
        <p className="fst-italic mb-4">
          There are no accounts in the system yet. Create an active admin account.
        </p>
      )}
      <button type="button"
              className="btn btn-success mb-3"
              onClick={handleAdd}
      >
        Create Account
      </button>
      {accounts.length > 0 && (
        <Table size="sm" responsive hover>
          <thead>
            <tr>
              {cols.map(col => {
                if (!suppress.includes(col))
                  return <th key={col}>{col}</th>;
                return (
                  <th key={col} className="d-none d-lg-table-cell">
                    {col}
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {accounts.map((acct, key) => (
              <tr
                key={key}
                onClick={() => { handleEdit(acct)}}
                role="button"
                className="cursor-pointerxxx"
              >
                <td>{acct.account_name}</td>
                <td>{acct.account_fullname}</td>
                <td className="d-none d-lg-table-cell">
                  {acct.account_password}
                </td>
                <td>
                  {acct.account_admin ? 'admin' :
                   acct.account_readonly ? 'viewer' : 'editor'}
                </td>
                {acct.account_status === 'Active' && (
                  <td
                    className="text-center text-success"
                    title="This account is active"
                  >
                    ✅
                  </td>
                )}
                {acct.account_status === 'Inactive' && (
                  <td
                    className="text-center text-danger"
                    title="This account has been retired"
                  >
                    ⛔️
                  </td>
                )}
                <td className="d-none d-lg-table-cell">
                  {acct.account_comment}
                </td>
              </tr>
            ))}
          </tbody>
        </Table>
      )}
    </>
  );
};

export default Accounts;

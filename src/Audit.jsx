/**
 * @fileoverview Menu navigation bar
 * @author Bob Kline
 * @date 2024-11-08
 */
import React, { useEffect, useState } from 'react';
import { Table } from 'react-bootstrap';
import { toast } from 'react-toastify';

const Audit = (props) => {
  const cols = ['When', 'What', 'Who', 'Table', 'Row Key'];
  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState(null);
  const fetchAuditTrail = async () => {
    const parms = props.debugging ? '?debug=true' : '';
    try {
      const response = await fetch(`/library/api/audit${parms}`);
      if (!response.ok) {
        throw new Error('Network error');
      }
      const data = await response.json();
      setRows(data);
    } catch (error) {
      console.error(error);
      toast.error(`Failure loading audit trail records: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };
  // Load the login accounts for the site.
  useEffect(() => {
    setLoading(true);
    fetchAuditTrail();
  }, []);
  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <>
      <h1>Audit Trail</h1>
      <Table size="sm" responsive>
        <thead>
          <tr>
            {cols.map(col => <th key={col}>{col}</th>)}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, key) => (
            <tr key={key}>
              <td>{row.AuditWhen}</td>
              <td>{row.AuditAction}</td>
              <td>{row.AuditWho}</td>
              <td>{row.AuditTable}</td>
              <td>{row.AuditKey}</td>
            </tr>
          ))}
        </tbody>
      </Table>
    </>
  );
};

export default Audit;

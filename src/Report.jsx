/**
 * @fileoverview Generate reports for the music library.
 * @author Bob Kline
 * @date 2024-11-20
 */
import React, { useEffect, useState } from "react";
import { Table } from 'react-bootstrap';
import { useParams } from 'react-router-dom';
import { toast } from 'react-toastify';

const Report = (props) => {
  const [report, setReport] = useState(null);
  const [waiting, setWaiting] = useState(true);
  const { request } = useParams();
  const debugging = props.debugging ? '?debug=true' : '';
  useEffect(() => {
    const fetchReport = async () => {
      const url = `/library/api/report/${request}${debugging}`;
      try {
        const response = await fetch(url);
        const data = await response.json();
        setReport(data);
      } catch (error) {
        console.error(error);
        toast.error(`Report failure: ${error}`);
      } finally {
        setWaiting(false);
      }
    };
    fetchReport();
  }, []);
  if (waiting) {
    return <div>Waiting ...</div>
  }
  const elapsed = report.elapsed.toFixed(3);
  const rows = report.rows.length;
  const { user } = props;
  const footer = `${rows} rows in ${elapsed} seconds for ${user.fullname}`;
  return (
    <>
      <h1>{report.title}</h1>
      <Table striped hover size="sm" responsive="lg" className="fs-6">
        <thead className="sticky-header">
          <tr>
            {report.columns.map((col, key) => <th key={key}>{col}</th>)}
          </tr>
        </thead>
        <tbody>
          {report.rows.map((row, key) => (
            <tr key={key}>
              {row.map((v, i) => {
                let value = v;
                const col = report.columns[i];
                const rightAligned = ['Copies On Hand', 'Duration'];
                if (rightAligned.includes(col)) {
                  if (value != null && col === 'Copies On Hand')
                    value *= 1; // Convert '00023' to 23.
                  return <td key={i} className="text-end">{value}</td>;
                }
                if (col === 'Item ID') {
                  const id = Number(v);
                  const url = `/library/${id}${debugging}`;
                  return (
                    <td key={i}>
                      <a href={url} target="_blank" rel="noreferrer">{v}</a>
                    </td>
                  );
                }
                return <td key={i}>{v}</td>;
              })}
            </tr>
          ))}
        </tbody>
      </Table>
      <p className="report-footer">{footer}</p>
    </>
  );
};

export default Report;

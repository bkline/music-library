/**
 * @fileoverview Proof of concept for React library catalog application.
 * @author Bob Kline
 * @date 2024-11-08
 */
import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Table } from 'react-bootstrap';
import './print.css';

const Print = (props) => {
  const { id } = useParams();
  const [ record, setRecord ] = useState(null);
  const [ loading, setLoading ] = useState(true);

  const fetchRecord = async (recid) => {
    const debug = props.debugging ? '?debug=true' : '';
    const response = await fetch(`/library/api/print/${recid}${debug}`);
    const values = await response.json();
    setRecord(values);
    setLoading(false);
  };
  useEffect(() => { fetchRecord(id); }, []);
  if (loading) { return <p>Loading ...</p>; }

  return (
    <div className="print mt-5">
      <h1 className="text-center fs-4">
        {record.title} [item ID {id}]
      </h1>
      <Table size="sm" borderless>
        <tbody>
          {record.blocks.map((block, blockIndex) => (
            <React.Fragment key={blockIndex}>
              <tr key={`block-${blockIndex}`}>
                <th colSpan="2" className="group">{block.label}</th>
              </tr>
              {block.values.map((value, valueIndex) => (
                <tr key={`value-${blockIndex}-${valueIndex}`}>
                  <th className="text-end">{value.label}</th>
                  <td>{value.display}</td>
                </tr>
              ))}
            </React.Fragment>
          ))}
        </tbody>
      </Table>
    </div>
  );
};

export default Print;

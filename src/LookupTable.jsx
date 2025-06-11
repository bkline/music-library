/**
 * @fileoverview Management of auxiliary lookup tables.
 * @author Bob Kline
 * @date 2024-11-20
 */
import React, { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import { useParams } from 'react-router-dom';
import { Form } from 'react-bootstrap';
import LookupEditingForm from './LookupEditingForm';

const LookupTable = (props) => {

  // Track our states.
  const { table } = useParams();
  const [submenuSelection, setSubmenuSelection] = useState(table);
  const config = props.config.lookup_tables[table];
  const [value, setValue] = useState(null);
  const [values, setValues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingRecord, setEditingRecord] = useState(false);
  const [editRecord, setEditRecord] = useState(null);

  if (table !== submenuSelection) {
    setValue(null);
    setEditingRecord(false);
    setEditRecord(null);
    setSubmenuSelection(table);
  }
  const fetchValues = async () => {
    const parms = props.debugging ? '?debug=true' : '';
    const url = `/library/api/${table}${parms}`;
    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error('Network response was not ok');
      }
      const data = await response.json();
      setValues(data);
    } catch (error) {
      console.error(error);
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  // Load the values for this table.
  useEffect(() => {
    setLoading(true);
    setValue(null);
    fetchValues();
  }, [submenuSelection]);
  if (loading) {
    return <div>Loading...</div>;
  }

  // Callback for the editing form's Cancel button.
  const handleCancel = () => {
    setEditRecord(null);
    setEditingRecord(false);
  };

  // Keep track of the currently selected value.
  const handleChange = (e) => setValue(e.target.value);

  // Callback for the Create button.
  const handleAddNew = () => {
    if (editingRecord) {
      handleCancel();
    }
    setEditRecord({});
    setEditingRecord(true);
  };

  // Callback for the Edit button.
  const handleEdit = async () => {
    if (!value) {
      toast.warn('No value selected to edit!');
    } else {
      if (editingRecord)
        handleCancel();
      const parms = props.debugging ? '?debug=true' : '';
      const url = `/library/api/${table}/${value}${parms}`;
      try {
        const response = await fetch(url);
        if (!response.ok) {
          throw new Error('Network response was not ok');
        }
        const data = await response.json();
        setEditRecord(data);
        setEditingRecord(true);
      } catch (error) {
        console.error(error);
        toast.error(`Failure fetching record: ${error.message}`);
      }
    }
  };

  // Save a new or changed record.
  const handleSave = async (record) => {
    const primaryKey = config.primary_key;
    const id = record[primaryKey] ?? '';
    const slug = id ? `/${id}` : '';
    const parms = props.debugging ? '?debug=true' : '';
    const url = `/library/api/${table}${slug}${parms}`;
    try {
      const response = await fetch(url, {
        method: id ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(record),
      });
      if (!response.ok) {
        throw new Error('Network response was not ok');
      }
      toast.success('Value successfully saved');
      setEditingRecord(false);
      setEditRecord(null);
      fetchValues();
    } catch (error) {
      console.error(error);
      toast.error(`Failure saving record: ${error.message}`);
    }
  };

  // Callback for a value form's Delete button.
  const handleDelete = async () => {
    const parms = props.debugging ? '?debug=true' : '';
    const url = `/library/api/${table}/${value}${parms}`;
    try {
      const response = await fetch(url, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
      });
      if (!response.ok) {
        throw new Error('Network response was not ok');
      }
      toast.success('Value successfully deleted.');
      setEditingRecord(false);
      setEditRecord(null);
      fetchValues();
    } catch (error) {
      const message = `Failure deleting value: ${error.message}`;
      console.error(message);
      toast.error(message);
    }
  };

  return (
    <>
      <h1>Lookup Table Management</h1>
      <h2>{config.menu_label}</h2>
      <Form>
        <Form.Select
          name="lookup-values"
          aria-label={`${table} lookup values`}
          onChange={handleChange}
        >
          <option value="">Select a value to edit ...</option>
          {values.map(option => (
            <option value={option.id} key={option.id}>
              {option.display}
              {(option.sort || option.sort === 0) &&
               ` (sort position ${option.sort})`
              }
            </option>
          ))}
        </Form.Select>
        <div className="d-flex justify-content-start mt-3">
          <button type="button"
                  onClick={handleEdit}
                  className="btn btn-primary">Edit</button>
          <button type="button"
                  className="btn btn-success ms-2"
                  onClick={handleAddNew}>Create</button>
        </div>
      </Form>
      {editingRecord && (
        <LookupEditingForm
          onCancel={handleCancel}
          onDelete={handleDelete}
          onSave={handleSave}
          config={config}
          data={editRecord}
          uuid={crypto.randomUUID()}
          debugging={props.debugging}
        />
      )}
    </>
  );
};

export default LookupTable;

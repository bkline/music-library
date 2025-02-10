/**
 * @fileoverview Management of auxiliary lookup tables.
 * @author Bob Kline
 * @date 2024-11-20
 */
import React, { useEffect, useState, useRef } from "react";
import { toast } from 'react-toastify';
import { Form } from 'react-bootstrap';
import FormRow from './FormRow';
import ConfirmationButton from './ConfirmationButton';
import validateForm from './utils';

const LookupEditingForm = (props) => {

  // Keep track of the form data as the user works.
  const [formData, setFormData] = useState(props.data);
  const [errors, setErrors] = useState({});
  const [picklists, setPicklists] = useState({});
  const [loading, setLoading] = useState(true);
  const formRef = useRef(null);
  useEffect(() => { setFormData(props.data) }, [props.data]);
  const primaryKey = props.config.primary_key;
  const isNew = !formData[primaryKey];
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prevState => ({
      ...prevState,
      [name]: value
    }));
  };

  // Load the picklists for controlled-value fields.
  useEffect(() => {
    const names = [];
    props.config.rows.forEach(row => {
      row.forEach(field => {
        if (field.picklist && !names.includes(field.picklist)) {
          names.push(field.picklist);
        }
      })
    });
    if (names.length > 0) {
      const fetchPicklists = async () => {
        const values = {};
        const parms = props.debugging ? '?debug=true' : '';
        const promises = names.map(async name => {
          try {
            const response = await fetch(`/library/api/${name}${parms}`);
            if (!response.ok) {
              throw new Error('Network error');
            }
            const data = await response.json();
            values[name] = data;
          } catch (error) {
            console.error('Error fetching picklist:', error);
            throw error;
          }
        });
        try {
          await Promise.all(promises);
          setPicklists(values);
        } catch (error) {
          toast.error('Failure loading picklists.');
          console.error("Error fetching picklists:", error);
        } finally {
          setLoading(false);
        }
      };
      fetchPicklists(names);
    } else {
      setLoading(false);
    }
  }, []);
  if (loading) {
    return <div>Loading...</div>;
  }

  // Let the Catalog component's callback handle saving the results.
  const handleSave = () => {
    const fields = props.config.rows.flatMap(field => field);
    if (!validateForm(fields, formData, setErrors, formRef.current))
      toast.warn('Validation errors on form.');
    else {
      props.onSave(formData);
    }
  };

  const usedBy = formData.used_by ?? 0;

  return (
    <div className="mt-4 mb-3">
      <h2>Editing Lookup Value</h2>
      {usedBy > 0 && <p><em>(Used by {usedBy} records)</em></p>}
      <Form noValidate ref={formRef}>
        {props.config.rows.map((row, rowIndex) => (
          <FormRow
            fields={row}
            key={rowIndex}
            values={formData}
            handleChange={handleChange}
            picklists={picklists}
            uuid={props.uuid}
            errors={errors}
          />
        ))}
        <div className="mt-3">
          <button type="button"
                  onClick={handleSave}
                  className="btn btn-primary me-2">Save</button>
          <button type="button"
                  title="Abandon edits"
                  className="btn btn-secondary me-2"
                  onClick={props.onCancel}>Cancel</button>
          {!usedBy && !isNew &&
           <ConfirmationButton
             label="Delete"
             title="✋ Confirm Deletion"
             question="Are you sure you want to delete this value?"
             cancelLabel="Cancel"
             actionLabel="Delete"
             description="Delete this value"
             actionHandler={props.onDelete}
             className="btn btn-danger"
           />
          }
        </div>
      </Form>
    </div>
  );
};

export default LookupEditingForm;

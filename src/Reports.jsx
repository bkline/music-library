/**
 * @fileoverview Generate reports for the music library.
 * @author Bob Kline
 * @date 2024-11-20
 */
import React, { useState, useEffect, useRef } from "react";
import { Form, Button, Row, Col } from 'react-bootstrap';
import { Typeahead } from "react-bootstrap-typeahead";
import { toast } from 'react-toastify';
import SortableTypeahead from './SortableTypeahead';
import validateForm from './utils';

const Reports = (props) => {
  const reportConfig = props.config.report;
  const defaults = {};
  reportConfig.fieldsets.forEach(fieldset => {
    fieldset.rows.forEach(row => {
      row.forEach(field => {
        if (field.default) {
          defaults[field.name] = field.default;
        }
        if (field.selected || field.selected === '') {
          defaults[field.name] = field.selected;
        }
        if (field.logic) {
          defaults[`${field.name}-logic`] = field.logic.selected;
        }
      });
    });
  });
  const [picklists, setPicklists] = useState([]);
  const [formData, setFormData] = useState(defaults);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(true);
  const formRef = useRef(null);
  const [columns, setColumns] = useState(reportConfig.columns.defaults)
  const availableColumns = reportConfig.columns.available.map((column) => (
    { id: column, label: column }
  ));


  // Load the picklists for controlled-value fields.
  useEffect(() => {
    const fetchPicklists = async () => {
      const values = {};
      const slugs = [
        'arrangement', 'keyword', 'tag', 'season', 'user', 'owner',
      ];
      const parms = props.debugging ? '?debug=true' : '';
      const promises = slugs.map(async slug => {
        try {
          const response = await fetch(`/library/api/${slug}${parms}`);
          if (!response.ok) {
            throw new Error('Network error');
          }
          const data = await response.json();
          values[slug] = data;
        } catch (error) {
          console.error('Error fetching picklist:', error);
          throw error;
        }
      });
      try {
        await Promise.all(promises);
        setPicklists(values);
      } catch (error) {
        console.error("Error fetching picklists:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchPicklists();
  }, []);
  if (loading) {
    return <div>Loading...</div>;
  }

  const onClear = () => {
    setFormData(defaults);
    setColumns(reportConfig.columns.defaults);
    toast.success('Form values reset to defaults.');
  }

  const onChange = (e) => {
    const { name, value} = e.target;
    setFormData(prevState => ({
      ...prevState,
      [name]: value
    }));
  };

  const columnRequired = 'At least one column must be selected ...';

  const submitRequest = async (e) => {
    e.preventDefault();
    const fields = reportConfig.fieldsets
      .flatMap(fieldset => fieldset.rows)
      .flatMap(field => field);
    if (!validateForm(fields, formData, setErrors, formRef.current, columns)) {
      toast.warn('Validation errors on form.');
      return;
    }
    const request = { user: props.user.account, parms: {} };
    reportConfig.fieldsets.forEach(fieldset => {
      fieldset.rows.forEach(row => {
        row.forEach(field => {
          const value = formData[field.name] ?? null;
          if (field.name === 'report-columns') {
            request.parms[field.name] = columns;
          } else if (value || value === 0 || value === '0') {
            request.parms[field.name] = value;
            if (field.logic) {
              const logicName = `${field.name}-logic`;
              request.parms[logicName] = formData[logicName];
            }
          }
        });
      });
    });
    const parms = props.debugging ? '?debug=true' : '';
    try {
      const response = await fetch(`/library/api/report${parms}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(request),
      });
      if (!response.ok) {
        console.error('Failure posting report request:', response);
        throw new Error('Network error');
      }
      const data = await response.json();
      const requestId = data.request_id;
      if (request.parms['report-format'] === 'excel') {
        const url = `/library/api/report/${requestId}${parms}`;
        try {
          const excelResponse = await fetch(url);
          if (!excelResponse.ok) {
            console.error('Excel report failure:', excelResponse);
            throw new Error('Network error');
          }
          const blob = await excelResponse.blob();
          const fn = excelResponse.headers.get('x-filename') || 'report.xlsx';
          const link = document.createElement('a');
          link.href = window.URL.createObjectURL(blob);
          link.setAttribute('download', fn);
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          toast.success(`Report ${fn} ready.`);
        } catch (error) {
          console.error('failure generating Excel report:', error);
          toast.error('Failure generating Excel report.');
        }
      } else {
        const reportUrl = `/library/report/${requestId}${parms}`;
        setTimeout(() => {
          window.open(reportUrl, '_blank', 'noopener,noreferrer');
        });
      }
    } catch(error) {
      console.error(error);
      toast.error(`Report failure: ${error.message}`);
    }
  };

  return (
    <>
      <h1 className="mb-3">Browse Catalog</h1>
      <p className="mb-4">
        On this page you can create reports showing the contents of the
        music library or any portion of it.
      </p>
      <ul>
        <li>
          To browse through the entire catalog simply press
          the <strong>Report</strong> button below.
        </li>
        <li>
          The generated report will be displayed in a separate tab.
        </li>
        <li>
          To control which records are displayed, you can use the fields
          below to specify the filtering criteria you wish to use.
        </li>
        <li>
          You can also indicate which pieces of information you want
          to be displayed, and in which order, by selecting and arranging
          columns in the <em>Options</em> block.
        </li>
        <li>
          See the <a href="/library/help">Help</a> page for more information.
        </li>
      </ul>
      <Form noValidate ref={formRef} onSubmit={submitRequest}>
        {props.config.report.fieldsets.map((fieldset, fsIndex) => (
          <fieldset key={fsIndex}>
            <legend
              data-bs-toggle="collapse"
              data-bs-target={`#fieldset-${fsIndex}`}
              href={`#fieldset-${fsIndex}`}
              role="button"
              aria-expanded="false"
              aria-controls={`fieldset-${fsIndex}`}
              title={fieldset.description}
            >
              {fieldset.name}
            </legend>
            <div className="collapse" id={`fieldset-${fsIndex}`}>
              {fieldset.rows.map((row, rowIndex) => (
                <Row key={rowIndex}>
                  {row.map(field => (
                    <Col
                      md={row.length === 2 ? 6 : 12}
                      key={field.name}
                      className="mb-3"
                    >
                      <Form.Group as={Col} controlId={field.name}>
                        <Form.Label>{field.label}</Form.Label>
                        {field.logic && (
                          <div className="d-flex align-items-center">
                            {field.logic.buttons.map(button => (
                              <Form.Check
                                key={button.value}
                                type="radio"
                                name={`${field.name}-logic`}
                                id={`${field.name}-logic-${button.value}`}
                                value={button.value}
                                label={button.label}
                                checked={
                                  button.value ===
                                    (formData[`${field.name}-logic`] ?? null)
                                }
                                className="me-4"
                                onChange={onChange}
                              />
                            ))}
                          </div>
                        )}
                        {['text', 'number', 'date'].includes(field.type) && (
                          <>
                            <Form.Control
                              name={field.name}
                              type={field.type}
                              required={field.required ?? false}
                              value={formData[field.name] || ''}
                              onChange={onChange}
                              title={field.description}
                              placeholder={field.placeholder}
                              isInvalid={!!errors[field.name]}
                            />
                            <Form.Control.Feedback type="invalid">
                              {errors[field.name]}
                            </Form.Control.Feedback>
                          </>
                        )}
                        {field.type === 'radios' && (
                          <div className="d-flex align-items-center">
                            {field.buttons.map(button => (
                              <Form.Check
                                key={button.label}
                                type="radio"
                                name={field.name}
                                id={`${field.name}-${button.value}`}
                                value={button.value}
                                label={button.label}
                                checked={
                                  button.value === formData[field.name]
                                }
                                className="me-4"
                                onChange={onChange}
                              />
                            ))}
                          </div>
                        )}
                        {field.name === 'report-columns' && (
                          <>
                            <SortableTypeahead
                              id="report-columns"
                              options={availableColumns}
                              selected={columns}
                              setSelected={setColumns}
                              required
                              placeholder={columnRequired}
                              isInvalid={!!errors[field.name]}
                            />
                            <Form.Control.Feedback type="invalid">
                              {errors[field.name]}
                            </Form.Control.Feedback>
                          </>
                        )}
                        {field.type === 'typeahead' && (
                          <Typeahead
                            id={field.name}
                            inputProps={{ 'testid': field.name }}
                            labelKey="display"
                            clearButton
                            multiple
                            options={picklists[field.name]}
                            selected={picklists[field.name].filter(option =>
                              formData[field.name]?.includes(option.id) || false
                            )}
                            placeholder={field.placeholder}
                            onChange={selected => {
                              onChange({
                                target: {
                                  name: field.name,
                                  value: selected.map(option => option.id),
                                }
                              });
                            }}
                          />
                        )}
                        {field.type === 'select' && (
                          <Form.Select
                            name={field.name}
                            aria-label={field.description}
                            title={field.description}
                            value={formData[field.name] ?? ''}
                            onChange={onChange}
                          >
                            <option value="">
                              {field.required && 'Select an option'}
                              {!field.required && '-- Optional --'}
                            </option>
                            {picklists[field.name].map(option => (
                              <option value={option.id} key={option.id}>
                                {option.display}
                              </option>
                            ))}
                          </Form.Select>
                        )}
                      </Form.Group>
                    </Col>
                  ))}
                </Row>
              ))}
            </div>
          </fieldset>
        ))}
        <div className="mt-3 mb-3">
          <Button type="submit"
                  className="btn btn-primary me-2">Report</Button>
          <Button type="button"
                  title="Abandon edits"
                  className="btn btn-secondary me-2"
                  onClick={onClear}>Reset</Button>
        </div>
      </Form>
    </>
  );
};

export default Reports;

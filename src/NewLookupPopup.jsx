/**
 * @fileoverview Create a new Person or Company record on the fly.
 * @author Bob Kline
 * @date 2024-11-08
 */
import React, { useState, useRef } from 'react';
import { Modal, Button, Form, Row, Col } from 'react-bootstrap';
import { toast } from 'react-toastify';
import validateForm from './utils';

const NewLookupPopup = (props) => {
  const [values, setValues] = useState({});
  const [errors, setErrors] = useState({});
  const table = props.config.lookup_tables[props.name];
  const formRef = useRef(null);

  const handleChange = (e) => {
    const { id, value } = e.target;
    setValues(prevState => ({
      ...prevState,
      [id]: value
    }));
  };

  const handleSave = async () => {
    const fields = table.rows.flatMap(field => field);
    if (!validateForm(fields, values, setErrors, formRef.current)) {
      toast.warn('Validation errors on form.');
    } else {
      try {
        const parms = props.debugging ? '?debug=true' : '';
        const url = `/library/api/${props.name}${parms}`;
        const response = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(values),
        });
        props.setShow(false);
        const data = await response.json();
        if (data.status === 'success') {
          props.handleSave({
            id: data.id,
            display: data.display,
          });
          toast.success(`Successfully saved ${data.display}`);
        }
        else {
          toast.error(data.message);
        }
      } catch (error) {
        console.error("Failure saving", props.name, values, error);
        toast.error(`Failure saving ${props.name}: ${error.message}`);
      }
    }
  };


  return (
    <Modal show={props.show} onHide={() => props.setShow(false)}>
      <Modal.Header closeButton>
        <Modal.Title>{`Create New ${table.display} Record`}</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <Form noValidate ref={formRef}>
          {table.rows.map((row, rowIndex) => (
            <Row className="mb-3" key={rowIndex}>
              {row.map((field, fieldIndex) => (
                <Col md={row.length === 2 ? 6 : 12} key={fieldIndex}>
                  <Form.Group as={Col} controlId={field.name}>
                    <Form.Label className="xxfw-bold">
                      {field.label}
                    </Form.Label>
                    <Form.Control
                      name={field.name}
                      type={field.type === "textarea" ? null : field.type}
                      as={field.type === "textarea" ? "textarea" : "input"}
                      onChange={handleChange}
                      title={field.description}
                      placeholder={field.placeholder}
                      maxLength={field.maxLength || null}
                      required={field.required}
                      isInvalid={!!errors[field.name]}
                    />
                    <Form.Control.Feedback type="invalid">
                      {errors[field.name]}
                    </Form.Control.Feedback>
                  </Form.Group>
                </Col>
              ))}
            </Row>
          ))}
        </Form>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={() => props.setShow(false)}>
          Cancel
        </Button>
        <Button variant="primary" onClick={handleSave}>
          Add Record
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default NewLookupPopup;

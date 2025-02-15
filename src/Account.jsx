/**
 * @fileoverview Menu navigation bar
 * @author Bob Kline
 * @date 2024-11-08
 */
import React, { useRef, useState } from 'react';
import { Form, Row, Col } from 'react-bootstrap';
import { toast } from 'react-toastify';
import validateForm from './utils';

const Account = (props) => {

  const [account, setAccount] = useState(props.record);
  const [errors, setErrors] = useState({});
  const formRef = useRef(null);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    if (type === 'checkbox')
      setAccount(prev => ({ ...prev, [name]: checked }));
    else
      setAccount(prev => ({ ...prev, [name]: value }));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    const fields = props.config.account.flatMap(field => field);
    if (!validateForm(fields, account, setErrors, formRef.current)) {
      toast.warn('Validation errors on form.');
    } else {
      const id = account.account_id;
      const name = account.account_fullname;
      const slug = id ? `/${id}` : '';
      const parms = props.debugging ? '?debug=true' : '';
      const url = `/library/api/account${slug}${parms}`;
      try {
        const response = await fetch(url, {
          method: id ? 'PUT' : 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(account),
        });
        if (!response.ok) {
          throw new Error('Network response was not ok');
        }
        toast.success(`Account for ${name} successfully saved.`);
        props.onSave();
      } catch (error) {
        console.error(error);
        toast.error(`Failure saving account: ${error.message}`);
      }
    }
  };

  const makeTitle = () => {
    if (!props.user.id) {
      return 'Add First Admin Account';
    }
    const id = account.account_id ?? null;
    if (!id)
      return 'Adding New Login Account';
    const fullname = (account.account_fullname ?? '').trim();
    if (fullname)
      return `Editing Account For ${fullname}`;
    const name = (account.account_name ?? '').trim();
    if (name)
      return `Editing Account For ${fullname}`;
    return 'Editing Login Account';
  }

  return (
    <>
      <h1>{makeTitle()}</h1>
      {props.user.id === 0 && (
        <p className="fst-italic">
          You need to create an account with administrative privileges in order
          to use this application and to create other user accounts. If the
          account you create here is not active or not an administrator, you
          will need to edit the account directly in the database
          <code>login_account</code> table.
        </p>
      )}
      <Form noValidate ref={formRef}>
        {props.config.account.map((row, rowIndex) => (
          <Row className="mb-3" key={rowIndex}>
            {row.map((field, fieldIndex) => (
              <Col md={12 / row.length} key={fieldIndex}>
                <Form.Group as={Col} controlId={field.name}>
                  <Form.Label>{field.label}</Form.Label>
                  {field.type === 'text' && (
                    <>
                      <Form.Control
                        name={field.name}
                        type="text"
                        value={account[field.name] || ''}
                        onChange={handleChange}
                        required={field.required}
                        title={field.description}
                        placeholder={field.placeholder}
                        maxLength={field.maxLength}
                        isInvalid={!!errors[field.name]}
                      />
                      {field.required && (
                        <Form.Control.Feedback type="invalid">
                          {errors[field.name]}
                        </Form.Control.Feedback>
                      )}
                    </>
                  )}
                  {field.type === 'radios' && (
                    <div className="d-flex align-items-center">
                      {field.buttons.map((button, bIndex) => (
                        <Form.Check
                          key={bIndex}
                          type="radio"
                          name={field.name}
                          id={`${field.name}-${button.value}`}
                          value={button.value}
                          label={button.label}
                          checked={
                            button.value === account[field.name]
                          }
                          className="me-4"
                          onChange={handleChange}
                        />
                      ))}
                    </div>
                  )}
                  {field.type === 'checkboxes' && (
                    <div className="d-flex align-items-center">
                      {field.buttons.map((button, bIndex) => (
                        <Form.Check
                          type="checkbox"
                          key={bIndex}
                          name={button.name}
                          id={button.name}
                          label={button.label}
                          checked={account[button.name]}
                          onChange={handleChange}
                          className="me-4"
                        />
                      ))}
                    </div>
                  )}
                </Form.Group>
              </Col>
            ))}
          </Row>
        ))}
        <div className="mt-3">
          <button type="button"
                  onClick={handleSave}
                  className="btn btn-primary me-2">Save</button>
          <button type="button"
                  title="Abandon edits"
                  className="btn btn-secondary me-2"
                  onClick={props.onCancel}>Cancel</button>
        </div>
      </Form>
    </>
  );
};

export default Account;

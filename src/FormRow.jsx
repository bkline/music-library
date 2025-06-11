/**
 * @fileoverview Fields aligned on the same row for non-mobile devices.
 * @author Bob Kline
 * @date 2024-11-08
 */
import React from 'react';
import { Form, Row, Col } from 'react-bootstrap';
import { Typeahead } from "react-bootstrap-typeahead";

const FormRow = (props) => {

  // Figure out the currently selected value for a typeahead field.
  const getTypeaheadDefault = (field) => {
    let ids = props.values[field.name];
    if (!ids) return [];
    if (!Array.isArray(ids))
      ids = [ids];
    return props.picklists[field.picklist].filter(o => ids.includes(o.id));
  };

  const textfields = ["text", "number", "date", "tel", "url", "email"];

  return (
    <Row className="mb-3">
      {props.fields.map((field, fieldIndex) => {
        const fieldName = props.fieldset
              ? `${props.fieldset}__${props.instanceIndex}__${field.name}`
              : field.name;
        return (
          <Col md={props.fields.length === 2 ? 6 : 12} key={fieldIndex}>
            <Form.Group as={Col} controlId={fieldName}>
              {field.type !== "checkbox" && (
                <Form.Label>{field.label}</Form.Label>
              )}
              {textfields.includes(field.type) && (
                <>
                  <Form.Control
                    name={fieldName}
                    type={field.type}
                    value={props.values[field.name] || ''}
                    onChange={props.handleChange}
                    required={field.required}
                    title={field.description}
                    placeholder={field.placeholder}
                    maxLength={field.maxLength}
                    isInvalid={!!props.errors[fieldName]}
                  />
                  <Form.Control.Feedback type="invalid">
                    {props.errors[fieldName]}
                  </Form.Control.Feedback>
                </>
              )}
              {field.type === "textarea" && (
                <Form.Control
                  name={fieldName}
                  as="textarea"
                  value={props.values[field.name] || ''}
                  onChange={props.handleChange}
                  title={field.description}
                  placeholder={field.placeholder}
                />
              )}
              {field.type === "select" && (
                <>
                  <Form.Select
                    name={fieldName}
                    aria-label={field.placeholder}
                    defaultValue={props.values[field.name]}
                    onChange={props.handleChange}
                    isInvalid={!!props.errors[fieldName]}
                  >
                    <option value="">
                      {field.required && 'Select an option'}
                      {!field.required && '-- Optional --'}
                    </option>
                    {props.picklists[field.picklist].map(option => (
                      <option value={option.id} key={option.id}>
                        {option.display}
                      </option>
                    ))}
                  </Form.Select>
                  <Form.Control.Feedback type="invalid">
                    {props.errors[fieldName]}
                  </Form.Control.Feedback>
                </>
              )}
              {field.type === "typeahead" && (
                <Typeahead
                  id={fieldName}
                  inputProps={{ 'testid': fieldName }}
                  labelKey="display"
                  clearButton
                  multiple={field.multiple}
                  options={props.picklists[field.picklist]}
                  placeholder={field.placeholder}
                  defaultSelected={getTypeaheadDefault(field)}
                  onChange={selected => {
                    const value = (
                      Array.isArray(selected)
                        ? ['Tags', 'Keywords'].includes(field.name)
                        ? selected.map(v => v.id)
                        : selected.length > 0
                        ? selected[0].id : null : null
                    );
                    const fakeElement = {
                      target: {
                        name: field.name,
                        value,
                      }
                    };
                    props.handleChange(fakeElement);
                  }}
                />
              )}
              {field.type === "checkbox" && (
                <Form.Check
                  type="checkbox"
                  name={fieldName}
                  id={fieldName}
                  label={field.label}
                  checked={props.values[field.name] === "Y"}
                  onChange={props.handleChange}
                />
              )}
            </Form.Group>
          </Col>
        );})}
    </Row>
  )
};

export default FormRow;

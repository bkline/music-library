/**
 * @fileoverview Component for the form used to edit or create a record.
 * @author Bob Kline
 * @date 2024-11-08
 */
import React, { useState, useEffect, useRef } from 'react';
import { Form } from 'react-bootstrap';
import { Trash } from "react-bootstrap-icons";
import { toast } from 'react-toastify';
import FormRow from './FormRow';
import NewLookupPopup from './NewLookupPopup';
import ConfirmationButton from './ConfirmationButton';
import validateForm from './utils';

const EditForm = (props) => {

  // Enable state tracking.
  const [showCompanyModal, setShowCompanyModal] = useState(false);
  const [showPersonModal, setShowPersonModal] = useState(false);
  const [picklists, setPicklists] = useState([]);
  const [formData, setFormData] = useState(props.record);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(true);
  const formRef = useRef(null);

  // Load the picklists for controlled-value fields.
  useEffect(() => {
    const fetchPicklists = async () => {
      const values = {};
      const parms = props.debugging ? '?debug=true' : '';
      const done = [];
      try {
        const promises = props.config.fieldsets.flatMap(fieldset =>
          fieldset.rows.flatMap(row =>
            row.filter(field =>
              field.picklist && !done.includes(field.picklist)
            ).map(async field => {
              done.push(field.picklist);
              const url = `/library/api/${field.picklist}${parms}`;
              try {
                const response = await fetch(url);
                if (!response.ok) {
                  throw new Error(`Network error for ${url}`);
                }
                const data = await response.json();
                values[field.picklist] = data;
              } catch (error) {
                console.error(url, error);
                throw error;
              }
            })
          )
        );
        await Promise.all(promises);
        setPicklists(values);
      } catch (error) {
        console.error("Error fetching picklists:", error);
        toast.error('Unable to load picklists for editing form.');
      } finally {
        setLoading(false);
      }
    };
    fetchPicklists();
  }, []);
  if (loading) {
    return <div>Loading...</div>;
  }

  // Keep track of the form data as the user works.
  const handleChange = (e) => {
    let { value } = e.target;
    const { name } = e.target;
    const parts = name.split("__");
    if (parts.length === 3) {
      const [fieldset, position, fieldname] = parts;
      setFormData(prevState => {
        const newState = {...prevState};
        newState[fieldset][position][fieldname] = value;
        return newState;
      });
    } else {
      if (name === "IsCollection") {
        value = e.target.checked ? "Y" : "N"
      }
      setFormData(prevState => ({
        ...prevState,
        [name]: value
      }));
    }
  };

  // Let the Catalog component's callback handle saving the results.
  const handleSaveItem = () => {
    const fields = [];
    props.config.fieldsets.forEach(fieldset => {
      fieldset.rows.forEach(row => {
        row.forEach(field => {
          const fieldCopy = { ...field };
          if (fieldset.multiple) {
            fieldCopy.fieldset = fieldset.name;
          }
          fields.push(fieldCopy);
        });
      });
    });
    if (!validateForm(fields, formData, setErrors, formRef.current)) {
      toast.warn('Validation errors on form.');
    } else {
      props.onSave(formData);
    }
  };

  // Let the users create new person and company records on the fly.
  const handleSaveNewCompany = (company) => {
    const companies = [...picklists.company];
    companies.push(company);
    companies.sort((a, b) => a.display.localeCompare(b.display));
    setPicklists(prevState => {
      const newState = {...prevState};
      newState.company = companies;
      return newState;
    });
  };
  const handleSaveNewPerson = (person) => {
    const people = [...picklists.person];
    people.push(person);
    people.sort((a, b) => a.display.localeCompare(b.display));
    setPicklists(prevState => {
      const newState = {...prevState};
      newState.person = people;
      return newState;
    });
  };

  // Callback for the button to add a new nested fieldset.
  const addNewInstance = (name) => {
    const newArray = formData[name] ? [...formData[name]] : [];
    newArray.push({ newInstance: true });
    setFormData(prevState => ({
      ...prevState,
      [name]: newArray
    }));
  }

  // Created dynamically determined labels for the nexted instance fieldsets.
  const makeLegendLabel = (fieldset, values) => {
    switch (fieldset.name) {
    case "Performances":
      if (values.PerformanceDate) {
        const year = values.PerformanceDate.substring(0, 4);
        return `${year} Performance`;
      }
      if (!values.LibraryItem)
        return "New Performance";
      return "Undated Performance";
    case "Inventories":
      if (values.InStockDate) {
        const year = values.InStockDate.substring(0, 4);
        return `${year} Inventory`;
      }
      if (!values.LibraryItem)
        return "New Inventory";
      return "Undated Inventory";
    case "Parts":
      if (values.PartName)
        return `Part For ${values.PartName}`;
      if (!values.LibraryItem)
        return "New Part";
      return "Unnamed Part";
    case "Loans":
      if (values.LoanRecipient)
        return `Loan To ${values.LoanRecipient}`;
      if (!values.LibraryItem)
        return "New Loan";
      return "Loan To Anonymous Recipient";
    default:
      return "makeLengendLabel() incomplete";
    }
  }

  // We need to do this ourselves for the nested fieldsets with buttons.
  const toggleFieldsetDisplay = (event, fieldsetBodyID) => {
    if (event.target.closest("button")) {
      event.stopPropagation();
    } else {
      const content = document.getElementById(fieldsetBodyID);
      const isCollapsed = content.classList.contains('show');
      if (isCollapsed) {
        $(content).collapse('hide');
      } else {
        $(content).collapse('show');
      }
    }
  }

  // Delete a nested fieldset if the user confirms the action.
  const takeOutTrash = (event, name, i, onClose) => {
    event.stopPropagation();
    event.preventDefault();
    const newArray = [...formData[name]];
    newArray.splice(i, 1);
    setFormData(prevState => ({
      ...prevState,
      [name]: newArray
    }));
    onClose();
    return false;
  }

  return (
    <>
      <h1 title={props.record.ItemID ? `Record #${props.record.ItemID}` : ''}>
        {props.record.ItemID ? props.record.ItemTitle : 'Adding New Record'}
      </h1>
      <Form noValidate ref={formRef}>
        {props.config.fieldsets.map((fieldset, fsIndex) => (
          <fieldset
            key={fsIndex}
            className={fieldset.multiple ? "multiple-wrapper" : ""}
          >
            <legend
              data-bs-toggle="collapse"
              href={`#fieldset-${fsIndex}`}
              role="button"
              aria-expanded="false"
              aria-controls={`fieldset-${fsIndex}`}>
              {fieldset.name}
            </legend>
            <div className="collapse" id={`fieldset-${fsIndex}`}>
              {fieldset.multiple && formData[fieldset.name] && (
                formData[fieldset.name].map((instance, instanceIndex) => {
                  const nestedId = `nested-${fieldset.name}-${instanceIndex}`;
                  const divClass = instance.newInstance
                        ? "collapse show"
                        : "collapse";
                  return (
                    <fieldset key={`${nestedId}-wrapper`}>
                      <legend
                        onClick={(e) => toggleFieldsetDisplay(e, nestedId)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            toggleFieldsetDisplay(e, nestedId);
                          }
                        }}
                        href={`#${nestedId}`}
                        role="button"
                        aria-expanded="false"
                        aria-controls={nestedId}>
                        {makeLegendLabel(fieldset, instance)}
                        <ConfirmationButton
                          label={<Trash style={{ cursor: 'pointer' }} />}
                          title="✋ Confirm Deletion"
                          question="Are you sure you want to delete this block?"
                          cancelLabel="Cancel"
                          actionLabel="Delete"
                          description="Delete this block"
                          actionHandler={(event, onClose) => takeOutTrash(
                            event,
                            fieldset.name,
                            instanceIndex,
                            onClose
                          )}
                          className="trash-button btn btn-link text-danger"
                        />
                      </legend>
                      <div className={divClass} id={nestedId}>
                        {fieldset.rows.map((row, rowIndex) => (
                          <FormRow
                            fields={row}
                            key={rowIndex}
                            values={instance}
                            handleChange={handleChange}
                            fieldset={fieldset.name}
                            instanceIndex={instanceIndex}
                            errors={errors}
                          />
                        ))}
                      </div>
                    </fieldset>
                  );
                })
              )}
              {fieldset.multiple && (
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={() => addNewInstance(fieldset.name)}
                >
                  {`Add ${fieldset.singular}`}
                </button>
              )}
              {!fieldset.multiple && fieldset.rows.map((row, rowIndex) => (
                <FormRow
                  fields={row}
                  key={rowIndex}
                  values={formData}
                  handleChange={handleChange}
                  picklists={picklists}
                  errors={errors}
                />
              ))}
            </div>
          </fieldset>
        ))}

        <div className="mt-3 mb-3">
          <button type="button"
                  onClick={handleSaveItem}
                  className="btn btn-primary me-2 mt-2">Save</button>
          <button type="button"
                  onClick={() => {setShowPersonModal(true)}}
                  title="Add a new person record if not found on picklist"
                  className="btn btn-success me-2 mt-2">Add Person</button>
          <button type="button"
                  onClick={() => {setShowCompanyModal(true)}}
                  title="Add a new company record if not found on picklist"
                  className="btn btn-success me-2 mt-2">Add Company</button>
          <button type="button"
                  title="Return to the search page, abandoning edits"
                  className="btn btn-secondary mt-2"
                  onClick={props.onCancel}>Cancel</button>
        </div>
      </Form>
      <NewLookupPopup
        name="company"
        show={showCompanyModal}
        setShow={setShowCompanyModal}
        handleSave={handleSaveNewCompany}
        config={props.config}
        debugging={props.debugging}
      />
      <NewLookupPopup
        name="person"
        show={showPersonModal}
        setShow={setShowPersonModal}
        handleSave={handleSaveNewPerson}
        config={props.config}
        debugging={props.debugging}
      />
    </>
  );
};

export default EditForm;

/**
 * @fileoverview Common utility functions.
 * @author Bob Kline
 * @date 2024-12-06
 */

const validatePhoneNumber = (phone) => {
  if (!phone)
    return true;
  const re = /^[+]?[(]?[0-9]{1,4}[)]?[-\s./0-9]*$/;
  return re.test(String(phone).toLowerCase());
};

const validateURL = (url) => {
  if (!url)
    return true;
  const re = /^(https?:\/\/)?([\da-z.-]+)\.([a-z.]{2,6})([/\w .-]*)*\/?$/;
  return re.test(String(url).toLowerCase());
};

const validateEmail = (email) => {
  if (!email)
    return true;
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(String(email).toLowerCase());
};

const valueEmpty = (value) => {
  if (value === undefined || value === null)
    return true;
  if (typeof value === 'string' && !value.trim())
    return true;
  return false;
};

const validateField = (field, value) => {
  if (field.required && valueEmpty(value))
    return `${field.label} is required.`;
  if (field.type === 'email' && !validateEmail(value))
    return 'Not a valid email address.';
  if (field.type === 'url' && !validateURL(value))
    return 'Not a valid URL.';
  if (field.type === 'tel' && !validatePhoneNumber(value))
    return 'Not a valid phone number.';
  return null;
};

/**
 * Validate the fields on the form.
 *
 * Pass:
 *   fields - field definitions, used to determine how to validate each field
 *   values - dictionary of values in the form's fields
 *   setErrors - used to record validation errors we find
 *   form - DOM object for the form so we can control the UI
 *   cols - columns selected for a report (custom field, custom validation)
 */
const validateForm = (fields, values, setErrors, form, cols = null) => {
  const validationErrors = {};
  fields.forEach(field => {
    if (field.fieldset) {
      const { fieldset } = field;
      const instances = values[fieldset] ?? [];
      instances.forEach((instance, instanceIndex) => {
        const value = instance[field.name] ?? '';
        const error = validateField(field, value);
        if (error) {
          const fieldName = `${fieldset}__${instanceIndex}__${field.name}`;
          validationErrors[fieldName] = error;
        }
      });
    } else if (field.name === 'report-columns') {
      if (cols.length < 1)
        validationErrors[field.name] = 'At least one column must be selected.';
    } else {
      const value = values[field.name] ?? '';
      if (field.required && valueEmpty(value))
        validationErrors[field.name] = `${field.label} is required.`;
      else if (field.type === 'email' && !validateEmail(value))
        validationErrors[field.name] = 'Not a valid email address.';
      else if (field.type === 'url' && !validateURL(value))
        validationErrors[field.name] = 'Not a valid URL.';
      else if (field.type === 'tel' && !validatePhoneNumber(value))
        validationErrors[field.name] = 'Not a valid phone number.';
    }
  });
  const invalidFields = Object.keys(validationErrors);
  if (invalidFields.length > 0) {
    setErrors(validationErrors);
    if (form) {
      const fieldsets = [];
      const queued = new Set();
      invalidFields.forEach((name, i) => {
        const selector = `[name="${name}"], [for="${name}"]`;
        const fieldElement = form.querySelector(selector);
        if (fieldElement) {
          if (i === 0) {
            fieldElement.focus();
          }
          let parent = fieldElement.parentElement;
          while (parent) {
            const fieldset = parent.closest('fieldset');
            if (fieldset) {
              const legend = fieldset.querySelector('legend');
              const wrapper = fieldset.querySelector('div');
              if (legend && wrapper) {
                if (!queued.has(wrapper.id)) {
                  queued.add(wrapper.id);
                  if (!wrapper.classList.contains('show')) {
                    fieldsets.push({legend, wrapper});
                  }
                }
              }
              else {
                console.error("can't find legend or wrapper for", name);
              }
              parent = fieldset.parentElement;
            }
            else {
              parent = null;
            }
          }
        } else {
          console.error(selector, 'failed');
        }
      });
      fieldsets.reverse();
      fieldsets.forEach(fieldset => {
        fieldset.legend.click();
        fieldset.wrapper.classList.add('show');
      });
    }
    return false;
  }
  setErrors({});
  return true;
};

export default validateForm;

/**
 * @fileoverview Component for the form used to filter the records.
 * @author Bob Kline
 * @date 2024-11-08
 */
import React, { useEffect, useState, useRef } from 'react';
import { toast } from 'react-toastify';

const SearchForm = (props) => {

  // Keep track of the current field values.
  const [filters, setFilters] = useState({
    title: '',
    composer_arranger: '',
  });

  // Utility function to detect mobile devices
  const isMobileDevice = () => /Mobi|Android/i.test(navigator.userAgent);

  // Used to set the focus of the form's first field.
  const titleInputRef = useRef(null);

  // Keep the filtering values in sync.
  useEffect(() => {
    if (props.filters) {
      setFilters(props.filters);
    }
    if (titleInputRef.current && !isMobileDevice()) {
      titleInputRef.current.focus();
    }
  }, [props.filters]);

  // Update our state every time a field's value changes.
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFilters(prevState => ({
      ...prevState,
      [name]: value
    }));
  };

  // Update the top-level state for the application.
  const handleSubmit = (e) => {
    e.preventDefault();
    const hasFilter = Object.values(filters).some(value => {
      return typeof value === 'string' && value.trim().length >= 3;
    });
    if (hasFilter) {
      props.setFilters(filters);
    }
    else {
      toast.warn('Search value too short.');
    }
  };

  // Todo: consider using separate Field components.
  return (
    <>
      <h1>Edit</h1>
      <p>
        Search for an existing record to edit, or
        click <strong>Create</strong> to add a new one
        (after first doing a search to make sure you're not
        creating a duplicate record).
      </p>
      <form onSubmit={handleSubmit}>
        <div className="row">
          <div className="col-md-6">
            <div className="mb-3">
              <label htmlFor="title"
                     className="form-label">Title</label>
              <input type="text"
                     title="Enter any portion of the work's title"
                     className="form-control"
                     id="title"
                     name="title"
                     value={filters.title || ''}
                     onChange={handleChange}
                     ref={titleInputRef} />
            </div>
          </div>
          <div className="col-md-6">
            <div className="mb-3">
              <label htmlFor="composer_arranger"
                     className="form-label">Composer Or Arranger</label>
              <input type="text"
                     className="form-control"
                     id="composer_arranger"
                     name="composer_arranger"
                     value={filters.composer_arranger || ''}
                     onChange={handleChange} />
            </div>
          </div>
        </div>
        <div className="d-flex justify-content-start mt-3">
          <button type="submit"
                  className="btn btn-primary">Search</button>
          <button type="button"
                  className="btn btn-success ms-2"
                  onClick={props.onAddNew}>Create</button>
        </div>
      </form>
    </>
  );
};

export default SearchForm;

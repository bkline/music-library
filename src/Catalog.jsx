/**
 * @fileoverview Manage searching/editing music catalog records.
 * @author Bob Kline
 * @date 2024-11-08
 */
import React, { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import EditForm from './EditForm';
import SearchForm from './SearchForm';
import ResultsDisplay from './ResultsDisplay';

const Catalog = (props) => {

  // States, etc.
  const [filters, setFilters] = useState({});
  const [page, setPage] = useState(1);
  const [records, setRecords] = useState([]);
  const [totalRecords, setTotalRecords] = useState([]);
  const [editingRecord, setEditingRecord] = useState(false);
  const [editRecord, setEditRecord] = useState(null);
  const pageSize = 10;

  // Fetch the row data for the current page.
  const fetchRecords = async () => {
    const hasFilter = Object.values(filters).some(value => {
      return typeof value === 'string' && value.trim().length >= 3;
    });
    if (hasFilter) {
      const params = new URLSearchParams();
      Object.keys(filters).forEach(key => {
        const value = (filters[key] ?? '').trim();
        params.set(key, value);
      });
      params.set('limit', pageSize);
      if (page > 1) {
        params.set('offset', pageSize * (page - 1));
      }
      if (props.debugging) {
        params.set('debug', 'true');
      }
      const url = `/library/api/music?${params.toString()}`;
      const response = await fetch(url);
      const responseValues = await response.json();
      setRecords(responseValues.results);
      setTotalRecords(responseValues.total);
      if (!responseValues.total)
        toast.warn('No matching records found.');
    }
  };

  // Save a new or changed record.
  const handleSave = async (record) => {
    const method = record.ItemID ? 'PUT' : 'POST';
    const slug = record.ItemID ? `/${record.ItemID}` : '';
    const debugging = props.debugging ? '?debug=true' : '';
    const uri = `/library/api/music${slug}${debugging}`;
    let success = false;;
    try {
      const response = await fetch(uri, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(record),
      });
      const responseValues = await response.json();
      success = responseValues.status === 'success';
      if (!success)
        toast.error('Failure saving record.');
      else {
        toast.success(`Successfully saved ${record.ItemTitle}.`);
        setEditingRecord(false);
        setEditRecord(null);
      }
    } catch (error) {
      console.error('Error:', error);
      toast.error(`Failure saving record: ${error}`);
    }
    if (success)
      await fetchRecords();
  };

  // Callback for the Create button.
  const handleAddNew = () => {
    setEditRecord({});
    setEditingRecord(true);
  };

  // Callback for a record's Edit button.
  const handleEdit = async (record) => {
    const debugging = props.debugging ? '?debug=true' : '';
    const response = await fetch(`/library/api/music/${record.id}${debugging}`);
    const values = await response.json();
    setEditRecord(values);
    setEditingRecord(true);
  };

  // Callback for a record's Delete button.
  const handleDelete = async (record) => {
    const debug = props.debugging ? '?debug=true' : '';
    const response = await fetch(`/library/api/music/${record.id}${debug}`, {
      method: 'DELETE'
    });
    const data = await response.json();
    if (data.status === 'success') {
      const newTotalRecords = totalRecords - 1;
      const totalPages = Math.ceil((newTotalRecords) / pageSize);
      if (page > totalPages) {
        setPage(totalPages);
      }
      else {
        await fetchRecords();
      }
      toast.success(`Successfully deleted ${record.ItemTitle}.`);
    } else {
      toast.error(`Failure trying to delete ${record.ItemTitle}.`);
    }
  };

  // Callback for the editing form's Cancel button.
  const handleCancel = () => {
    setEditRecord(null);
    setEditingRecord(false);
  };

  // Refresh the page data when appropriate.
  useEffect(() => {
    fetchRecords();
  }, [page, filters]);

  // Show the catalog search form (and results) or the editing form.
  if (editingRecord) {
    return (
      <EditForm
        config={props.config}
        record={editRecord}
        onSave={handleSave}
        onCancel={handleCancel}
      />
    );
  }

  return (
    <>
      <SearchForm
        filters={filters}
        setFilters={setFilters}
        onAddNew={handleAddNew}
        user={props.user}
      />
      {records.length > 0 && (
        <ResultsDisplay
          records={records}
          onEdit={handleEdit}
          onDelete={handleDelete}
          pages={Math.ceil(totalRecords / pageSize)}
          page={page}
          setPage={setPage}
          user={props.user}
        />
      )}
    </>
  );
};

export default Catalog;

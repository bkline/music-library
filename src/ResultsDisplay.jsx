/**
 * @fileoverview Component for the display of the page's records.
 * @author Bob Kline
 * @date 2024-11-08
 */
import React from 'react';
import { Pagination } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPrint, faEdit, faTrash } from '@fortawesome/free-solid-svg-icons';
import ConfirmationButton from './ConfirmationButton';

const ResultsDisplay = (props) => {

  // Callbacks for navigation.
  const paginate = async (pageNumber) => { props.setPage(pageNumber); };
  const handleFirstPage = () => paginate(1);
  const handleLastPage = () => paginate(props.pages);
  const handleNextPage = () => paginate(Math.min(props.page + 1, props.pages));
  const handlePrevPage = () => paginate(Math.max(props.page - 1, 1));

  // Support navigation directly to pages by number.
  const generatePageItems = () => {
    const items = [];
    const maxVisiblePages = 5;
    if (props.pages <= maxVisiblePages) {
      for (let number = 1; number <= props.pages; number++) {
        items.push(
          <Pagination.Item
            key={number}
            active={number === props.page}
            onClick={() => paginate(number)}
          >
            {number}
          </Pagination.Item>
        );
      }
    } else {
      let startPage;
      let endPage;
      if (props.page <= 3) {
        startPage = 1;
        endPage = maxVisiblePages;
      } else if (props.page + 2 >= props.pages) {
        startPage = props.pages - maxVisiblePages + 1;
        endPage = props.pages;
      } else {
        startPage = props.page - 2;
        endPage = props.page + 2;
      }
      for (let number = startPage; number <= endPage; number++) {
        items.push(
          <Pagination.Item
            key={number}
            active={number === props.page}
            onClick={() => paginate(number)}
          >
            {number}
          </Pagination.Item>
        );
      }
      if (startPage > 1) {
        items.unshift(<Pagination.Ellipsis key="start-ellipsis" />);
        items.unshift(
          <Pagination.Item key={1} onClick={() => paginate(1)}>
            1
          </Pagination.Item>
        );
      }
      if (endPage < props.pages) {
        items.push(<Pagination.Ellipsis key="end-ellipsis" />);
        items.push(
          <Pagination.Item key={props.pages}
                           onClick={() => paginate(props.pages)}>
            {props.pages}
          </Pagination.Item>
        );
      }
    }
    return items;
  };

  // Return name in last_name, first_name (dates) format.
  const formatName = (record, prefix) => {
    const lastName = (record[`${prefix}LastName`] || '').trim();
    const firstName = (record[`${prefix}FirstName`] || '').trim();
    const dates = (record[`${prefix}Dates`] || '').trim();
    let name = lastName;
    if (firstName) {
      name += `, ${firstName}`;
    }
    if (dates) {
      name += ` (${dates})`;
    }
    return name;
  }

  // Create the table cell for the title, possibly with alt title.
  const createTitleCell = (record) => {
    let title = record.ItemTitle.trim();
    let collection = '';
    if (!title) {
      title = '[No Title]';
    }
    if (record.IsCollection === 'Y') {
      collection = ' (collection)';
    }
    if (record.OtherTitle) {
      let otherTitle = record.OtherTitle.trim();
      if (otherTitle) {
        otherTitle = `a.k.a. ${otherTitle}`;
        return <td title={otherTitle}>{title}</td>;
      }
    }
    return <td>{title}{collection}</td>;
  }

  const handlePrint = (record) => {
    const parms = props.debugging ? '?debug=true' : '';
    const url = `/library/${record.id}${parms}`;
    setTimeout(() => {
      window.open(url, '_blank', 'noopener,noreferrer');
    });
  };
  // Create the table cell for the composer, possibly with arranger.
  const createComposerCell = (record) => {
    const composer = formatName(record, 'Composer');
    const arranger = formatName(record, 'Arranger');
    if (arranger) {
      if (!composer) {
        return <td>{`arr. ${arranger}`}</td>
      }
      return <td title={`arr. ${arranger}`}>{composer}</td>
    }
    return <td>{composer || '[No composer or arranger recorded]'}</td>;
  }

  const makeDeleteClasses = (record) => {
    if (record.used_by > 0)
      return "btn btn-link text-danger invisible";
    return "btn btn-link text-danger";
  }

  return (
    <div className="container mt-4">
      {props.records.length === 0 ? (
        <p>No records found.</p>
      ) : (
        <table className="table table-striped">
          <thead>
            <tr>
              <th>Title</th>
              <th>Composer Or Arranger</th>
            </tr>
          </thead>
          <tbody>
            {props.records.map(record => (
              <tr className="search-results" key={record.id}>
                {createTitleCell(record)}
                {createComposerCell(record)}
                <td className="actions">
                  <>
                    <button className="btn btn-link me-1"
                            type="button"
                            title="Display printable version of item"
                            onClick={() => handlePrint(record)}>
                      <FontAwesomeIcon icon={faPrint} />
                    </button>
                    <button className="btn btn-link me-1"
                            type="button"
                            title="Edit item"
                            onClick={() => props.onEdit(record)}>
                      <FontAwesomeIcon icon={faEdit} />
                    </button>
                    <ConfirmationButton
                      label={<FontAwesomeIcon icon={faTrash} />}
                      title="✋ Confirm Deletion"
                      description="Delete this item"
                      actionHandler={() => props.onDelete(record)}
                      className={makeDeleteClasses(record)}
                    />
                  </>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      {props.pages > 1 && (
      <Pagination className="mt-4">
        <Pagination.First onClick={handleFirstPage}
                          disabled={props.page === 1} />
        <Pagination.Prev onClick={handlePrevPage}
                         disabled={props.page === 1} />
        {generatePageItems()}
        <Pagination.Next onClick={handleNextPage}
                         disabled={props.page === props.pages} />
        <Pagination.Last onClick={handleLastPage}
                         disabled={props.page === props.pages} />
      </Pagination>
      )}
    </div>
  );
};

export default ResultsDisplay;

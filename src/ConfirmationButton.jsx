/**
 * @fileoverview Button with modal dialog to confirm destructive action.
 * @author Bob Kline
 * @date 2024-12-08
 */
import React, { useState } from 'react';
import { Modal, Button } from 'react-bootstrap';

const ConfirmationButton = (props) => {
  const [showModal, setShowModal] = useState(false);
  const defaultQuestion = 'Are you sure you want to delete this record?';

  const handleAction = (event) => {
    props.actionHandler(event, () => setShowModal(false));
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setShowModal(true)}
        title={props.description}
        className={props.className}
      >
        {props.label ?? 'Delete'}
      </button>

      <Modal show={showModal} onHide={() => setShowModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>{props.title ?? 'Confirmation'}</Modal.Title>
        </Modal.Header>
        <Modal.Body>{props.question ?? defaultQuestion}</Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowModal(false)}>
            {props.cancelLabel ?? 'Cancel'}
          </Button>
          <Button variant="danger" onClick={handleAction}>
            {props.actionLabel ?? 'Delete'}
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  );
};

export default ConfirmationButton;

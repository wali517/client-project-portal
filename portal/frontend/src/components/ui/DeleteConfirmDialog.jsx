import { useState } from 'react';
import Modal from './Modal.jsx';
import Input from './Input.jsx';
import Button from './Button.jsx';

/**
 * Shared "type to confirm" pattern for any permanent-delete action. The
 * confirm button only becomes active once the typed text matches exactly,
 * so a stray click can't destroy something irreversible.
 */
const DeleteConfirmDialog = ({
  isOpen,
  onClose,
  onConfirm,
  isLoading = false,
  title,
  description,
  confirmWith,
  confirmLabel = 'Delete permanently',
}) => {
  const [text, setText] = useState('');
  const matches = text.trim().toLowerCase() === String(confirmWith).toLowerCase();

  const close = () => {
    setText('');
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={close}
      title={title}
      description={description}
      size="sm"
      footer={
        <>
          <Button variant="secondary" onClick={close} disabled={isLoading}>
            Cancel
          </Button>
          <Button variant="danger" onClick={onConfirm} isLoading={isLoading} disabled={!matches}>
            {confirmLabel}
          </Button>
        </>
      }
    >
      <Input
        label={`Type "${confirmWith}" to confirm`}
        value={text}
        onChange={(event) => setText(event.target.value)}
        autoComplete="off"
      />
    </Modal>
  );
};

export default DeleteConfirmDialog;

import { useEffect, useState } from 'react';
import Modal from '../ui/Modal.jsx';
import Button from '../ui/Button.jsx';
import Spinner from '../ui/Spinner.jsx';
import { Download, ExternalLink } from 'lucide-react';
import { downloadFile, getInlineBlobUrl } from '../../api/fileApi.js';
import { formatFileSize } from '../../utils/format.js';
import toast from 'react-hot-toast';
import { getErrorMessage } from '../../utils/errors.js';

const FilePreviewModal = ({ isOpen, onClose, file }) => {
  const [blobUrl, setBlobUrl] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!isOpen || !file) {
      setBlobUrl((prev) => {
        if (prev) window.URL.revokeObjectURL(prev);
        return null;
      });
      setError(null);
      return;
    }

    let active = true;
    setIsLoading(true);
    setError(null);

    getInlineBlobUrl(file)
      .then((url) => {
        if (active) {
          setBlobUrl((prev) => {
            if (prev) window.URL.revokeObjectURL(prev);
            return url;
          });
          setIsLoading(false);
        } else {
          window.URL.revokeObjectURL(url);
        }
      })
      .catch((err) => {
        if (active) {
          setError(getErrorMessage(err, 'Failed to load file preview'));
          setIsLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, [isOpen, file]);

  if (!file) return null;

  const isImage = file.mimeType?.startsWith('image/');
  const isPdf = file.mimeType === 'application/pdf';

  const handleDownload = async () => {
    try {
      await downloadFile(file);
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={file.originalName}
      description={`${formatFileSize(file.size)} · ${file.mimeType}`}
      size="xl"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Close
          </Button>
          <Button icon={Download} onClick={handleDownload}>
            Download
          </Button>
        </>
      }
    >
      <div className="flex min-h-[300px] max-h-[70vh] items-center justify-center overflow-auto rounded-xl bg-ink-50 p-2">
        {isLoading && (
          <div className="py-12 text-center">
            <Spinner className="mx-auto h-8 w-8 text-brand-600" />
            <p className="mt-2 text-sm text-ink-500">Loading preview…</p>
          </div>
        )}

        {error && (
          <div className="py-8 text-center text-rose-600">
            <p className="text-sm font-medium">{error}</p>
          </div>
        )}

        {!isLoading && !error && blobUrl && (
          <>
            {isImage && (
              <img
                src={blobUrl}
                alt={file.originalName}
                className="max-h-[65vh] w-auto max-w-full rounded-lg object-contain shadow-sm"
              />
            )}

            {isPdf && (
              <iframe
                src={blobUrl}
                title={file.originalName}
                className="h-[65vh] w-full rounded-lg border border-ink-200 bg-white"
              />
            )}

            {!isImage && !isPdf && (
              <div className="py-12 text-center text-ink-600">
                <p className="text-sm font-medium">Preview not available for this file type.</p>
                <p className="mt-1 text-xs text-ink-500">Use the download button below to view this file.</p>
              </div>
            )}
          </>
        )}
      </div>
    </Modal>
  );
};

export default FilePreviewModal;

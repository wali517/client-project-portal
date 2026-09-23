import { useState } from 'react';
import toast from 'react-hot-toast';
import { Download, Trash2, FileText, Image as ImageIcon, FileArchive, Eye } from 'lucide-react';
import Badge from '../ui/Badge.jsx';
import Button from '../ui/Button.jsx';
import ConfirmDialog from '../ui/ConfirmDialog.jsx';
import FilePreviewModal from './FilePreviewModal.jsx';
import { downloadFile, deleteFile } from '../../api/fileApi.js';
import { formatDateTime, formatFileSize } from '../../utils/format.js';
import { FILE_CATEGORY_LABELS } from '../../constants/index.js';
import { getErrorMessage } from '../../utils/errors.js';

const iconFor = (mimeType = '') => {
  if (mimeType.startsWith('image/')) return ImageIcon;
  if (mimeType.includes('zip') || mimeType.includes('rar')) return FileArchive;
  return FileText;
};

const FileItem = ({ file, canDelete = false, onDeleted }) => {
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [isWorking, setIsWorking] = useState(false);
  const Icon = iconFor(file.mimeType);

  const canPreview = file.mimeType?.startsWith('image/') || file.mimeType === 'application/pdf';

  const handleDownload = async () => {
    try {
      await downloadFile(file);
    } catch (error) {
      toast.error(getErrorMessage(error, 'That file could not be downloaded.'));
    }
  };

  const handleDelete = async () => {
    setIsWorking(true);
    try {
      await deleteFile(file._id);
      toast.success('File deleted');
      setIsConfirmOpen(false);
      onDeleted?.(file);
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setIsWorking(false);
    }
  };

  return (
    <>
      <li className="flex flex-col gap-3 border-b border-ink-50 py-3 last:border-0 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 items-start gap-3">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-ink-50 text-ink-500">
            <Icon className="h-4 w-4" aria-hidden="true" />
          </span>
          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-ink-900">{file.originalName}</p>
            <p className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-ink-500">
              <span className="tabular">{formatFileSize(file.size)}</span>
              <span>·</span>
              <span>{file.uploadedBy?.name || 'Unknown'}</span>
              <span>·</span>
              <span>{formatDateTime(file.createdAt)}</span>
              {file.version > 1 && <Badge tone="info">v{file.version}</Badge>}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:shrink-0">
          <Badge tone={file.category === 'DELIVERABLE' ? 'success' : 'neutral'}>
            {FILE_CATEGORY_LABELS[file.category] || 'File'}
          </Badge>
          {canPreview && (
            <Button size="sm" variant="secondary" icon={Eye} onClick={() => setIsPreviewOpen(true)}>
              View
            </Button>
          )}
          <Button size="sm" variant="secondary" icon={Download} onClick={handleDownload}>
            <span className="hidden sm:inline">Download</span>
          </Button>
          {canDelete && (
            <Button
              size="sm"
              variant="ghost"
              icon={Trash2}
              onClick={() => setIsConfirmOpen(true)}
              aria-label={`Delete ${file.originalName}`}
            />
          )}
        </div>
      </li>

      <FilePreviewModal
        isOpen={isPreviewOpen}
        onClose={() => setIsPreviewOpen(false)}
        file={file}
      />

      <ConfirmDialog
        isOpen={isConfirmOpen}
        onClose={() => setIsConfirmOpen(false)}
        onConfirm={handleDelete}
        isLoading={isWorking}
        title="Delete this file?"
        description={`${file.originalName} will be removed from the project.`}
        confirmLabel="Delete file"
      />
    </>
  );
};

export default FileItem;

import { useRef, useState } from 'react';
import toast from 'react-hot-toast';
import { UploadCloud, X } from 'lucide-react';
import Button from '../ui/Button.jsx';
import { uploadFiles } from '../../api/fileApi.js';
import { formatFileSize } from '../../utils/format.js';
import { getErrorMessage } from '../../utils/errors.js';
import cn from '../../utils/cn.js';

const MAX_SIZE_MB = 15;

const FileUploader = ({ requestId, projectId, category, onUploaded, label = 'Add files' }) => {
  const inputRef = useRef(null);
  const [selected, setSelected] = useState([]);
  const [isDragging, setIsDragging] = useState(false);
  const [progress, setProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);

  const addFiles = (fileList) => {
    const incoming = Array.from(fileList || []);
    const tooBig = incoming.filter((file) => file.size > MAX_SIZE_MB * 1024 * 1024);
    if (tooBig.length) toast.error(`Each file must be ${MAX_SIZE_MB}MB or smaller.`);
    setSelected((current) => [...current, ...incoming.filter((file) => file.size <= MAX_SIZE_MB * 1024 * 1024)]);
  };

  const removeAt = (index) => setSelected((current) => current.filter((_, i) => i !== index));

  const upload = async () => {
    if (!selected.length) return;
    setIsUploading(true);
    setProgress(0);
    try {
      const response = await uploadFiles({
        files: selected,
        requestId,
        projectId,
        category,
        onProgress: setProgress,
      });
      toast.success(selected.length > 1 ? 'Files uploaded' : 'File uploaded');
      setSelected([]);
      onUploaded?.(response.data);
    } catch (error) {
      toast.error(getErrorMessage(error, 'That upload did not go through.'));
    } finally {
      setIsUploading(false);
      setProgress(0);
    }
  };

  return (
    <div className="space-y-3">
      <div
        onDragOver={(event) => {
          event.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={(event) => {
          event.preventDefault();
          setIsDragging(false);
          addFiles(event.dataTransfer.files);
        }}
        className={cn(
          'rounded-xl border-2 border-dashed px-4 py-6 text-center transition-colors',
          isDragging ? 'border-brand-400 bg-brand-50' : 'border-ink-200 bg-ink-50/50'
        )}
      >
        <UploadCloud className="mx-auto h-6 w-6 text-ink-400" aria-hidden="true" />
        <p className="mt-2 text-sm text-ink-600">
          <span className="hidden sm:inline">Drop files here, or </span>
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="font-medium text-brand-600 underline-offset-2 hover:underline"
          >
            choose files
          </button>
        </p>
        <p className="mt-1 text-xs text-ink-500">PDF, images, Office documents and archives up to {MAX_SIZE_MB}MB</p>
        <input
          ref={inputRef}
          type="file"
          multiple
          className="sr-only"
          onChange={(event) => {
            addFiles(event.target.files);
            event.target.value = '';
          }}
          aria-label={label}
        />
      </div>

      {selected.length > 0 && (
        <ul className="space-y-2">
          {selected.map((file, index) => (
            <li
              key={`${file.name}-${index}`}
              className="flex items-center justify-between gap-3 rounded-lg border border-ink-100 px-3 py-2"
            >
              <span className="min-w-0 truncate text-sm text-ink-700">{file.name}</span>
              <span className="flex shrink-0 items-center gap-2">
                <span className="tabular text-xs text-ink-500">{formatFileSize(file.size)}</span>
                <button
                  type="button"
                  onClick={() => removeAt(index)}
                  className="rounded p-1 text-ink-500 hover:bg-ink-100"
                  aria-label={`Remove ${file.name}`}
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </span>
            </li>
          ))}
        </ul>
      )}

      {isUploading && (
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-ink-100">
          <div className="h-full bg-brand-600 transition-[width]" style={{ width: `${progress}%` }} />
        </div>
      )}

      {selected.length > 0 && (
        <Button onClick={upload} isLoading={isUploading} icon={UploadCloud}>
          Upload {selected.length} {selected.length === 1 ? 'file' : 'files'}
        </Button>
      )}
    </div>
  );
};

export default FileUploader;

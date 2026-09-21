import { FolderOpen } from 'lucide-react';
import FileItem from './FileItem.jsx';
import EmptyState from '../ui/EmptyState.jsx';

const FileList = ({ files = [], currentUser, onChanged, emptyDescription = 'Files added to this record appear here.' }) => {
  if (!files.length) {
    return <EmptyState icon={FolderOpen} title="No files yet" description={emptyDescription} />;
  }

  const canDelete = (file) =>
    currentUser?.role === 'ADMIN' || file.uploadedBy?._id === currentUser?._id || file.uploadedBy === currentUser?._id;

  return (
    <ul className="divide-y divide-ink-50">
      {files.map((file) => (
        <FileItem key={file._id} file={file} canDelete={canDelete(file)} onDeleted={onChanged} />
      ))}
    </ul>
  );
};

export default FileList;

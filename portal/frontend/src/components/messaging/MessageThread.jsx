import { useCallback, useState } from 'react';
import toast from 'react-hot-toast';
import MessageList from './MessageList.jsx';
import MessageInput from './MessageInput.jsx';
import DataState from '../ui/DataState.jsx';
import useFetch from '../../hooks/useFetch.js';
import useAuth from '../../hooks/useAuth.js';
import { getErrorMessage } from '../../utils/errors.js';

/**
 * Works for both project and request conversations: the caller passes the
 * matching list/send functions from the API layer.
 */
const MessageThread = ({ fetchMessages, sendMessage }) => {
  const { user } = useAuth();
  const [isSending, setIsSending] = useState(false);
  const { data, isLoading, error, refetch, setData } = useFetch(fetchMessages, [fetchMessages]);

  const messages = data?.data || [];

  const send = useCallback(
    async (text) => {
      setIsSending(true);
      try {
        const response = await sendMessage({ message: text });
        setData((current) => ({ ...(current || {}), data: [...(current?.data || []), response.data] }));
        return true;
      } catch (err) {
        toast.error(getErrorMessage(err));
        return false;
      } finally {
        setIsSending(false);
      }
    },
    [sendMessage, setData]
  );

  return (
    <div className="space-y-4">
      <DataState isLoading={isLoading} error={error} onRetry={refetch} loadingLabel="Loading messages…">
        <MessageList messages={messages} currentUserId={user?._id} />
      </DataState>
      <MessageInput onSend={send} isSending={isSending} />
    </div>
  );
};

export default MessageThread;

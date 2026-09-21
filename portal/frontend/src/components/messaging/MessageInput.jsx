import { useState } from 'react';
import { Send } from 'lucide-react';
import Textarea from '../ui/Textarea.jsx';
import Button from '../ui/Button.jsx';

const MessageInput = ({ onSend, isSending = false, placeholder = 'Write a message…' }) => {
  const [value, setValue] = useState('');

  const submit = async (event) => {
    event.preventDefault();
    const text = value.trim();
    if (!text) return;
    const ok = await onSend(text);
    if (ok !== false) setValue('');
  };

  return (
    <form onSubmit={submit} className="space-y-2">
      <Textarea
        rows={3}
        value={value}
        onChange={(event) => setValue(event.target.value)}
        placeholder={placeholder}
        maxLength={4000}
        aria-label="Message"
      />
      <div className="flex justify-end">
        <Button type="submit" icon={Send} isLoading={isSending} disabled={!value.trim()}>
          Send
        </Button>
      </div>
    </form>
  );
};

export default MessageInput;

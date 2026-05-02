import { useState, type ChangeEvent, type FormEvent } from 'react';
import { Box, Button, MenuItem, Stack, TextField } from '@mui/material';
import type { NotificationPayload, NotificationSeverity } from '../services/api';
import { useLifecycleLog } from '../hooks/useLifecycleLog';

interface NotificationComposerProps {
  disabled: boolean;
  isSaving: boolean;
  onSubmit: (payload: NotificationPayload) => Promise<void>;
}

const initialForm = {
  title: '',
  message: '',
  severity: 'info' as NotificationSeverity,
};

const severityOptions: NotificationSeverity[] = ['info', 'success', 'warning', 'error'];

export function NotificationComposer({ disabled, isSaving, onSubmit }: NotificationComposerProps) {
  useLifecycleLog('component', 'Notification composer');
  const [form, setForm] = useState(initialForm);

  const updateField = (field: keyof typeof initialForm) => (event: ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;
    setForm((current) => ({ ...current, [field]: value }));
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    await onSubmit({
      title: form.title.trim(),
      message: form.message.trim(),
      severity: form.severity,
    });

    setForm(initialForm);
  };

  return (
    <Box component="form" onSubmit={handleSubmit}>
      <Stack spacing={2}>
        <TextField label="Notification title" value={form.title} onChange={updateField('title')} placeholder="Server maintenance" required disabled={disabled} />
        <TextField
          label="Message"
          value={form.message}
          onChange={updateField('message')}
          placeholder="Planned maintenance begins at 22:00 and should complete within 30 minutes."
          required
          multiline
          minRows={3}
          disabled={disabled}
        />
        <TextField select label="Severity" value={form.severity} onChange={updateField('severity')} disabled={disabled}>
          {severityOptions.map((option) => (
            <MenuItem key={option} value={option}>
              {option}
            </MenuItem>
          ))}
        </TextField>
        <Button type="submit" variant="contained" color="secondary" disabled={disabled || isSaving}>
          {isSaving ? 'Creating notification...' : 'Create notification'}
        </Button>
      </Stack>
    </Box>
  );
}

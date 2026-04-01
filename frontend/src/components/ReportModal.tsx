import React, { useState } from 'react';
import { Modal, Stack, Select, Textarea, Button, Group, Alert, Text } from '@mantine/core';
import { createReport } from '../api/report';

const REASONS = [
  'Harassment',
  'Spam',
  'Inappropriate content',
  'Fraudulent listing',
  'Other',
];

interface Props {
  opened: boolean;
  onClose: () => void;
  reportedId: number;
  reportedName: string;
}

const ReportModal: React.FC<Props> = ({ opened, onClose, reportedId, reportedName }) => {
  const [reason, setReason] = useState<string | null>(null);
  const [body, setBody] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  const handleClose = () => {
    setReason(null);
    setBody('');
    setError(null);
    setSubmitted(false);
    onClose();
  };

  const handleSubmit = async () => {
    if (!reason || !body.trim()) return;
    setLoading(true);
    setError(null);
    const result = await createReport(reportedId, reason, body.trim());
    setLoading(false);
    if (result.error) {
      setError('Failed to submit report.');
    } else {
      setSubmitted(true);
    }
  };

  return (
    <Modal opened={opened} onClose={handleClose} title={`Report ${reportedName}`} centered>
      <Stack gap="md">
        {submitted ? (
          <>
            <Text size="sm" c="green">Your report has been submitted. Our team will review it.</Text>
            <Group justify="flex-end">
              <Button onClick={handleClose}>Close</Button>
            </Group>
          </>
        ) : (
          <>
            {error && <Alert color="red">{error}</Alert>}
            <Select
              label="Reason"
              placeholder="Select a reason"
              data={REASONS}
              value={reason}
              onChange={setReason}
            />
            <Textarea
              label="Details"
              placeholder="Describe the issue..."
              value={body}
              onChange={(e) => setBody(e.currentTarget.value)}
              minRows={4}
              required
            />
            <Group justify="flex-end">
              <Button variant="outline" onClick={handleClose} disabled={loading}>Cancel</Button>
              <Button color="red" loading={loading} disabled={!reason || !body.trim()} onClick={handleSubmit}>
                Submit report
              </Button>
            </Group>
          </>
        )}
      </Stack>
    </Modal>
  );
};

export default ReportModal;

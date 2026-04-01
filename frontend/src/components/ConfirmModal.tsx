import React from 'react';
import { Modal, Stack, Text, Group, Button } from '@mantine/core';

interface Props {
  opened: boolean;
  onClose: () => void;
  title: string;
  message: React.ReactNode;
  confirmLabel: string;
  confirmColor?: string;
  loading: boolean;
  onConfirm: () => void;
}

const ConfirmModal: React.FC<Props> = ({ opened, onClose, title, message, confirmLabel, confirmColor = 'red', loading, onConfirm }) => (
  <Modal opened={opened} onClose={onClose} title={title} centered>
    <Stack gap="md">
      <Text>{message}</Text>
      <Group justify="flex-end">
        <Button variant="outline" onClick={onClose} disabled={loading}>Go back</Button>
        <Button color={confirmColor} loading={loading} onClick={onConfirm}>{confirmLabel}</Button>
      </Group>
    </Stack>
  </Modal>
);

export default ConfirmModal;

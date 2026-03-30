import React, { useState } from 'react';
import { Modal, TextInput, Textarea, NumberInput, Button, Stack, FileInput, Pill, Alert } from '@mantine/core';
import { createListing, Listing, CreateListingPayload } from '../api/listing';

interface Props {
  opened: boolean;
  onClose: () => void;
  onCreated: (listing: Listing) => void;
}

const CreateListingModal: React.FC<Props> = ({ opened, onClose, onCreated }) => {
  const [name, setName] = useState('');
  const [species, setSpecies] = useState('');
  const [age, setAge] = useState<number | string>('');
  const [description, setDescription] = useState('');
  const [rate, setRate] = useState<number | string>('');
  const [images, setImages] = useState<File[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const payload: CreateListingPayload = {
      name,
      species,
      age: Number(age),
      description,
      rate: Number(rate),
    };
    const data = await createListing(payload, images);
    setLoading(false);
    if (data.error) {
      setError('Failed to create listing. Please check your input.');
    } else if (data.listing) {
      onCreated(data.listing);
      onClose();
      setName(''); setSpecies(''); setAge(''); setDescription(''); setRate(''); setImages([]);
    }
  };

  return (
    <Modal opened={opened} onClose={onClose} title="Create Listing" size="md">
      <form onSubmit={handleSubmit}>
        <Stack>
          {error && <Alert color="red">{error}</Alert>}
          <TextInput label="Pet Name" required value={name} onChange={(e) => setName(e.currentTarget.value)} />
          <TextInput label="Species" placeholder="e.g. Dog, Cat" required value={species} onChange={(e) => setSpecies(e.currentTarget.value)} />
          <NumberInput label="Age (years)" required min={0} value={age} onChange={setAge} />
          <Textarea label="Description" required value={description} onChange={(e) => setDescription(e.currentTarget.value)} />
          <NumberInput label="Rate ($ / hour)" required min={0} value={rate} onChange={setRate} />
          <FileInput
            label="Images"
            description="Hold Ctrl (or Cmd on Mac) to select multiple images at once"
            accept="image/*"
            multiple
            onChange={(files) => setImages(files)}
            valueComponent={({ value }) =>
              Array.isArray(value) && value.length > 0 ? (
                <Pill.Group>
                  {value.map((f: File) => <Pill key={f.name}>{f.name}</Pill>)}
                </Pill.Group>
              ) : null
            }
          />
          <Button type="submit" loading={loading}>Create</Button>
        </Stack>
      </form>
    </Modal>
  );
};

export default CreateListingModal;
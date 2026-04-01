import React, { useEffect, useRef, useState } from 'react';
import {
  Container, Title, Text, Stack, Avatar, Group, Image, SimpleGrid,
  Loader, Alert, Paper, Button, TextInput, Textarea, ActionIcon,
} from '@mantine/core';
import { getRenterMe, updateRenterProfile, Renter } from '../api/renter';
import { updateAvatar, addImages, deleteImage } from '../api/user';
import { AVATARS_URL, PROFILE_IMAGES_URL } from '../api/config';
import Topbar from '../components/Topbar';

const RenterAccountPage: React.FC = () => {
  const [renter, setRenter] = useState<Renter | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [editing, setEditing] = useState(false);
  const [fName, setFName] = useState('');
  const [lName, setLName] = useState('');
  const [location, setLocation] = useState('');
  const [description, setDescription] = useState('');
  const [saveLoading, setSaveLoading] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const [avatarLoading, setAvatarLoading] = useState(false);
  const [imagesLoading, setImagesLoading] = useState(false);
  const [deletingImage, setDeletingImage] = useState<string | null>(null);

  const avatarInputRef = useRef<HTMLInputElement>(null);
  const imagesInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    getRenterMe().then((data) => {
      if (data.error) setError('Failed to load account details.');
      else if (data.renter) setRenter(data.renter);
    });
  }, []);

  const startEditing = (r: Renter) => {
    setFName(r.fName);
    setLName(r.lName);
    setLocation(r.location);
    setDescription(r.description);
    setSaveError(null);
    setEditing(true);
  };

  const handleSave = async () => {
    if (!renter) return;
    setSaveLoading(true);
    setSaveError(null);
    const result = await updateRenterProfile(fName, lName, location, description);
    setSaveLoading(false);
    if (result.error) {
      setSaveError('Failed to save changes.');
    } else {
      setRenter(result.renter!);
      setEditing(false);
    }
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setAvatarLoading(true);
    const result = await updateAvatar(file);
    setAvatarLoading(false);
    if (!result.error && result.avatar_filename) {
      setRenter((prev) => prev ? { ...prev, avatar_filename: result.avatar_filename! } : prev);
    }
    e.target.value = '';
  };

  const handleAddImages = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    if (!files.length) return;
    setImagesLoading(true);
    const result = await addImages(files);
    setImagesLoading(false);
    if (!result.error && result.added) {
      setRenter((prev) => prev ? { ...prev, profile_images: [...prev.profile_images, ...result.added!] } : prev);
    }
    e.target.value = '';
  };

  const handleDeleteImage = async (filename: string) => {
    setDeletingImage(filename);
    const result = await deleteImage(filename);
    setDeletingImage(null);
    if (!result.error) {
      setRenter((prev) => prev ? { ...prev, profile_images: prev.profile_images.filter((f) => f !== filename) } : prev);
    }
  };

  if (!renter && !error) return (
    <>
      <Topbar />
      <Container my={40} style={{ display: 'flex', justifyContent: 'center' }}><Loader /></Container>
    </>
  );

  return (
    <>
      <Topbar />
      <Container my={40}>
        {error && <Alert color="red" mb="lg">{error}</Alert>}
        {renter && (
          <Paper withBorder shadow="sm" p="xl" radius="md">
            <Stack>
              <Group align="flex-start">
                <Stack gap="xs" align="center">
                  <Avatar
                    src={renter.avatar_filename ? `${AVATARS_URL}/${renter.avatar_filename}` : undefined}
                    size="xl" radius="xl" color="blue"
                  >
                    {renter.fName.charAt(0)}
                  </Avatar>
                  <input ref={avatarInputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleAvatarChange} />
                  <Button size="xs" variant="subtle" loading={avatarLoading} onClick={() => avatarInputRef.current?.click()}>
                    Change avatar
                  </Button>
                </Stack>
                <Stack gap={4} style={{ flex: 1 }}>
                  <Title order={2}>{renter.fName} {renter.lName}</Title>
                  <Text size="xs" c="dimmed">ID #{renter.id}</Text>
                  <Text c="dimmed">{renter.email}</Text>
                  {renter.rating !== null && <Text size="sm" c="dimmed">Rating: {(renter.rating * 5).toFixed(1)} / 5</Text>}
                </Stack>
                {!editing && <Button size="sm" variant="outline" onClick={() => startEditing(renter)}>Edit profile</Button>}
              </Group>

              {editing ? (
                <Stack gap="sm">
                  {saveError && <Alert color="red">{saveError}</Alert>}
                  <Group grow>
                    <TextInput label="First name" value={fName} onChange={(e) => setFName(e.currentTarget.value)} />
                    <TextInput label="Last name" value={lName} onChange={(e) => setLName(e.currentTarget.value)} />
                  </Group>
                  <TextInput label="Location" value={location} onChange={(e) => setLocation(e.currentTarget.value)} />
                  <Textarea label="Description" value={description} onChange={(e) => setDescription(e.currentTarget.value)} minRows={3} />
                  <Group>
                    <Button onClick={handleSave} loading={saveLoading} disabled={!fName.trim() || !lName.trim() || !location.trim() || !description.trim()}>Save</Button>
                    <Button variant="outline" onClick={() => setEditing(false)} disabled={saveLoading}>Cancel</Button>
                  </Group>
                </Stack>
              ) : (
                <>
                  <Stack gap={4}>
                    <Text fw={500}>Location</Text>
                    <Text>{renter.location}</Text>
                  </Stack>
                  <Stack gap={4}>
                    <Text fw={500}>Description</Text>
                    <Text>{renter.description}</Text>
                  </Stack>
                </>
              )}

              <Stack gap="xs">
                <Group justify="space-between">
                  <Text fw={500}>Profile Images</Text>
                  <input ref={imagesInputRef} type="file" accept="image/*" multiple style={{ display: 'none' }} onChange={handleAddImages} />
                  <Button size="xs" variant="outline" loading={imagesLoading} onClick={() => imagesInputRef.current?.click()}>
                    Add photos
                  </Button>
                </Group>
                {renter.profile_images.length > 0 && (
                  <SimpleGrid cols={3}>
                    {renter.profile_images.map((filename) => (
                      <div key={filename} style={{ position: 'relative' }}>
                        <Image src={`${PROFILE_IMAGES_URL}/${filename}`} radius="md" fit="cover" h={120} />
                        <ActionIcon
                          color="red" variant="filled" size="sm"
                          style={{ position: 'absolute', top: 4, right: 4 }}
                          loading={deletingImage === filename}
                          onClick={() => handleDeleteImage(filename)}
                        >
                          ×
                        </ActionIcon>
                      </div>
                    ))}
                  </SimpleGrid>
                )}
              </Stack>
            </Stack>
          </Paper>
        )}
      </Container>
    </>
  );
};

export default RenterAccountPage;

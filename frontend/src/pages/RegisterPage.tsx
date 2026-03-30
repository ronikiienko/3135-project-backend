import React, { useState } from 'react';
import {
  Container,
  Paper,
  Title,
  TextInput,
  PasswordInput,
  Button,
  Anchor,
  Box,
  Avatar,
  Stack,
  Select,
  Textarea,
  Alert,
  FileInput,
  Pill,
} from '@mantine/core';
import { MdPersonAddAlt1 } from 'react-icons/md';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import { registerShelter, registerRenter } from '../api/auth';

type RegisterRole = 'SHELTER' | 'RENTER';

const RegisterPage: React.FC = () => {
  const [role, setRole] = useState<RegisterRole>('RENTER');

  // Shared
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [location, setLocation] = useState('');
  const [description, setDescription] = useState('');

  // Shelter only
  const [shelterName, setShelterName] = useState('');

  // Renter only
  const [fName, setFName] = useState('');
  const [lName, setLName] = useState('');

  // Files
  const [avatar, setAvatar] = useState<File | null>(null);
  const [profileImages, setProfileImages] = useState<File[]>([]);

  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    setLoading(true);
    try {
      let data;
      if (role === 'SHELTER') {
        data = await registerShelter({ email, password, name: shelterName, location, description }, avatar, profileImages);
      } else {
        data = await registerRenter({ email, password, fName, lName, location, description }, avatar, profileImages);
      }

      if (data.error) {
        if (data.error === 'EMAIL_ALREADY_IN_USE') setError('This email is already registered.');
        else if (data.error === 'PAYLOAD_MALFORMED') setError('Invalid input.');
        else setError('Something went wrong. Please try again.');
      } else {
        localStorage.setItem('role', role);
        navigate('/dashboard');
      }
    } catch {
      setError('Could not reach the server. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container size={420} my={40}>
      <Paper withBorder shadow="md" p={30} mt={30} radius="md">
        <Stack align="center" mb="lg">
          <Avatar color="blue" radius="xl" size="lg">
            <MdPersonAddAlt1 size={24} />
          </Avatar>
          <Title order={2} ta="center">
            Create an account
          </Title>
        </Stack>

        {error && (
          <Alert color="red" mb="md">
            {error}
          </Alert>
        )}

        <form onSubmit={handleSubmit}>
          <Select
            label="I am a"
            required
            value={role}
            onChange={(v) => setRole((v as RegisterRole) ?? 'RENTER')}
            data={[
              { value: 'RENTER', label: 'Renter' },
              { value: 'SHELTER', label: 'Shelter' },
            ]}
          />

          {role === 'SHELTER' && (
            <TextInput
              label="Shelter Name"
              placeholder="Happy Paws Shelter"
              required
              mt="md"
              value={shelterName}
              onChange={(e) => setShelterName(e.currentTarget.value)}
            />
          )}

          {role === 'RENTER' && (
            <>
              <TextInput
                label="First Name"
                placeholder="First Name"
                required
                mt="md"
                value={fName}
                onChange={(e) => setFName(e.currentTarget.value)}
              />
              <TextInput
                label="Last Name"
                placeholder="Last Name"
                required
                mt="md"
                value={lName}
                onChange={(e) => setLName(e.currentTarget.value)}
              />
            </>
          )}

          <TextInput
            label="Email Address"
            placeholder="you@example.com"
            required
            mt="md"
            value={email}
            onChange={(e) => setEmail(e.currentTarget.value)}
          />
          <PasswordInput
            label="Password"
            placeholder="Min. 8 characters"
            required
            mt="md"
            value={password}
            onChange={(e) => setPassword(e.currentTarget.value)}
          />
          <TextInput
            label="Location"
            placeholder="City, State"
            required
            mt="md"
            value={location}
            onChange={(e) => setLocation(e.currentTarget.value)}
          />
          <Textarea
            label="Description"
            placeholder="Tell us about yourself"
            required
            mt="md"
            value={description}
            onChange={(e) => setDescription(e.currentTarget.value)}
          />

          <FileInput
            label="Avatar"
            accept="image/*"
            mt="md"
            onChange={(file) => setAvatar(file)}
          />

          <FileInput
            label="Profile Images"
            description="Hold Ctrl (or Cmd on Mac) to select multiple images at once"
            accept="image/*"
            multiple
            mt="md"
            onChange={(files) => setProfileImages(files)}
            valueComponent={({ value }) =>
              Array.isArray(value) && value.length > 0 ? (
                <Pill.Group>
                  {value.map((f: File) => <Pill key={f.name}>{f.name}</Pill>)}
                </Pill.Group>
              ) : null
            }
          />

          <Button fullWidth mt="xl" type="submit" loading={loading}>
            Register
          </Button>
        </form>

        <Box mt="md" ta="center">
          <Anchor component={RouterLink} to="/login" size="sm">
            Already have an account? Sign in
          </Anchor>
        </Box>
      </Paper>
    </Container>
  );
};

export default RegisterPage;
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
  Alert,
} from '@mantine/core';
import { MdLockOutline } from 'react-icons/md';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import { login, Role } from '../api/auth';

const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<Role>('RENTER');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const data = await login({ email, password, role });
      if (data.error) {
        if (data.error === 'INVALID_CREDENTIALS') setError('Invalid email or password.');
        else if (data.error === 'PAYLOAD_MALFORMED') setError('Invalid input.');
        else setError('Something went wrong. Please try again.');
      } else {
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
            <MdLockOutline size={24} />
          </Avatar>
          <Title order={2} ta="center">
            Sign in
          </Title>
        </Stack>

        {error && (
          <Alert color="red" mb="md">
            {error}
          </Alert>
        )}

        <form onSubmit={handleSubmit}>
          <Select
            label="Role"
            required
            value={role}
            onChange={(v) => setRole((v as Role) ?? 'RENTER')}
            data={[
              { value: 'RENTER', label: 'Renter' },
              { value: 'SHELTER', label: 'Shelter' },
              { value: 'ADMIN', label: 'Admin' },
            ]}
          />
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
            placeholder="Your password"
            required
            mt="md"
            value={password}
            onChange={(e) => setPassword(e.currentTarget.value)}
          />
          <Button fullWidth mt="xl" type="submit" loading={loading}>
            Sign In
          </Button>
        </form>

        <Box mt="md" ta="center">
          <Anchor component={RouterLink} to="/register" size="sm">
            Don't have an account? Sign Up
          </Anchor>
        </Box>
      </Paper>
    </Container>
  );
};

export default LoginPage;
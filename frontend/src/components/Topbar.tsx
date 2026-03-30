import React, { useEffect, useState } from 'react';
import { Group, Avatar, Text, Box, Menu } from '@mantine/core';
import { useNavigate } from 'react-router-dom';
import { getRenterMe } from '../api/renter';
import { getShelterMe } from '../api/shelter';
import { logout } from '../api/auth';
import { AVATARS_URL } from '../api/config';

type UserInfo = { name: string; avatarFilename: string | null };

const Topbar: React.FC = () => {
  const [user, setUser] = useState<UserInfo | null>(null);
  const navigate = useNavigate();
  const role = localStorage.getItem('role');

  useEffect(() => {
    if (role === 'SHELTER') {
      getShelterMe().then(({ shelter }) => {
        if (shelter) setUser({ name: shelter.name, avatarFilename: shelter.avatar_filename });
      });
    } else if (role === 'RENTER') {
      getRenterMe().then(({ renter }) => {
        if (renter) setUser({ name: `${renter.fName} ${renter.lName}`, avatarFilename: renter.avatar_filename });
      });
    }
  }, []);

  const handleLogout = async () => {
    await logout();
    localStorage.removeItem('role');
    navigate('/login');
  };

  const accountPath = role === 'SHELTER' ? '/shelter/account' : '/renter/account';
  const avatarSrc = user?.avatarFilename ? `${AVATARS_URL}/${user.avatarFilename}` : undefined;

  return (
    <Box px="lg" py="sm" style={{ borderBottom: '1px solid #e9ecef' }}>
      <Group justify="space-between">
        <Text fw={600}>Dashboard</Text>
        <Menu position="bottom-end">
          <Menu.Target>
            <Group gap="sm" style={{ cursor: 'pointer' }}>
              <Text size="sm">{user?.name ?? ''}</Text>
              <Avatar src={avatarSrc} radius="xl" size="md" color="blue">
                {!avatarSrc && user?.name?.[0]}
              </Avatar>
            </Group>
          </Menu.Target>
          <Menu.Dropdown>
            <Menu.Item onClick={() => navigate(accountPath)}>Account</Menu.Item>
            <Menu.Divider />
            <Menu.Item color="red" onClick={handleLogout}>Log out</Menu.Item>
          </Menu.Dropdown>
        </Menu>
      </Group>
    </Box>
  );
};

export default Topbar;
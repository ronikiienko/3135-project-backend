import React from 'react';
import { Container, Title } from '@mantine/core';
import Topbar from '../components/Topbar';

const DashboardPage: React.FC = () => {
  return (
    <>
      <Topbar />
      <Container my={40}>
        <Title order={2}>Dashboard</Title>
      </Container>
    </>
  );
};

export default DashboardPage;
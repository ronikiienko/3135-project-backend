import React from 'react';
import { Container, Title, Text, Stack, Accordion } from '@mantine/core';
import Topbar from '../components/Topbar';

const HelpPage: React.FC = () => {
  return (
    <>
      <Topbar />
      <Container my={40} size="sm">
        <Stack gap="xl">
          <Stack gap="xs">
            <Title order={2}>How PetShare works</Title>
            <Text c="dimmed">Everything you need to know about renting a pet or listing one.</Text>
          </Stack>

          <Stack gap="sm">
            <Title order={4}>For Renters</Title>
            <Accordion variant="separated">
              <Accordion.Item value="request">
                <Accordion.Control>How do I rent a pet?</Accordion.Control>
                <Accordion.Panel>
                  <Stack gap="xs">
                    <Text size="sm">Browse available pets and click <strong>Request Rental</strong> on any listing. This sends a request to the shelter — it does not confirm anything yet.</Text>
                    <Text size="sm">You don't pick dates when requesting. The shelter proposes the rental period as part of their response. You can message the shelter beforehand to discuss availability.</Text>
                    <Text size="sm">The shelter will either decline your request or propose a rental period with a total cost. You'll have <strong>24 hours</strong> to accept or decline. If you don't respond, the request expires automatically.</Text>
                  </Stack>
                </Accordion.Panel>
              </Accordion.Item>

              <Accordion.Item value="payment">
                <Accordion.Control>How does payment work?</Accordion.Control>
                <Accordion.Panel>
                  <Stack gap="xs">
                    <Text size="sm">When you accept the shelter's terms, payment is taken immediately and held securely. The shelter does <strong>not</strong> receive the money right away.</Text>
                    <Text size="sm">The funds are released to the shelter <strong>24 hours after the rental ends</strong>, provided no dispute has been raised.</Text>
                    <Text size="sm" c="orange.7"><strong>Once you pay, the payment is non-refundable</strong> except if the shelter cancels or you win a dispute.</Text>
                  </Stack>
                </Accordion.Panel>
              </Accordion.Item>

              <Accordion.Item value="decline">
                <Accordion.Control>Can I back out before paying?</Accordion.Control>
                <Accordion.Panel>
                  <Text size="sm">Yes. When the shelter proposes terms, you can <strong>decline</strong> — no payment will be taken and the rental ends there. Once you have paid, you cannot get a refund except through a dispute or a shelter cancellation.</Text>
                </Accordion.Panel>
              </Accordion.Item>

              <Accordion.Item value="dispute">
                <Accordion.Control>What if something goes wrong during the rental?</Accordion.Control>
                <Accordion.Panel>
                  <Stack gap="xs">
                    <Text size="sm">You can raise a <strong>dispute</strong> within 24 hours after the rental ends. Once raised, the shelter's payout is put on hold.</Text>
                    <Text size="sm">An admin will review the dispute and decide the outcome — either in your favour (refund) or in the shelter's favour (they get paid).</Text>
                    <Text size="sm">After the 24-hour window passes with no dispute, the rental is considered peacefully terminated and the shelter is paid automatically.</Text>
                  </Stack>
                </Accordion.Panel>
              </Accordion.Item>
            </Accordion>
          </Stack>

          <Stack gap="sm">
            <Title order={4}>For Shelters</Title>
            <Accordion variant="separated">
              <Accordion.Item value="accepting">
                <Accordion.Control>How do I respond to a rental request?</Accordion.Control>
                <Accordion.Panel>
                  <Stack gap="xs">
                    <Text size="sm">When a renter requests a rental, you can <strong>decline</strong> to reject them, or <strong>accept</strong> to propose a rental period and cost.</Text>
                    <Text size="sm">If you accept, the renter has <strong>24 hours</strong> to pay. If they don't, the request expires automatically.</Text>
                  </Stack>
                </Accordion.Panel>
              </Accordion.Item>

              <Accordion.Item value="withdraw">
                <Accordion.Control>Can I withdraw after proposing terms?</Accordion.Control>
                <Accordion.Panel>
                  <Text size="sm">Yes. As long as the renter hasn't paid yet, you can <strong>withdraw</strong> your proposed terms at any time. No payment will be taken.</Text>
                </Accordion.Panel>
              </Accordion.Item>

              <Accordion.Item value="cancel">
                <Accordion.Control>Can I cancel after the renter has paid?</Accordion.Control>
                <Accordion.Panel>
                  <Text size="sm">Yes, but this will <strong>fully refund the renter</strong>. You will not receive any payment. Only do this if you genuinely cannot fulfil the rental (e.g. the animal is unwell or there's an emergency).</Text>
                </Accordion.Panel>
              </Accordion.Item>

              <Accordion.Item value="payout">
                <Accordion.Control>When do I receive payment?</Accordion.Control>
                <Accordion.Panel>
                  <Text size="sm">Payment is released to you <strong>24 hours after the rental period ends</strong>, as long as the renter has not raised a dispute. If a dispute is opened, an admin reviews it and decides the outcome.</Text>
                </Accordion.Panel>
              </Accordion.Item>
            </Accordion>
          </Stack>
        </Stack>
      </Container>
    </>
  );
};

export default HelpPage;

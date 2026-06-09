import { Container, Stack, Text, Title } from '@mantine/core';

export default function HomePage() {
  return (
    <Container size="sm" py="xl">
      <Stack gap="xs">
        <Title order={1}>Industrial Production Pilot</Title>
        <Text c="dimmed">
          Frontend running — Next.js 16 + React 19 + Mantine 9. Phase 1 scaffold, no business
          features yet.
        </Text>
      </Stack>
    </Container>
  );
}

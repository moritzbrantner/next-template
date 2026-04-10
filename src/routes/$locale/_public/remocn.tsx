import { createFileRoute } from '@tanstack/react-router';

import { RemocnShowcase } from '@/components/remocn-showcase';

export const Route = createFileRoute('/$locale/_public/remocn')({
  component: RemocnPage,
});

function RemocnPage() {
  return <RemocnShowcase />;
}

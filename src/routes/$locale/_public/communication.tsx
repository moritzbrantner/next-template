import { createFileRoute, redirect } from '@tanstack/react-router';

export const Route = createFileRoute('/$locale/_public/communication')({
  beforeLoad: ({ params }) => {
    throw redirect({
      to: '/$locale/examples/communication',
      params: { locale: params.locale },
    });
  },
});

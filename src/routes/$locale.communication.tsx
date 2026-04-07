import { createFileRoute, redirect } from '@tanstack/react-router';

export const Route = createFileRoute('/$locale/communication')({
  beforeLoad: ({ params }) => {
    throw redirect({
      to: '/$locale/examples/communication',
      params: { locale: params.locale },
    });
  },
});

import { createFileRoute, redirect } from '@tanstack/react-router';

export const Route = createFileRoute('/$locale/uploads')({
  beforeLoad: ({ params }) => {
    throw redirect({
      to: '/$locale/examples/uploads',
      params: { locale: params.locale },
    });
  },
});

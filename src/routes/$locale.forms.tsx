import { createFileRoute, redirect } from '@tanstack/react-router';

export const Route = createFileRoute('/$locale/forms')({
  beforeLoad: ({ params }) => {
    throw redirect({
      to: '/$locale/examples/forms',
      params: { locale: params.locale },
    });
  },
});

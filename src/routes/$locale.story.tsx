import { createFileRoute, redirect } from '@tanstack/react-router';

export const Route = createFileRoute('/$locale/story')({
  beforeLoad: ({ params }) => {
    throw redirect({
      to: '/$locale/examples/story',
      params: { locale: params.locale },
    });
  },
});

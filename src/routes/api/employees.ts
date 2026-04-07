import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/api/employees')({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const target = new URL('/api/examples/employees', request.url);
        return Response.redirect(target, 308);
      },
    },
  },
});

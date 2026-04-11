import { secureRoute } from '@/src/api/route-security';
import { createBlogPostUseCase } from '@/src/domain/blog/use-cases';

export async function POST(request: Request) {
  const guard = await secureRoute({
    request,
    action: 'blog.createPost',
    requireAuth: true,
  });

  if (!guard.ok) {
    return guard.response;
  }

  const formData = await request.formData();
  const rawTitle = formData.get('title');
  const rawContent = formData.get('content');
  const title = typeof rawTitle === 'string' ? rawTitle : '';
  const content = typeof rawContent === 'string' ? rawContent : '';

  try {
    const result = await createBlogPostUseCase(guard.session!.user.id, { title, content });

    if (!result.ok) {
      const status = result.error.code === 'NOT_FOUND' ? 404 : 400;
      return guard.json({ error: result.error.message }, { status });
    }

    return guard.json({ ok: true, postId: result.data.id }, { status: 201 });
  } catch {
    return guard.json({ error: 'Unable to publish your blog post right now. Please try again.' }, { status: 500 });
  }
}

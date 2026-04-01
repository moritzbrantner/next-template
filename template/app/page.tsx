import { StoryContainer, StoryScene, StorySeries } from "@moritzbrantner/storytelling";
import { Button, Card, CardContent, CardHeader, CardTitle } from "@moritzbrantner/ui";

export default function HomePage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-5xl flex-col gap-10 px-6 py-12">
      <section className="space-y-4">
        <p className="text-sm uppercase tracking-[0.2em] text-muted-foreground">
          Template Baseline
        </p>
        <h1 className="text-4xl font-semibold tracking-tight">{{ project_name }}</h1>
        <p className="max-w-2xl text-muted-foreground">
          This starter keeps infrastructure concerns consistent while shared runtime UI lives in
          platform packages.
        </p>
        <div className="flex gap-3">
          <Button>Primary Action</Button>
          <Button variant="secondary">Secondary Action</Button>
        </div>
      </section>

      <Card>
        <CardHeader>
          <CardTitle>Shared package integration</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-muted-foreground">
            `@moritzbrantner/ui` provides the design-system contract.
          </p>
        </CardContent>
      </Card>

      <StoryContainer
        title="Template walkthrough"
        subtitle="A small storytelling example that proves the shared package wiring."
      >
        <StorySeries ariaLabel="Template walkthrough scenes">
          <StoryScene id="infra" title="Infrastructure first">
            CI, security updates, linting, and testing defaults live in this template repo.
          </StoryScene>
          <StoryScene id="packages" title="Shared runtime packages">
            Reusable UI and storytelling components are consumed from platform packages.
          </StoryScene>
        </StorySeries>
      </StoryContainer>
    </main>
  );
}

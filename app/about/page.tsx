import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function AboutPage() {
  return (
    <Card className="mx-auto max-w-2xl">
      <CardHeader>
        <CardTitle>About This Project</CardTitle>
        <CardDescription>
          This page demonstrates routing in the App Router and a consistent UI structure powered by reusable components.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4 text-sm text-zinc-700 dark:text-zinc-300">
        <p>
          The navigation bar at the top appears across all routes, making it easy to move between the Home and About pages.
        </p>
        <p>
          Components in <code>components/ui</code> provide a clean foundation to expand this template with additional screens.
        </p>
      </CardContent>
    </Card>
  );
}

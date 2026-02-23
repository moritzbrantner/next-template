import Link from "next/link";

import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function Home() {
  return (
    <Card className="mx-auto max-w-2xl">
      <CardHeader>
        <CardTitle>Welcome</CardTitle>
        <CardDescription>
          This starter now includes a reusable navigation bar and an About page built with shadcn-style UI components.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex gap-3">
        <Link href="/about" className={buttonVariants({ variant: "default" })}>
          Visit About Page
        </Link>
        <Link href="https://nextjs.org/docs" className={buttonVariants({ variant: "ghost" })}>
          Next.js Docs
        </Link>
      </CardContent>
    </Card>
  );
}

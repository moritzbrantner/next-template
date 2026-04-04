import { createFileRoute, redirect } from '@tanstack/react-router';

import { canManageSystemSettings } from '@/lib/authorization';
import dbSchema from '@/db-schema.json';
import { SchemaTableForm } from '@/components/dynamic-db/schema-table-form';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { parseDbSchemaDocument } from '@/src/dynamic-db/schema';

export const Route = createFileRoute('/$locale/admin/data-studio')({
  beforeLoad: ({ context, params }) => {
    if (!canManageSystemSettings(context.session?.user.role)) {
      throw redirect({
        to: '/$locale',
        params: { locale: params.locale },
      });
    }
  },
  component: DataStudioPage,
});

function DataStudioPage() {
  const parsedSchema = parseDbSchemaDocument(dbSchema);

  return (
    <Card className="mx-auto max-w-4xl">
      <CardHeader>
        <CardTitle>Schema-driven data studio</CardTitle>
        <CardDescription>
          Forms below are generated from <code>db-schema.json</code>. Submit a form to insert a record in the mapped DB table.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {parsedSchema.tables.map((table) => (
          <SchemaTableForm key={table.name} table={table} />
        ))}
      </CardContent>
    </Card>
  );
}

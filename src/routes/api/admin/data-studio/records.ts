import { createFileRoute } from '@tanstack/react-router';

import dbSchema from '@/db-schema.json';
import { requireRole } from '@/lib/authorization';
import { getDb } from '@/src/db/client';
import { writableTableMap } from '@/src/dynamic-db/config';
import { normalizeFieldValue, parseDbSchemaDocument } from '@/src/dynamic-db/schema';

export const Route = createFileRoute('/api/admin/data-studio/records')({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          await requireRole('ADMIN');
        } catch {
          return Response.json({ ok: false, message: 'Forbidden.' }, { status: 403 });
        }

        const formData = await request.formData();
        const tableName = formData.get('tableName');

        if (typeof tableName !== 'string' || !(tableName in writableTableMap)) {
          return Response.json(
            {
              ok: false,
              message: 'Unknown table name. Update db-schema.json or writable table map.',
            },
            { status: 400 },
          );
        }

        const parsedSchema = parseDbSchemaDocument(dbSchema);
        const schemaTable = parsedSchema.tables.find((table) => table.name === tableName);

        if (!schemaTable) {
          return Response.json(
            {
              ok: false,
              message: `Table ${tableName} is not defined in db-schema.json.`,
            },
            { status: 400 },
          );
        }

        const row: Record<string, unknown> = {};

        for (const field of schemaTable.fields) {
          const normalized = normalizeFieldValue(field.type, formData.get(field.name), field.format);

          if (field.required && (normalized === null || normalized === undefined)) {
            return Response.json(
              {
                ok: false,
                message: `Field ${field.label} is required.`,
              },
              { status: 400 },
            );
          }

          if (normalized !== null && normalized !== undefined) {
            row[field.name] = normalized;
          }
        }

        if (Object.keys(row).length === 0) {
          return Response.json(
            {
              ok: false,
              message: 'No values were provided.',
            },
            { status: 400 },
          );
        }

        try {
          const db = getDb();
          const targetTable = writableTableMap[tableName as keyof typeof writableTableMap];
          await db.insert(targetTable).values(row as never);

          return Response.json({
            ok: true,
            message: `${tableName} record created successfully.`,
          });
        } catch (error) {
          const message = error instanceof Error ? error.message : 'Unknown error while creating record.';

          return Response.json(
            {
              ok: false,
              message,
            },
            { status: 500 },
          );
        }
      },
    },
  },
});

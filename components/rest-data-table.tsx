'use client';

import { useEffect, useState } from 'react';

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

type RowData = Record<string, string | number | boolean | null>;

type ValueType = 'text' | 'currency' | 'boolean' | 'date';

export type RestDataColumn<T extends RowData> = {
  key: keyof T;
  header: string;
  valueType?: ValueType;
};

type RestDataTableProps<T extends RowData> = {
  endpoint: string;
  columns: Array<RestDataColumn<T>>;
};

function formatValue(value: RowData[keyof RowData], valueType: ValueType) {
  if (value === null) {
    return '-';
  }

  if (valueType === 'currency' && typeof value === 'number') {
    return `$${value.toLocaleString('en-US')}`;
  }

  if (valueType === 'boolean' && typeof value === 'boolean') {
    return value ? 'Yes' : 'No';
  }

  return String(value);
}

export function RestDataTable<T extends RowData>({ endpoint, columns }: RestDataTableProps<T>) {
  const [rows, setRows] = useState<T[]>([]);
  const [status, setStatus] = useState<'loading' | 'error' | 'ready'>('loading');

  useEffect(() => {
    const controller = new AbortController();

    async function loadRows() {
      try {
        setStatus('loading');
        const response = await fetch(endpoint, { signal: controller.signal });

        if (!response.ok) {
          throw new Error(`Request failed with status ${response.status}`);
        }

        const data = (await response.json()) as T[];
        setRows(data);
        setStatus('ready');
      } catch {
        if (!controller.signal.aborted) {
          setStatus('error');
        }
      }
    }

    void loadRows();

    return () => controller.abort();
  }, [endpoint]);

  if (status === 'loading') {
    return <p className="text-sm text-zinc-600 dark:text-zinc-400">Loading endpoint data...</p>;
  }

  if (status === 'error') {
    return <p className="text-sm text-red-600 dark:text-red-400">Unable to load endpoint data.</p>;
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          {columns.map((column) => (
            <TableHead key={String(column.key)}>{column.header}</TableHead>
          ))}
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.map((row, rowIndex) => (
          <TableRow key={rowIndex}>
            {columns.map((column) => (
              <TableCell key={String(column.key)}>
                {formatValue(row[column.key], column.valueType ?? 'text')}
              </TableCell>
            ))}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

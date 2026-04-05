import { createFileRoute } from '@tanstack/react-router';

import type { AppRole } from '@/lib/authorization';
import type { AppLocale } from '@/i18n/routing';
import { AdminPageShell } from '@/components/admin/admin-page-shell';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { requireAdminPageAccess } from '@/src/admin/access';
import { useTranslations } from '@/src/i18n';

type UserStatusKey = 'active' | 'pending' | 'suspended';
type UserActionKey = 'primary' | 'secondary' | 'danger';

const userMetricKeys = ['privileged', 'operational', 'member'] as const;
const workflowKeys = ['invite', 'promote', 'suspend'] as const;
const userRows: ReadonlyArray<{
  name: string;
  email: string;
  role: AppRole;
  status: UserStatusKey;
  lastSeen: string;
  actions: readonly UserActionKey[];
}> = [
  {
    name: 'Maya Chen',
    email: 'maya.chen@northstar.test',
    role: 'ADMIN',
    status: 'active',
    lastSeen: '2 min ago',
    actions: ['primary', 'secondary', 'danger'],
  },
  {
    name: 'Jonas Hartmann',
    email: 'jonas.hartmann@northstar.test',
    role: 'MANAGER',
    status: 'active',
    lastSeen: '18 min ago',
    actions: ['primary', 'secondary', 'danger'],
  },
  {
    name: 'Priya Nair',
    email: 'priya.nair@northstar.test',
    role: 'USER',
    status: 'pending',
    lastSeen: 'Invite sent',
    actions: ['primary', 'secondary'],
  },
  {
    name: 'Luca Weber',
    email: 'luca.weber@northstar.test',
    role: 'USER',
    status: 'suspended',
    lastSeen: '3 days ago',
    actions: ['primary', 'secondary'],
  },
] as const;

export const Route = createFileRoute('/$locale/admin/users')({
  beforeLoad: ({ context, params }) => {
    requireAdminPageAccess(context.session, params.locale as AppLocale);
  },
  component: UsersPage,
});

function UsersPage() {
  const t = useTranslations('AdminPage');

  return (
    <AdminPageShell title={t('users.title')} description={t('users.description')}>
      <div className="grid gap-4 md:grid-cols-3">
        {userMetricKeys.map((metricKey) => (
          <Card key={metricKey}>
            <CardHeader>
              <CardDescription>{t(`users.metrics.${metricKey}.label`)}</CardDescription>
              <CardTitle className="text-2xl">{t(`users.metrics.${metricKey}.value`)}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-zinc-600 dark:text-zinc-300">{t(`users.metrics.${metricKey}.detail`)}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t('users.tableTitle')}</CardTitle>
          <CardDescription>{t('users.tableDescription')}</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t('users.columns.user')}</TableHead>
                <TableHead>{t('users.columns.role')}</TableHead>
                <TableHead>{t('users.columns.status')}</TableHead>
                <TableHead>{t('users.columns.lastSeen')}</TableHead>
                <TableHead className="text-right">{t('users.columns.actions')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {userRows.map((user) => (
                <TableRow key={user.email}>
                  <TableCell>
                    <div className="space-y-1">
                      <p className="font-medium">{user.name}</p>
                      <p className="text-sm text-zinc-600 dark:text-zinc-300">{user.email}</p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={user.role === 'ADMIN' ? 'default' : 'secondary'}>{user.role}</Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={user.status === 'active' ? 'secondary' : 'outline'}>{t(`users.status.${user.status}`)}</Badge>
                  </TableCell>
                  <TableCell>{user.lastSeen}</TableCell>
                  <TableCell>
                    <div className="flex justify-end gap-2">
                      {user.actions.map((actionKey) => (
                        <Button
                          key={`${user.email}-${actionKey}`}
                          type="button"
                          variant={actionKey === 'primary' ? 'default' : actionKey === 'secondary' ? 'outline' : 'ghost'}
                          size="sm"
                          className={actionKey === 'danger' ? 'text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300' : undefined}
                        >
                          {t(`users.actions.${user.status}.${actionKey}`)}
                        </Button>
                      ))}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t('users.workflowTitle')}</CardTitle>
          <CardDescription>{t('users.workflowDescription')}</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-3">
          {workflowKeys.map((workflowKey) => (
            <div key={workflowKey} className="rounded-2xl border p-4 dark:border-zinc-800">
              <p className="font-medium">{t(`users.workflows.${workflowKey}.title`)}</p>
              <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-300">{t(`users.workflows.${workflowKey}.description`)}</p>
            </div>
          ))}
        </CardContent>
      </Card>
    </AdminPageShell>
  );
}

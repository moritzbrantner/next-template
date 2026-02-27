import { getTranslations } from 'next-intl/server';

import NextLink from 'next/link';

import { Link } from '@/i18n/navigation';

import { StorytellingExperience } from '@/components/storytelling-experience';
import { RestDataTable, type RestDataColumn } from '@/components/rest-data-table';
import { buttonVariants } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';


type EmployeeRow = {
  id: number;
  firstName: string;
  lastName: string;
  birthday: string;
  email: string;
  salary: number;
  active: boolean;
  team: string;
  startDate: string;
  bonusEligible: boolean;
  managerId: number | null;
};

const employeeColumns: Array<RestDataColumn<EmployeeRow>> = [
  { key: 'id', header: 'ID' },
  { key: 'firstName', header: 'First name' },
  { key: 'lastName', header: 'Last name' },
  { key: 'birthday', header: 'Birthday', valueType: 'date' },
  { key: 'email', header: 'Email' },
  { key: 'salary', header: 'Salary (USD)', valueType: 'currency' },
  { key: 'active', header: 'Active', valueType: 'boolean' },
  { key: 'team', header: 'Team' },
  { key: 'startDate', header: 'Start date', valueType: 'date' },
  { key: 'bonusEligible', header: 'Bonus', valueType: 'boolean' },
  { key: 'managerId', header: 'Manager ID' },
];

export default async function Home() {
  const t = await getTranslations('HomePage');

  return (
    <div className="space-y-8">
      <Card className="mx-auto max-w-2xl">
        <CardHeader>
          <CardTitle>{t('title')}</CardTitle>
          <CardDescription>{t('description')}</CardDescription>
        </CardHeader>
        <CardContent className="flex gap-3">
          <Link href="/about" className={buttonVariants({ variant: 'default' })}>
            {t('visitAbout')}
          </Link>
          <NextLink href="https://nextjs.org/docs" className={buttonVariants({ variant: 'ghost' })}>
            {t('docs')}
          </NextLink>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Generic REST endpoint table</CardTitle>
          <CardDescription>
            ShadCN-style table rendering a generic endpoint with mixed data types.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <RestDataTable<EmployeeRow>
            endpoint="/api/employees"
            columns={employeeColumns}
          />
        </CardContent>
      </Card>

      <StorytellingExperience
        scenes={[
          {
            id: 'arrival',
            title: 'Act I — Arrival',
            description:
              'The camera eases into the world as your audience enters the story space.',
            progressionStart: 0,
            progressionEnd: 30,
            color: '#4f46e5',
            position: [-2.4, -0.5, -1],
            scale: 0.9,
          },
          {
            id: 'conflict',
            title: 'Act II — Conflict',
            description:
              'Tension rises. Smooth, frame-by-frame transitions keep the narrative cinematic.',
            progressionStart: 30,
            progressionEnd: 75,
            color: '#f59e0b',
            position: [0.2, 0.4, 0],
            scale: 1.15,
          },
          {
            id: 'resolution',
            title: 'Act III — Resolution',
            description:
              'Everything settles into a calm finale while the progression reaches 100.',
            progressionStart: 75,
            progressionEnd: 100,
            color: '#10b981',
            position: [2.4, -0.3, -1.2],
            scale: 0.95,
          },
        ]}
      />
    </div>
  );
}

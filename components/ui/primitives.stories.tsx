import type { Meta, StoryObj } from '@storybook/nextjs-vite';

import { Badge } from '@/components/ui/badge';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Textarea } from '@/components/ui/textarea';

const meta = {
  title: 'UI/Primitives',
  parameters: {
    layout: 'padded',
  },
} satisfies Meta;

export default meta;

type Story = StoryObj<typeof meta>;

export const FormControls: Story = {
  render: () => (
    <div className="grid max-w-xl gap-5">
      <div className="grid gap-2">
        <Label htmlFor="primitive-title">Title</Label>
        <Input id="primitive-title" defaultValue="Scheduled maintenance" />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="primitive-body">Message</Label>
        <Textarea
          id="primitive-body"
          defaultValue="Briefly describe what changed and what action is needed."
          rows={4}
        />
      </div>
    </div>
  ),
};

export const CardsBadgesAndTable: Story = {
  render: () => (
    <div className="grid gap-5">
      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-center gap-2">
            <CardTitle>Operational summary</CardTitle>
            <Badge variant="outline">Ready</Badge>
          </div>
          <CardDescription>
            Shared card, badge, and table primitives used across admin views.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Area</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Owner</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow>
                <TableCell>Audit log</TableCell>
                <TableCell>Healthy</TableCell>
                <TableCell>Security operations</TableCell>
              </TableRow>
              <TableRow>
                <TableCell>Notifications</TableCell>
                <TableCell>Queued</TableCell>
                <TableCell>Platform team</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  ),
};

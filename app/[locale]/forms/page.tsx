import { EmployeeProfileForm } from '@/components/forms/employee-profile-form';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function FormsPage() {
  return (
    <Card className="mx-auto max-w-4xl">
      <CardHeader>
        <CardTitle>Employee profile form</CardTitle>
        <CardDescription>
          This page demonstrates react-hook-form with ten fields and built-in validation.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <EmployeeProfileForm />
      </CardContent>
    </Card>
  );
}

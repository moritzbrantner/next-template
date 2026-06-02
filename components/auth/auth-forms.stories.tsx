import type { Meta, StoryObj } from '@storybook/nextjs-vite';

import { ForgotPasswordForm } from '@/components/auth/forgot-password-form';
import { LoginForm } from '@/components/auth/login-form';
import { RegisterForm } from '@/components/auth/register-form';
import { ResetPasswordForm } from '@/components/auth/reset-password-form';
import { I18nProvider } from '@/src/i18n';
import { authPages } from '@/messages/en/auth-pages';

const loginForm = authPages.login.form;
const registerForm = authPages.register.form;
const resetPasswordForm = authPages.resetPassword.form;

const meta = {
  title: 'Auth/Forms',
  parameters: {
    layout: 'centered',
  },
  decorators: [
    (Story) => (
      <I18nProvider locale="en" messages={{ AuthPages: authPages }}>
        <div className="w-[min(420px,calc(100vw-2rem))]">
          <Story />
        </div>
      </I18nProvider>
    ),
  ],
} satisfies Meta;

export default meta;

type Story = StoryObj<typeof meta>;

export const Login: Story = {
  render: () => (
    <LoginForm
      locale="en"
      returnTo="/login"
      labels={{
        ...loginForm,
        socialDivider: loginForm.social.divider,
        socialProviders: loginForm.social.providers,
      }}
    />
  ),
};

export const Register: Story = {
  render: () => (
    <RegisterForm
      locale="en"
      returnTo="/register"
      labels={{
        ...registerForm,
        socialDivider: registerForm.social.divider,
        socialProviders: registerForm.social.providers,
      }}
    />
  ),
};

export const ForgotPassword: Story = {
  render: () => (
    <ForgotPasswordForm
      locale="en"
      labels={{
        title: registerForm.resetPasswordTitle,
        description: registerForm.resetPasswordDescription,
        email: registerForm.resetPasswordEmail,
        submit: registerForm.resetPasswordSubmit,
        submitting: registerForm.resetPasswordSubmitting,
        requiredEmail: registerForm.requiredEmail,
        invalidEmail: registerForm.invalidEmail,
        success: registerForm.resetPasswordSuccess,
        genericError: registerForm.resetPasswordGenericError,
      }}
    />
  ),
};

export const ResetPassword: Story = {
  render: () => (
    <ResetPasswordForm
      locale="en"
      token="storybook-reset-token"
      labels={{
        ...resetPasswordForm,
        success: authPages.resetPassword.success,
        loginCta: authPages.resetPassword.loginCta,
      }}
    />
  ),
};

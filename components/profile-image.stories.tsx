import { useEffect, useState } from 'react';
import type { Meta, StoryObj } from '@storybook/nextjs-vite';

import { ProfileImageCropper } from '@/components/profile-image-cropper';
import { ProfileImageForm } from '@/components/profile-image-form';
import { I18nProvider } from '@/src/i18n';

const profileImageDataUrl =
  'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"%3E%3Crect width="512" height="512" fill="%23f4f4f5"/%3E%3Ccircle cx="256" cy="210" r="96" fill="%2314b8a6"/%3E%3Cpath d="M96 456c28-82 86-124 160-124s132 42 160 124" fill="%230f766e"/%3E%3C/svg%3E';

const labels = {
  upload: 'Upload image',
  uploading: 'Uploading...',
  remove: 'Remove',
  chooseImage: 'Choose image',
  hint: 'Use a square PNG or JPEG for best results.',
  success: 'Profile image updated.',
  empty: 'No image',
  alt: 'Current profile image',
  cropTitle: 'Crop profile image',
  cropDescription: 'Drag the image and adjust zoom before uploading.',
  cropZoom: 'Zoom',
  cropCancel: 'Cancel',
  cropApply: 'Apply crop',
  ready: 'Cropped image ready to upload.',
};

const meta = {
  title: 'Profile/Profile Image',
  parameters: {
    layout: 'centered',
  },
  decorators: [
    (Story) => (
      <I18nProvider locale="en" messages={{}}>
        <div className="w-[min(560px,calc(100vw-2rem))]">
          <Story />
        </div>
      </I18nProvider>
    ),
  ],
} satisfies Meta;

export default meta;

type Story = StoryObj<typeof meta>;

function CropperPreview() {
  const [file, setFile] = useState<File | null>(null);

  useEffect(() => {
    const source =
      '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><rect width="512" height="512" fill="#f4f4f5"/><circle cx="256" cy="210" r="96" fill="#14b8a6"/><path d="M96 456c28-82 86-124 160-124s132 42 160 124" fill="#0f766e"/></svg>';
    setFile(new File([source], 'profile-image.svg', { type: 'image/svg+xml' }));
  }, []);

  if (!file) {
    return null;
  }

  return (
    <ProfileImageCropper
      file={file}
      labels={{
        title: labels.cropTitle,
        description: labels.cropDescription,
        zoom: labels.cropZoom,
        cancel: labels.cropCancel,
        apply: labels.cropApply,
      }}
      onCancel={() => undefined}
      onApply={() => undefined}
    />
  );
}

export const UploadForm: Story = {
  render: () => (
    <ProfileImageForm currentImage={profileImageDataUrl} labels={labels} />
  ),
};

export const Cropper: Story = {
  render: () => <CropperPreview />,
};

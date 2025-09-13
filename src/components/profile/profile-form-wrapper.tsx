'use client';

import { ProfileForm } from './profile-form';

type ProfileFormWrapperProps = {
  userId: string;
  userEmail: string;
  initialData?: any;
  organizationData?: any;
  canEditCompany?: boolean;
};

export function ProfileFormWrapper({ 
  userId, 
  userEmail, 
  initialData, 
  organizationData, 
  canEditCompany 
}: ProfileFormWrapperProps) {
  return (
    <ProfileForm 
      userId={userId}
      userEmail={userEmail}
      initialData={initialData}
      organizationData={organizationData}
      canEditCompany={canEditCompany}
    />
  );
}

import { useState, useEffect } from 'react';

interface ContactAvatar {
  phoneNumber: string;
  avatarUrl: string | null;
  name: string | null;
  loading: boolean;
  error: string | null;
}

export function useContactAvatar(phoneNumber: string) {
  const [avatar, setAvatar] = useState<ContactAvatar>({
    phoneNumber,
    avatarUrl: null,
    name: null,
    loading: false,
    error: null
  });

  const fetchAvatar = async () => {
    if (!phoneNumber) return;

    setAvatar(prev => ({ ...prev, loading: true, error: null }));

    try {
      const response = await fetch(`/api/contacts/${phoneNumber}/avatar`);
      const data = await response.json();

      if (response.ok && data.success) {
        setAvatar(prev => ({
          ...prev,
          avatarUrl: data.data?.profilePicture || null,
          name: null, // Nome não vem do endpoint de avatar
          loading: false,
          error: null
        }));
      } else {
        setAvatar(prev => ({
          ...prev,
          loading: false,
          error: data.error || 'Failed to fetch avatar'
        }));
      }
    } catch (error) {
      setAvatar(prev => ({
        ...prev,
        loading: false,
        error: 'Network error'
      }));
    }
  };

  useEffect(() => {
    if (phoneNumber && phoneNumber !== avatar.phoneNumber) {
      setAvatar({
        phoneNumber,
        avatarUrl: null,
        name: null,
        loading: false,
        error: null
      });
    }
  }, [phoneNumber]);

  return {
    ...avatar,
    fetchAvatar,
    refetch: fetchAvatar
  };
}

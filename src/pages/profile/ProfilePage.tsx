import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { authService } from '../../services/authService';
import { Input } from '../../components/common/Input';
import { Select } from '../../components/common/Select';
import { Button } from '../../components/common/Button';
import { InitialsAvatar } from '../../components/common/InitialsAvatar';
import { ConfirmDialog } from '../../components/common/ConfirmDialog';
import { User, Shield, Trash2, Globe } from 'lucide-react';

export const ProfilePage: React.FC = () => {
  const { user, updateUser, logout } = useAuth();
  const { showToast } = useToast();

  const [name, setName] = useState(user?.name || '');
  const [avatar, setAvatar] = useState(user?.avatar || '');
  const [language, setLanguage] = useState(user?.languagePreference || 'en');
  const [isUpdating, setIsUpdating] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsUpdating(true);
    try {
      const updated = await authService.updateProfile({
        name: name.trim(),
        avatar: avatar.trim() || undefined,
        languagePreference: language,
      });
      updateUser(updated);
      showToast('success', 'Profile updated successfully!');
    } catch (err: any) {
      showToast('error', err.response?.data?.message || 'Failed to update profile');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDeleteAccount = async () => {
    setIsDeleting(true);
    try {
      await authService.deleteAccount();
      showToast('info', 'Your account and all trip data have been deleted.');
      logout();
    } catch (err: any) {
      showToast('error', err.response?.data?.message || 'Failed to delete account');
      setIsDeleting(false);
    }
  };

  const languages = [
    { value: 'en', label: 'English (US / UK)' },
    { value: 'hi', label: 'Hindi (हिन्दी)' },
    { value: 'es', label: 'Spanish (Español)' },
    { value: 'fr', label: 'French (Français)' },
  ];

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 space-y-8">
      {/* Header */}
      <div className="bg-white rounded-2xl p-6 sm:p-8 border border-[#E5E1E4] shadow-soft flex flex-col sm:flex-row items-center gap-6">
        <InitialsAvatar name={user?.name || 'User'} avatar={avatar || user?.avatar} size="lg" className="ring-4 ring-[#F4EEF3]" />
        <div className="text-center sm:text-left space-y-1">
          <div className="flex items-center justify-center sm:justify-start gap-2">
            <h1 className="text-2xl sm:text-3xl font-display font-black text-[#2F2930] tracking-tight">{user?.name}</h1>
            {user?.role === 'ADMIN' && (
              <span className="text-[10px] font-bold text-[#714B67] bg-[#F4EEF3] px-2 py-0.5 rounded border border-[#E5E1E4]">
                Administrator
              </span>
            )}
          </div>
          <p className="text-xs text-[#6F6A70] font-medium">{user?.email}</p>
        </div>
      </div>

      {/* Profile Form */}
      <div className="bg-white rounded-2xl p-6 sm:p-8 border border-[#E5E1E4] shadow-soft space-y-6">
        <h2 className="text-lg font-bold text-[#2F2930] font-display flex items-center gap-2">
          <User className="w-4 h-4 text-[#714B67]" /> Personal Settings
        </h2>

        <form onSubmit={handleUpdate} className="space-y-4">
          <Input
            label="Display Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />

          <Input
            label="Email Address"
            value={user?.email || ''}
            disabled
            helperText="Email cannot be changed."
          />

          <Input
            label="Avatar Image URL (Optional)"
            placeholder="https://images.unsplash.com/..."
            value={avatar}
            onChange={(e) => setAvatar(e.target.value)}
          />

          <Select
            label="Language Preference"
            options={languages}
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
          />

          <div className="pt-4 border-t border-[#E5E1E4] flex justify-end">
            <Button variant="primary" type="submit" isLoading={isUpdating}>
              Save Profile Changes
            </Button>
          </div>
        </form>
      </div>

      {/* Danger Zone */}
      <div className="bg-[#F9EFEF]/50 rounded-2xl p-6 sm:p-8 border border-[#F0D1D1] shadow-2xs space-y-4">
        <div className="flex items-center gap-2 text-[#B85C5C]">
          <Shield className="w-5 h-5" />
          <h2 className="text-base font-bold font-display">Danger Zone</h2>
        </div>
        <p className="text-xs text-[#6F6A70] leading-relaxed font-medium">
          Deleting your account permanently deletes all your trips, itineraries, budget logs, and community stories. This action cannot be reversed.
        </p>
        <Button
          variant="danger"
          size="sm"
          onClick={() => setShowDeleteConfirm(true)}
          leftIcon={<Trash2 className="w-3.5 h-3.5" />}
        >
          Delete Account
        </Button>
      </div>

      <ConfirmDialog
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={handleDeleteAccount}
        title="Delete Account"
        message="Are you completely sure you want to permanently delete your account and all associated trip data?"
        confirmText="Permanently Delete"
        variant="danger"
        isLoading={isDeleting}
      />
    </div>
  );
};

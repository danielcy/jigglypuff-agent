import React from 'react';
import type { LibraryMaterial } from '../../../types';
import { AttachmentCardsList } from './AttachmentCardsList';

const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001';

interface SelectedMaterialsBarProps {
  selected: LibraryMaterial[];
  onRemove: (id: number) => void;
}

const getFullUrl = (url?: string) => {
  if (!url) return '';
  // If it's already a full URL (starts with http), use it directly
  if (url.startsWith('http')) return url;
  // Otherwise, it's a relative path from backend upload - add backend prefix
  return `${backendUrl}${url}`;
};

const getAttachment = (mat: LibraryMaterial) => {
  const url = getFullUrl(mat.type === 'image'
    ? mat.metadata.imageUrl!
    : mat.metadata.videoUrl!);
  const coverUrl = getFullUrl(mat.type === 'image'
    ? mat.metadata.imageUrl!
    : mat.metadata.coverUrl!);
  return {
    id: mat.id,
    name: mat.name,
    url,
    type: mat.type,
    coverUrl,
  };
};

export const SelectedMaterialsBar: React.FC<SelectedMaterialsBarProps> = ({
  selected,
  onRemove,
}) => {
  return (
    <AttachmentCardsList
      materials={selected.map(getAttachment)}
      onRemove={onRemove}
    />
  );
};

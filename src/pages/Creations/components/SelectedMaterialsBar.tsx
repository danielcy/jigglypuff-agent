import React from 'react';
import type { LibraryMaterial } from '../../../types';
import { AttachmentCardsList } from './AttachmentCardsList';

interface SelectedMaterialsBarProps {
  selected: LibraryMaterial[];
  onRemove: (id: number) => void;
}

const getAttachment = (mat: LibraryMaterial) => {
  const url = mat.type === 'image'
    ? mat.metadata.imageUrl!
    : mat.metadata.videoUrl!;
  const coverUrl = mat.type === 'image'
    ? mat.metadata.imageUrl!
    : mat.metadata.coverUrl!;
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

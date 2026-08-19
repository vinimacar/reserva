import { GenderType } from '../types';

export interface AvatarOption {
  id: string;
  url: string;
  label: string;
  gender: GenderType;
  type: 'photo' | 'illustration';
}

// Curated high quality male educator avatar options
export const MALE_EDUCATOR_AVATARS: AvatarOption[] = [
  {
    id: 'male_photo_1',
    url: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=200&auto=format&fit=crop&q=80',
    label: 'Professor Formal',
    gender: 'MALE',
    type: 'photo',
  },
  {
    id: 'male_photo_2',
    url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&auto=format&fit=crop&q=80',
    label: 'Professor Dinâmico',
    gender: 'MALE',
    type: 'photo',
  },
  {
    id: 'male_photo_3',
    url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&auto=format&fit=crop&q=80',
    label: 'Professor Experiente',
    gender: 'MALE',
    type: 'photo',
  },
  {
    id: 'male_photo_4',
    url: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200&auto=format&fit=crop&q=80',
    label: 'Professor Amigável',
    gender: 'MALE',
    type: 'photo',
  },
  {
    id: 'male_photo_5',
    url: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=200&auto=format&fit=crop&q=80',
    label: 'Professor Jovem',
    gender: 'MALE',
    type: 'photo',
  },
  {
    id: 'male_illust_1',
    url: 'https://api.dicebear.com/7.x/personas/svg?seed=TeacherMale1&backgroundColor=b6e3f4',
    label: 'Avatar Ilustrado 1',
    gender: 'MALE',
    type: 'illustration',
  },
  {
    id: 'male_illust_2',
    url: 'https://api.dicebear.com/7.x/personas/svg?seed=TeacherMaleAlex&backgroundColor=c0aede',
    label: 'Avatar Ilustrado 2',
    gender: 'MALE',
    type: 'illustration',
  },
];

// Curated high quality female educator avatar options
export const FEMALE_EDUCATOR_AVATARS: AvatarOption[] = [
  {
    id: 'female_photo_1',
    url: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=200&auto=format&fit=crop&q=80',
    label: 'Professora Formal',
    gender: 'FEMALE',
    type: 'photo',
  },
  {
    id: 'female_photo_2',
    url: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=200&auto=format&fit=crop&q=80',
    label: 'Professora Dinâmica',
    gender: 'FEMALE',
    type: 'photo',
  },
  {
    id: 'female_photo_3',
    url: 'https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?w=200&auto=format&fit=crop&q=80',
    label: 'Professora Dedicada',
    gender: 'FEMALE',
    type: 'photo',
  },
  {
    id: 'female_photo_4',
    url: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=200&auto=format&fit=crop&q=80',
    label: 'Professora Amigável',
    gender: 'FEMALE',
    type: 'photo',
  },
  {
    id: 'female_photo_5',
    url: 'https://images.unsplash.com/photo-1594744803329-e58b31de8bf5?w=200&auto=format&fit=crop&q=80',
    label: 'Professora Experiente',
    gender: 'FEMALE',
    type: 'photo',
  },
  {
    id: 'female_illust_1',
    url: 'https://api.dicebear.com/7.x/personas/svg?seed=TeacherFemaleMariana&backgroundColor=ffd5dc',
    label: 'Avatar Ilustrado 1',
    gender: 'FEMALE',
    type: 'illustration',
  },
  {
    id: 'female_illust_2',
    url: 'https://api.dicebear.com/7.x/personas/svg?seed=TeacherFemaleAna&backgroundColor=d1d4f9',
    label: 'Avatar Ilustrado 2',
    gender: 'FEMALE',
    type: 'illustration',
  },
];

/**
 * Intelligent helper to detect gender based on prefix or name
 */
export function detectGenderFromName(name: string): GenderType {
  const normalized = name.trim().toLowerCase();

  // Explicit title prefixes
  if (
    normalized.startsWith('profa') ||
    normalized.startsWith('professora') ||
    normalized.startsWith('profª') ||
    normalized.startsWith('prof.ª') ||
    normalized.startsWith('dona') ||
    normalized.startsWith('sra') ||
    normalized.startsWith('dra.') ||
    normalized.startsWith('dra ')
  ) {
    return 'FEMALE';
  }

  if (
    normalized.startsWith('prof.') ||
    normalized.startsWith('prof ') ||
    normalized.startsWith('professor ') ||
    normalized.startsWith('sr.') ||
    normalized.startsWith('sr ') ||
    normalized.startsWith('dr.') ||
    normalized.startsWith('dr ')
  ) {
    return 'MALE';
  }

  // Extract first first-name word (without title)
  const cleanName = normalized
    .replace(/^(prof\.|profa\.|profª\.|prof\s|profa\s|professor\s|professora\s|dr\.|dra\.)\s*/i, '')
    .trim();
  const firstName = cleanName.split(' ')[0] || '';

  const femaleNames = [
    'maria', 'mariana', 'ana', 'beatriz', 'camila', 'juliana', 'luciana', 'patricia',
    'fernanda', 'gabriela', 'aline', 'amanda', 'larissa', 'bruna', 'leticia', 'paula',
    'renata', 'vanessa', 'cristiane', 'daniela', 'jessica', 'claudia', 'helena', 'carla',
    'roberta', 'silvia', 'monica', 'fatima', 'regina', 'teresa', 'terezinha', 'vanda',
    'marise', 'valeria', 'eliane', 'simone', 'adriana', 'tatiana', 'priscila', 'marta',
  ];

  if (femaleNames.includes(firstName)) {
    return 'FEMALE';
  }

  // Common rule for Brazilian names ending in 'a' (except exceptions like Luca)
  if (firstName.endsWith('a') && firstName !== 'luca') {
    return 'FEMALE';
  }

  return 'MALE';
}

/**
 * Gets default avatar for a gender
 */
export function getDefaultAvatar(gender: GenderType, name?: string): string {
  if (gender === 'FEMALE') {
    if (name) {
      const idx = Math.abs(name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)) % FEMALE_EDUCATOR_AVATARS.length;
      return FEMALE_EDUCATOR_AVATARS[idx].url;
    }
    return FEMALE_EDUCATOR_AVATARS[0].url;
  } else {
    if (name) {
      const idx = Math.abs(name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)) % MALE_EDUCATOR_AVATARS.length;
      return MALE_EDUCATOR_AVATARS[idx].url;
    }
    return MALE_EDUCATOR_AVATARS[0].url;
  }
}

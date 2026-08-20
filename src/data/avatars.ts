import { GenderType } from '../types';

export interface EducationalIconOption {
  id: string;
  iconName: string; // Lucide icon name
  label: string;
  category: string;
  bgColor: string; // Tailwind class
  iconColor: string; // Tailwind class
  borderColor: string; // Tailwind class
  gradient: string; // Tailwind gradient
}

// Curated high-quality educational and discipline vector icons (strictly non-human, non-animal)
export const EDUCATIONAL_ICONS: EducationalIconOption[] = [
  {
    id: 'icon:academic',
    iconName: 'GraduationCap',
    label: 'Educação & Pedagogia Geral',
    category: 'Pedagógico',
    bgColor: 'bg-blue-50 dark:bg-blue-950/60',
    iconColor: 'text-blue-600 dark:text-blue-400',
    borderColor: 'border-blue-200 dark:border-blue-800',
    gradient: 'from-blue-600 to-indigo-600',
  },
  {
    id: 'icon:tech',
    iconName: 'Laptop',
    label: 'Tecnologia, Robótica & Informática',
    category: 'Tecnologia',
    bgColor: 'bg-indigo-50 dark:bg-indigo-950/60',
    iconColor: 'text-indigo-600 dark:text-indigo-400',
    borderColor: 'border-indigo-200 dark:border-indigo-800',
    gradient: 'from-indigo-600 to-blue-600',
  },
  {
    id: 'icon:math',
    iconName: 'Calculator',
    label: 'Matemática & Raciocínio Lógico',
    category: 'Exatas',
    bgColor: 'bg-amber-50 dark:bg-amber-950/60',
    iconColor: 'text-amber-600 dark:text-amber-400',
    borderColor: 'border-amber-200 dark:border-amber-800',
    gradient: 'from-amber-500 to-orange-600',
  },
  {
    id: 'icon:science',
    iconName: 'FlaskConical',
    label: 'Química & Laboratório de Ciências',
    category: 'Ciências',
    bgColor: 'bg-emerald-50 dark:bg-emerald-950/60',
    iconColor: 'text-emerald-600 dark:text-emerald-400',
    borderColor: 'border-emerald-200 dark:border-emerald-800',
    gradient: 'from-emerald-500 to-teal-600',
  },
  {
    id: 'icon:physics',
    iconName: 'Atom',
    label: 'Física & Astronomia',
    category: 'Ciências',
    bgColor: 'bg-cyan-50 dark:bg-cyan-950/60',
    iconColor: 'text-cyan-600 dark:text-cyan-400',
    borderColor: 'border-cyan-200 dark:border-cyan-800',
    gradient: 'from-cyan-500 to-blue-600',
  },
  {
    id: 'icon:biology',
    iconName: 'Dna',
    label: 'Biologia & Saúde',
    category: 'Biológicas',
    bgColor: 'bg-teal-50 dark:bg-teal-950/60',
    iconColor: 'text-teal-600 dark:text-teal-400',
    borderColor: 'border-teal-200 dark:border-teal-800',
    gradient: 'from-teal-500 to-emerald-600',
  },
  {
    id: 'icon:literature',
    iconName: 'BookOpen',
    label: 'Língua Portuguesa & Literatura',
    category: 'Linguagens',
    bgColor: 'bg-rose-50 dark:bg-rose-950/60',
    iconColor: 'text-rose-600 dark:text-rose-400',
    borderColor: 'border-rose-200 dark:border-rose-800',
    gradient: 'from-rose-500 to-red-600',
  },
  {
    id: 'icon:art',
    iconName: 'Palette',
    label: 'Artes & Criação Visual',
    category: 'Artes',
    bgColor: 'bg-purple-50 dark:bg-purple-950/60',
    iconColor: 'text-purple-600 dark:text-purple-400',
    borderColor: 'border-purple-200 dark:border-purple-800',
    gradient: 'from-purple-500 to-pink-600',
  },
  {
    id: 'icon:geography',
    iconName: 'Globe',
    label: 'Geografia & Meio Ambiente',
    category: 'Humanas',
    bgColor: 'bg-emerald-50 dark:bg-emerald-950/60',
    iconColor: 'text-emerald-600 dark:text-emerald-400',
    borderColor: 'border-emerald-200 dark:border-emerald-800',
    gradient: 'from-emerald-600 to-sky-600',
  },
  {
    id: 'icon:geometry',
    iconName: 'Compass',
    label: 'Desenho Geométrico & História',
    category: 'Exatas/Humanas',
    bgColor: 'bg-violet-50 dark:bg-violet-950/60',
    iconColor: 'text-violet-600 dark:text-violet-400',
    borderColor: 'border-violet-200 dark:border-violet-800',
    gradient: 'from-violet-500 to-indigo-600',
  },
  {
    id: 'icon:ideas',
    iconName: 'Lightbulb',
    label: 'Filosofia, Sociologia & Inovação',
    category: 'Humanas',
    bgColor: 'bg-yellow-50 dark:bg-yellow-950/60',
    iconColor: 'text-yellow-600 dark:text-yellow-400',
    borderColor: 'border-yellow-200 dark:border-yellow-800',
    gradient: 'from-amber-400 to-yellow-600',
  },
  {
    id: 'icon:music',
    iconName: 'Music',
    label: 'Música & Artes Cênicas',
    category: 'Artes',
    bgColor: 'bg-fuchsia-50 dark:bg-fuchsia-950/60',
    iconColor: 'text-fuchsia-600 dark:text-fuchsia-400',
    borderColor: 'border-fuchsia-200 dark:border-fuchsia-800',
    gradient: 'from-fuchsia-500 to-purple-600',
  },
  {
    id: 'icon:sports',
    iconName: 'Award',
    label: 'Educação Física & Esportes',
    category: 'Esportes',
    bgColor: 'bg-orange-50 dark:bg-orange-950/60',
    iconColor: 'text-orange-600 dark:text-orange-400',
    borderColor: 'border-orange-200 dark:border-orange-800',
    gradient: 'from-orange-500 to-amber-600',
  },
  {
    id: 'icon:management',
    iconName: 'School',
    label: 'Direção, Coordenação & Gestão',
    category: 'Gestão',
    bgColor: 'bg-slate-100 dark:bg-slate-800',
    iconColor: 'text-slate-700 dark:text-slate-300',
    borderColor: 'border-slate-300 dark:border-slate-700',
    gradient: 'from-slate-700 to-slate-900',
  },
  {
    id: 'icon:sparkles',
    iconName: 'Sparkles',
    label: 'Projetos Especiais & Makers',
    category: 'Multidisciplinar',
    bgColor: 'bg-blue-50 dark:bg-blue-950/60',
    iconColor: 'text-blue-600 dark:text-blue-400',
    borderColor: 'border-blue-200 dark:border-blue-800',
    gradient: 'from-blue-500 to-violet-600',
  },
  {
    id: 'icon:target',
    iconName: 'Target',
    label: 'Orientação Educacional',
    category: 'Apoio',
    bgColor: 'bg-rose-50 dark:bg-rose-950/60',
    iconColor: 'text-rose-600 dark:text-rose-400',
    borderColor: 'border-rose-200 dark:border-rose-800',
    gradient: 'from-rose-500 to-orange-500',
  },
];

/**
 * Maps subject names to appropriate educational icons
 */
export function getIconForSubject(subject?: string): string {
  if (!subject) return 'icon:academic';
  const norm = subject.toLowerCase();

  if (norm.includes('matemática') || norm.includes('calculo') || norm.includes('estatística')) {
    return 'icon:math';
  }
  if (norm.includes('tecnologia') || norm.includes('informática') || norm.includes('robótica') || norm.includes('computação')) {
    return 'icon:tech';
  }
  if (norm.includes('química') || norm.includes('quimica')) {
    return 'icon:science';
  }
  if (norm.includes('física') || norm.includes('fisica') || norm.includes('astronomia')) {
    return 'icon:physics';
  }
  if (norm.includes('biologia') || norm.includes('ciência') || norm.includes('ciencias') || norm.includes('saúde')) {
    return 'icon:biology';
  }
  if (norm.includes('português') || norm.includes('portugues') || norm.includes('literatura') || norm.includes('redação') || norm.includes('inglês') || norm.includes('espanhol') || norm.includes('línguas')) {
    return 'icon:literature';
  }
  if (norm.includes('arte') || norm.includes('artes') || norm.includes('desenho')) {
    return 'icon:art';
  }
  if (norm.includes('geografia') || norm.includes('meio ambiente')) {
    return 'icon:geography';
  }
  if (norm.includes('história') || norm.includes('historia')) {
    return 'icon:geometry';
  }
  if (norm.includes('filosofia') || norm.includes('sociologia')) {
    return 'icon:ideas';
  }
  if (norm.includes('música') || norm.includes('musica') || norm.includes('teatro')) {
    return 'icon:music';
  }
  if (norm.includes('física escolar') || norm.includes('educação física') || norm.includes('esporte')) {
    return 'icon:sports';
  }
  if (norm.includes('direção') || norm.includes('coordenação') || norm.includes('gestão')) {
    return 'icon:management';
  }
  if (norm.includes('maker') || norm.includes('projeto') || norm.includes('inovação')) {
    return 'icon:sparkles';
  }

  return 'icon:academic';
}

/**
 * Gets educational icon metadata by ID or fallback
 */
export function getEducationalIcon(iconIdOrSubject?: string): EducationalIconOption {
  if (!iconIdOrSubject) return EDUCATIONAL_ICONS[0];

  const foundById = EDUCATIONAL_ICONS.find((i) => i.id === iconIdOrSubject);
  if (foundById) return foundById;

  const mappedId = getIconForSubject(iconIdOrSubject);
  const foundMapped = EDUCATIONAL_ICONS.find((i) => i.id === mappedId);
  if (foundMapped) return foundMapped;

  return EDUCATIONAL_ICONS[0];
}

/**
 * Fallback for gender detection (if needed for polite address)
 */
export function detectGenderFromName(name: string): GenderType {
  const normalized = name.trim().toLowerCase();

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

  if (firstName.endsWith('a') && firstName !== 'luca') {
    return 'FEMALE';
  }

  return 'MALE';
}

/**
 * Gets default icon key for a teacher
 */
export function getDefaultAvatar(genderOrSubject?: string, name?: string): string {
  if (genderOrSubject && genderOrSubject.startsWith('icon:')) {
    return genderOrSubject;
  }
  if (genderOrSubject && genderOrSubject.length > 2 && genderOrSubject !== 'MALE' && genderOrSubject !== 'FEMALE') {
    return getIconForSubject(genderOrSubject);
  }
  // Return standard educational icon
  return 'icon:academic';
}

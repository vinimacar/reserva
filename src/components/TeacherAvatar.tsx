import React from 'react';
import {
  GraduationCap,
  Laptop,
  Calculator,
  FlaskConical,
  Atom,
  Dna,
  BookOpen,
  Palette,
  Globe,
  Compass,
  Lightbulb,
  Music,
  Award,
  School,
  Sparkles,
  Target,
  Shield,
  User as UserIcon,
} from 'lucide-react';
import { getEducationalIcon } from '../data/avatars';

interface TeacherAvatarProps {
  avatar?: string;
  name?: string;
  subject?: string;
  role?: 'ADMIN' | 'TEACHER';
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  showRoleBadge?: boolean;
}

export const TeacherAvatar: React.FC<TeacherAvatarProps> = ({
  avatar,
  name = 'Professor',
  subject,
  role,
  size = 'md',
  className = '',
  showRoleBadge = false,
}) => {
  // Retrieve icon definition
  const iconDef = getEducationalIcon(avatar || subject || 'icon:academic');

  // Map iconName string to actual Lucide component
  const renderIcon = (iconName: string, iconClass: string) => {
    switch (iconName) {
      case 'Laptop':
        return <Laptop className={iconClass} />;
      case 'Calculator':
        return <Calculator className={iconClass} />;
      case 'FlaskConical':
        return <FlaskConical className={iconClass} />;
      case 'Atom':
        return <Atom className={iconClass} />;
      case 'Dna':
        return <Dna className={iconClass} />;
      case 'BookOpen':
        return <BookOpen className={iconClass} />;
      case 'Palette':
        return <Palette className={iconClass} />;
      case 'Globe':
        return <Globe className={iconClass} />;
      case 'Compass':
        return <Compass className={iconClass} />;
      case 'Lightbulb':
        return <Lightbulb className={iconClass} />;
      case 'Music':
        return <Music className={iconClass} />;
      case 'Award':
        return <Award className={iconClass} />;
      case 'School':
        return <School className={iconClass} />;
      case 'Sparkles':
        return <Sparkles className={iconClass} />;
      case 'Target':
        return <Target className={iconClass} />;
      case 'Shield':
        return <Shield className={iconClass} />;
      case 'GraduationCap':
      default:
        return <GraduationCap className={iconClass} />;
    }
  };

  // Dimensions based on size prop
  let containerSize = 'w-9 h-9';
  let iconSize = 'w-4.5 h-4.5';
  let badgeSize = 'w-3 h-3';
  let textSize = 'text-xs';

  if (size === 'xs') {
    containerSize = 'w-6 h-6';
    iconSize = 'w-3 h-3';
    badgeSize = 'w-2 h-2';
    textSize = 'text-[9px]';
  } else if (size === 'sm') {
    containerSize = 'w-8 h-8';
    iconSize = 'w-4 h-4';
    badgeSize = 'w-2.5 h-2.5';
    textSize = 'text-[10px]';
  } else if (size === 'lg') {
    containerSize = 'w-12 h-12';
    iconSize = 'w-6 h-6';
    badgeSize = 'w-3.5 h-3.5';
    textSize = 'text-sm';
  } else if (size === 'xl') {
    containerSize = 'w-16 h-16';
    iconSize = 'w-8 h-8';
    badgeSize = 'w-4.5 h-4.5';
    textSize = 'text-base';
  }

  const isAdmin = role === 'ADMIN';

  return (
    <div className={`relative inline-flex shrink-0 ${className}`} title={`${name}${subject ? ` (${subject})` : ''}`}>
      <div
        className={`${containerSize} rounded-2xl flex items-center justify-center border ${iconDef.borderColor} ${iconDef.bgColor} shadow-2xs transition-transform`}
      >
        <div className={iconDef.iconColor}>
          {renderIcon(iconDef.iconName, iconSize)}
        </div>
      </div>

      {showRoleBadge && isAdmin && (
        <span
          className={`absolute -bottom-0.5 -right-0.5 ${badgeSize} rounded-full bg-amber-500 border-2 border-white dark:border-slate-900 flex items-center justify-center shadow-xs`}
          title="Administrador / Coordenação"
        >
          <Shield className="w-2 h-2 text-white fill-white" />
        </span>
      )}
    </div>
  );
};

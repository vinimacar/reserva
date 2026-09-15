// Sample educational emblems / crests that can be used or picked for schools
export interface SampleSchoolLogo {
  id: string;
  name: string;
  description: string;
  dataUrl: string;
}

// 1. Brasão Minas Gerais Educação (Triângulo Vermelho / Dourado institucional)
const SVG_MINAS_GERAIS = `data:image/svg+xml;utf8,${encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120" width="120" height="120">
  <circle cx="60" cy="60" r="56" fill="#FFFFFF" stroke="#DC2626" stroke-width="4"/>
  <circle cx="60" cy="60" r="50" fill="#FEF2F2"/>
  <!-- Red Triangle of Minas Gerais -->
  <polygon points="60,24 25,86 95,86" fill="#DC2626" stroke="#991B1B" stroke-width="2"/>
  <!-- Book inside triangle -->
  <path d="M 48 72 Q 60 68 72 72 L 72 80 Q 60 76 48 80 Z" fill="#FFFFFF"/>
  <path d="M 60 69 L 60 80" stroke="#DC2626" stroke-width="1.5"/>
  <text x="60" y="104" text-anchor="middle" font-family="sans-serif" font-size="7.5" font-weight="900" fill="#991B1B" letter-spacing="1">SEE / MG</text>
</svg>
`)}`;

// 2. Brasão Educação Municipal (Coroa Mural & Livro Aberto)
const SVG_MUNICIPAL = `data:image/svg+xml;utf8,${encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120" width="120" height="120">
  <defs>
    <linearGradient id="blueGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#1E40AF"/>
      <stop offset="100%" stop-color="#3B82F6"/>
    </linearGradient>
  </defs>
  <rect x="6" y="6" width="108" height="108" rx="24" fill="url(#blueGrad)" stroke="#FFFFFF" stroke-width="3"/>
  <!-- Crown -->
  <path d="M 38 32 L 44 42 L 60 30 L 76 42 L 82 32 L 82 46 L 38 46 Z" fill="#F59E0B" stroke="#B45309" stroke-width="1.5"/>
  <!-- Open Book -->
  <path d="M 34 60 Q 60 54 60 62 Q 60 54 86 60 L 86 82 Q 60 76 60 84 Q 60 76 34 82 Z" fill="#FFFFFF" stroke="#1E3A8A" stroke-width="2"/>
  <!-- Quill / Feather -->
  <path d="M 60 58 L 68 46 Q 74 48 64 54 Z" fill="#F59E0B"/>
  <text x="60" y="100" text-anchor="middle" font-family="sans-serif" font-size="7" font-weight="bold" fill="#EFF6FF" letter-spacing="0.5">REDE MUNICIPAL</text>
</svg>
`)}`;

// 3. Brasão Colégio Técnico / Inovação & Maker
const SVG_TECNICO_MAKER = `data:image/svg+xml;utf8,${encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120" width="120" height="120">
  <defs>
    <linearGradient id="purpGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#0F172A"/>
      <stop offset="100%" stop-color="#1E293B"/>
    </linearGradient>
  </defs>
  <circle cx="60" cy="60" r="56" fill="url(#purpGrad)" stroke="#10B981" stroke-width="3"/>
  <!-- Atom orbits -->
  <ellipse cx="60" cy="56" rx="34" ry="12" fill="none" stroke="#10B981" stroke-width="2" transform="rotate(30 60 56)"/>
  <ellipse cx="60" cy="56" rx="34" ry="12" fill="none" stroke="#06B6D4" stroke-width="2" transform="rotate(-30 60 56)"/>
  <circle cx="60" cy="56" r="6" fill="#F59E0B"/>
  <text x="60" y="98" text-anchor="middle" font-family="sans-serif" font-size="7" font-weight="bold" fill="#34D399" letter-spacing="1">EDUCAÇÃO & TECH</text>
</svg>
`)}`;

// 4. Brasão Coruja da Sabedoria (Clássico Pedagógico)
const SVG_CORUJA_ACADEMICA = `data:image/svg+xml;utf8,${encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120" width="120" height="120">
  <rect x="6" y="6" width="108" height="108" rx="22" fill="#FFFFFF" stroke="#0284C7" stroke-width="3.5"/>
  <!-- Owl Head -->
  <circle cx="60" cy="52" r="24" fill="#0369A1"/>
  <!-- Owl Eyes -->
  <circle cx="51" cy="50" r="8" fill="#FFFFFF"/>
  <circle cx="51" cy="50" r="4" fill="#0C4A6E"/>
  <circle cx="69" cy="50" r="8" fill="#FFFFFF"/>
  <circle cx="69" cy="50" r="4" fill="#0C4A6E"/>
  <!-- Beak -->
  <polygon points="60,54 57,60 63,60" fill="#F59E0B"/>
  <!-- Mortarboard Hat -->
  <polygon points="60,24 82,32 60,40 38,32" fill="#0F172A"/>
  <line x1="80" y1="33" x2="84" y2="44" stroke="#F59E0B" stroke-width="2"/>
  <text x="60" y="100" text-anchor="middle" font-family="sans-serif" font-size="7.5" font-weight="900" fill="#0369A1" letter-spacing="1">ENSINO & CIÊNCIA</text>
</svg>
`)}`;

export const SAMPLE_SCHOOL_LOGOS: SampleSchoolLogo[] = [
  {
    id: 'see_mg',
    name: 'SEE / Minas Gerais',
    description: 'Brasão oficial da Rede Estadual de Ensino de Minas Gerais',
    dataUrl: SVG_MINAS_GERAIS,
  },
  {
    id: 'municipal_educ',
    name: 'Rede Municipal',
    description: 'Brasão cívico com coroa e livro para secretarias municipais',
    dataUrl: SVG_MUNICIPAL,
  },
  {
    id: 'tech_maker',
    name: 'Ciência & Inovação',
    description: 'Emblema moderno com órbitas atômicas para laboratórios',
    dataUrl: SVG_TECNICO_MAKER,
  },
  {
    id: 'coruja_ensino',
    name: 'Sabedoria & Pedagogia',
    description: 'Símbolo acadêmico clássico da coruja e capelo',
    dataUrl: SVG_CORUJA_ACADEMICA,
  },
];

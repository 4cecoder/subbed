import nextVitals from 'eslint-config-next/core-web-vitals';
import nextTypescript from 'eslint-config-next/typescript';

const eslintConfig = [
  ...nextVitals,
  ...nextTypescript,
  {
    rules: {
      // This rule is too strict for valid initialization patterns
      // (e.g., loading from localStorage, initializing from props/settings)
      'react-hooks/set-state-in-effect': 'off',
    },
  },
  {
    ignores: [
      'node_modules/**',
      '.next/**',
      'out/**',
      'build/**',
      'dist/**',
      'coverage/**',
      'next-env.d.ts',
      'convex/_generated/**',
      '.env*',
      '*.log',
    ],
  },
];

export default eslintConfig;

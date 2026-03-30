import cspell from '@cspell/eslint-plugin'
import jsLint from '@eslint/js'
import onlyWarn from 'eslint-plugin-only-warn'
import perfectionist from 'eslint-plugin-perfectionist'
import { defineConfig, globalIgnores } from 'eslint/config'
import globals from 'globals'
import tsESLint from 'typescript-eslint'

const perf = [
	'warn',
	{
		type: 'natural',
	},
]

/** @type {import("eslint").Linter.Config} */
export default defineConfig(
	tsESLint.configs.recommended,
	jsLint.configs.recommended,
	{
		plugins: {
			onlyWarn,
		},
	},
	{
		plugins: {
			'@cspell': cspell,
		},
		rules: {
			'@cspell/spellchecker': [
				'warn',
				{
					cspell: {
						words: [
							'pandoc',
							'adoc',
							'asciidoc',
							'biblatex',
							'csljson',
							'creole',
							'djot',
							'docbook',
							'dokuwiki',
							'endnotexml',
							'jats',
							'slideous',
							'slidy',
							'dzslides',
							'revealjs',
							'tikiwiki',
							'twiki',
							'typst',
							'vimwiki',
							'unidir',
							'bidir',
							'combinators',
							'async',
							'todo',
							'funtoyz',
							'waku',
							'fumadocs',
							'logomark',
							'accs',
							'LTAGS',
							'callbags',
							'succ',
							'unfoldable',
							'errable',
							'juxt',
							'uncurry',
							'uncurried',
							'converger',
							'dichotomic',
							'constellar',
							'elems',
							'Lamarche',
							'prncss',
							'rambda',
							'removables',
							'trush',
							'orama',
							'resulter',
						],
					},
				},
			],
		},
	},
	{
		plugins: {
			perfectionist,
		},
		rules: {
			'perfectionist/sort-array-includes': [
				'warn',
				{
					type: 'natural',
				},
			],
			'perfectionist/sort-classes': perf,
			'perfectionist/sort-enums': perf,
			'perfectionist/sort-exports': perf,
			'perfectionist/sort-imports': perf,
			'perfectionist/sort-interfaces': perf,
			'perfectionist/sort-intersection-types': perf,
			'perfectionist/sort-jsx-props': perf,
			'perfectionist/sort-maps': perf,
			'perfectionist/sort-named-exports': perf,
			'perfectionist/sort-named-imports': perf,
			'perfectionist/sort-object-types': perf,
			'perfectionist/sort-objects': perf,
			'perfectionist/sort-sets': perf,
			'perfectionist/sort-switch-case': perf,
			'perfectionist/sort-union-types': perf,
			'perfectionist/sort-variable-declarations': perf,
		},
	},
	{
		files: ['**/*.{js,jsx,ts,tsx}'],
		languageOptions: {
			ecmaVersion: 2022,
			globals: globals.node,
		},
		rules: {
			'@typescript-eslint/no-empty-object-type': 'off',
			'@typescript-eslint/no-explicit-any': 'off',
			'@typescript-eslint/no-unused-vars': [
				'warn',
				{
					argsIgnorePattern: '^_',
					caughtErrorsIgnorePattern: '^_',
					varsIgnorePattern: '^_',
				},
			],
			'no-else-return': 'warn',
			'no-empty': 'warn',
			'no-redeclare': 'off',
			'no-undef': 'off',
			'no-unused-vars': 'off',
			'no-useless-rename': ['warn'],
			'object-shorthand': ['warn', 'always'],
			'prefer-const': 'off',
		},
	},
	globalIgnores([
		'**/sample',
		'**/dist/',
		'**/.cache/',
		'**/.turbo/',
		'**/.next/',
		'**/node_modules/',
		'**/build/',
		'**/public/',
		'**/*.json',
		'**/playwright-report/',
		'**/server-build/',
		'**/coverage/',
		'**/*.tsbuildinfo',
		'**/.react-router/',
		'**/*generated*',
		'**/*.gen.*',
		'**/.wrangler/',
		'**/worker-configuration.d.ts',
		'**/next-env.d.ts',
	]),
)

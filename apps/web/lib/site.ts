/**
 * Central site / author configuration.
 *
 * 👉 EDIT THE THREE VALUES BELOW with your own details. Everything across the
 *    homepage, docs, footer and links is derived from here.
 */
const GITHUB_USERNAME = 'dev-tanvu'; // TODO: your GitHub username
const REPO_NAME = 'Speed-Doctor'; // TODO: your repository name
const COFFEE_URL = 'https://supportkori.com/tanviralmas'; // TODO: your Buy Me a Coffee / Ko-fi / Sponsors link

export const site = {
  name: 'Speed Doctor',
  tagline: 'Website performance, diagnosed.',

  author: {
    name: 'Tanvir Almas', // TODO: your display name
    role: 'Maintainer & creator',
    bio: 'I build open-source developer tools. Speed Doctor is a free, self-hostable website performance auditor — Lighthouse, real DOM analysis and AI root-cause explanations in one report.', // TODO: your short bio
    github: `https://github.com/${GITHUB_USERNAME}`,
    githubUser: GITHUB_USERNAME,
  },

  repo: {
    name: REPO_NAME,
    url: `https://github.com/${GITHUB_USERNAME}/${REPO_NAME}`,
    issues: `https://github.com/${GITHUB_USERNAME}/${REPO_NAME}/issues`,
    newIssue: `https://github.com/${GITHUB_USERNAME}/${REPO_NAME}/issues/new/choose`,
    stars: `https://github.com/${GITHUB_USERNAME}/${REPO_NAME}/stargazers`,
    license: 'MIT',
  },

  coffee: {
    url: COFFEE_URL,
    label: 'Buy me a coffee',
  },

  nav: [
    { label: 'Docs', href: '/docs' },
    { label: 'Why the gap?', href: '/accuracy' },
    { label: 'Contribute', href: '/contribute' },
  ],
} as const;

export type Site = typeof site;

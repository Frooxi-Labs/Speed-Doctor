import React from 'react';
import type { Metadata } from 'next';
import { DocLayout, Section, P, UL, LI, Code, Pre, Callout, Steps } from '../../components/Doc';
import { site } from '../../lib/site';

export const metadata: Metadata = {
  title: 'Contribute — Speed Doctor',
  description: 'How to contribute to Speed Doctor: setup, coding standards, and opening a pull request.',
};

export default function ContributePage() {
  return (
    <DocLayout
      eyebrow="Open source"
      title="Contribute to Speed Doctor"
      intro="Contributions of every size are welcome — bug fixes, new detectors, docs, design polish or ideas. Here's how to get set up and ship a great pull request."
    >
      <Section id="ways" title="Ways to help">
        <UL>
          <LI><strong>Report bugs</strong> or request features via <a className="text-sky-deep hover:underline" href={site.repo.newIssue} target="_blank" rel="noopener noreferrer">GitHub issues</a>.</LI>
          <LI><strong>Improve detectors</strong> — add or tune rules in <Code>packages/dom-analyzer</Code>.</LI>
          <LI><strong>Sharpen the docs</strong> or write guides.</LI>
          <LI><strong>Polish the UI</strong> and accessibility.</LI>
          <LI><strong>Triage issues</strong> and review open pull requests.</LI>
        </UL>
      </Section>

      <Section id="setup" title="Local setup">
        <P>Follow the <a className="text-sky-deep hover:underline" href="/docs">documentation</a> to get a working install, then:</P>
        <Steps>
          <>
            <P><strong>Fork</strong> the repository and clone your fork.</P>
            <Pre caption="terminal">{`git clone https://github.com/<your-fork>/${site.repo.name}.git\ncd ${site.repo.name}\npnpm install`}</Pre>
          </>
          <>
            <P><strong>Create a branch</strong> with a descriptive name.</P>
            <Pre caption="terminal">{`git checkout -b fix/oversized-image-threshold`}</Pre>
          </>
          <>
            <P><strong>Make your change</strong> and keep it focused on one thing.</P>
          </>
        </Steps>
      </Section>

      <Section id="checks" title="Before you push">
        <P>Run the same checks CI runs, so your PR goes green the first time:</P>
        <Pre caption="terminal">{`pnpm typecheck   # types must pass\npnpm build       # everything must build\npnpm lint        # keep it clean`}</Pre>
        <Callout type="tip" title="Keep PRs small">
          Smaller, single-purpose pull requests are far easier to review and merge. If you&apos;re planning a
          large change, open an issue first to discuss the approach.
        </Callout>
      </Section>

      <Section id="standards" title="Coding standards">
        <UL>
          <LI><strong>TypeScript everywhere</strong> — the repo runs in strict mode; avoid <Code>any</Code>.</LI>
          <LI><strong>Match the existing style</strong> — Prettier formats the codebase (<Code>pnpm format</Code>).</LI>
          <LI><strong>Keep packages focused</strong> — detectors, engines and the DB layer stay independent.</LI>
          <LI><strong>No secrets in code</strong> — configuration goes through environment variables only.</LI>
          <LI><strong>Clear commit messages</strong> — describe the “why”, not just the “what”.</LI>
        </UL>
      </Section>

      <Section id="pr" title="Opening the pull request">
        <Steps>
          <><P>Push your branch and open a PR against <Code>main</Code>.</P></>
          <><P>Fill in the PR template: what changed, why, and how you tested it.</P></>
          <><P>Make sure CI checks (typecheck, build, CodeQL) pass.</P></>
          <><P>Respond to review feedback — then a maintainer merges it. 🎉</P></>
        </Steps>
        <P>
          Full details live in{' '}
          <a className="text-sky-deep hover:underline" href={`${site.repo.url}/blob/main/CONTRIBUTING.md`} target="_blank" rel="noopener noreferrer">CONTRIBUTING.md</a>{' '}
          and our{' '}
          <a className="text-sky-deep hover:underline" href={`${site.repo.url}/blob/main/CODE_OF_CONDUCT.md`} target="_blank" rel="noopener noreferrer">Code of Conduct</a>.
        </P>
      </Section>

      <Section title="Say thanks">
        <P>
          Not a coder? You can still help by starring the{' '}
          <a className="text-sky-deep hover:underline" href={site.repo.url} target="_blank" rel="noopener noreferrer">repository</a>, sharing the project, or{' '}
          <a className="text-sky-deep hover:underline" href={site.coffee.url} target="_blank" rel="noopener noreferrer">buying a coffee</a>.
        </P>
      </Section>
    </DocLayout>
  );
}

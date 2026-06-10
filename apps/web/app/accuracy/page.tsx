import React from 'react';
import type { Metadata } from 'next';
import { DocLayout, Section, P, UL, LI, Callout } from '../../components/Doc';

export const metadata: Metadata = {
  title: 'Why scores differ from PageSpeed Insights — Speed Doctor',
  description: 'Why Speed Doctor performance scores can differ from Google PageSpeed Insights, and how to interpret the gap.',
};

export default function AccuracyPage() {
  return (
    <DocLayout
      eyebrow="Accuracy"
      title="Why our score won't match PageSpeed Insights"
      intro="If Speed Doctor gives a different score than Google PageSpeed Insights, that's expected — not a bug. Both run Lighthouse, but where, how and how often they run it differs. Here's exactly why the numbers diverge."
    >
      <Callout type="note" title="Short version">
        Performance scores are a <strong>lab measurement</strong>. Change the machine, the network, the
        location, the Lighthouse version, or the number of runs, and the score moves. Use Speed Doctor to
        find <em>what</em> to fix and to track your own trend — use it alongside PSI, not as a clone of it.
      </Callout>

      <Section id="hardware" title="1. Different machine and CPU speed">
        <P>
          Lighthouse&apos;s score depends heavily on CPU performance. Google runs PSI on its own
          standardised infrastructure; Speed Doctor runs on whatever server (or laptop) hosts your worker.
          A faster or slower CPU shifts metrics like Total Blocking Time and, with it, the overall score.
        </P>
      </Section>

      <Section id="location" title="2. Different network location">
        <P>
          The distance between the testing machine and your website&apos;s servers changes latency and
          download times. PSI tests from Google&apos;s data centres; your worker tests from its own region.
          That alone can move Time to First Byte and Largest Contentful Paint by hundreds of milliseconds.
        </P>
      </Section>

      <Section id="throttling" title="3. Different throttling model">
        <P>
          Speed Doctor uses Lighthouse&apos;s <strong>simulated</strong> throttling for fast, consistent
          results. PSI uses its own calibrated throttling tuned to a reference device. Different throttling
          assumptions produce different timings even for the identical page.
        </P>
      </Section>

      <Section id="versions" title="4. Different Lighthouse & Chrome versions">
        <P>
          Lighthouse changes its scoring weights and metric definitions between versions. If Speed Doctor and
          PSI are on different Lighthouse or Chrome builds, the same page can score differently purely because
          the rules changed.
        </P>
      </Section>

      <Section id="variance" title="5. Run-to-run variance & medians">
        <P>
          Lighthouse results naturally vary run to run — ads, A/B tests, lazy content and third-party scripts
          all introduce noise. To keep scores stable, Speed Doctor runs the audit multiple times and reports the
          <strong> median run</strong> (the same technique Lighthouse CI and PSI use), so one noisy pass
          can&apos;t drag your score down. Still, treat the number as a snapshot and watch the <em>trend</em>
          across audits rather than chasing a single absolute figure.
        </P>
      </Section>

      <Section id="lab-vs-field" title="6. Lab data vs. real-user (CrUX) field data">
        <P>
          PSI also shows <strong>field data</strong> from the Chrome User Experience Report — metrics from real
          visitors over the last 28 days. Speed Doctor produces <strong>lab data</strong> from a controlled
          test. These answer different questions: field data is what users felt; lab data is what you can
          reproduce and debug.
        </P>
      </Section>

      <Section id="extra" title="7. Speed Doctor adds its own analysis">
        <P>
          Beyond Lighthouse, Speed Doctor runs six DOM detectors (oversized images, render-blocking scripts,
          heavy third parties, DOM size and more) and AI root-cause correlation. These power the issue list and
          fixes — extra signal that PSI doesn&apos;t surface, but which doesn&apos;t change the Lighthouse score
          itself.
        </P>
      </Section>

      <Section title="How to use both tools well">
        <UL>
          <LI>Use <strong>PageSpeed Insights</strong> for the official Google score and real-user field data.</LI>
          <LI>Use <strong>Speed Doctor</strong> to diagnose root causes, get developer-ready fixes, and track changes over time.</LI>
          <LI>Compare <strong>like with like</strong>: same device mode, same page state, several runs.</LI>
          <LI>Focus on the <strong>issues and metrics</strong> you can act on, not a single headline number.</LI>
        </UL>
      </Section>
    </DocLayout>
  );
}

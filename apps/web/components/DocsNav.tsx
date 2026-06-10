'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

interface NavSection {
  id: string;
  title: string;
}

interface NavPage {
  href: string;
  label: string;
  sections: NavSection[];
}

const navPages: NavPage[] = [
  {
    href: '/docs',
    label: 'Documentation',
    sections: [
      { id: 'overview', title: "What's inside" },
      { id: 'prerequisites', title: 'Prerequisites' },
      { id: 'quick-start', title: 'Quick start' },
      { id: 'env', title: 'Environment variables' },
      { id: 'usage', title: 'Using the app' },
      { id: 'pipeline', title: 'How an audit works' },
      { id: 'deploy', title: 'Deployment' },
      { id: 'troubleshooting', title: 'Troubleshooting' },
    ],
  },
  {
    href: '/accuracy',
    label: 'Why the gap?',
    sections: [
      { id: 'hardware', title: '1. Different hardware' },
      { id: 'location', title: '2. Different location' },
      { id: 'throttling', title: '3. Different throttling' },
      { id: 'versions', title: '4. Different versions' },
      { id: 'variance', title: '5. Single run vs. medians' },
      { id: 'lab-vs-field', title: '6. Lab vs. field data' },
      { id: 'extra', title: '7. Extra analysis' },
    ],
  },
  {
    href: '/contribute',
    label: 'Contribute',
    sections: [
      { id: 'ways', title: 'Ways to help' },
      { id: 'setup', title: 'Local setup' },
      { id: 'checks', title: 'Before you push' },
      { id: 'standards', title: 'Coding standards' },
      { id: 'pr', title: 'Opening the PR' },
    ],
  },
];

export default function DocsNav() {
  const pathname = usePathname();
  const [activeSection, setActiveSection] = useState<string | null>(null);
  const [isExpanded, setIsExpanded] = useState(true);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    // Load saved state from localStorage
    const saved = localStorage.getItem('docs-nav-expanded');
    if (saved !== null) {
      setIsExpanded(JSON.parse(saved));
    }
  }, []);

  useEffect(() => {
    if (!mounted) return;
    // Save state to localStorage
    localStorage.setItem('docs-nav-expanded', JSON.stringify(isExpanded));
  }, [isExpanded, mounted]);

  useEffect(() => {
    // Set up Intersection Observer to track visible sections
    const sections = navPages.flatMap((page) => page.sections.map((s) => s.id));
    
    const observerOptions = {
      root: null,
      rootMargin: '-100px 0px -66%',
      threshold: 0,
    };

    const observerCallback = (entries: IntersectionObserverEntry[]) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          setActiveSection(entry.target.id);
        }
      });
    };

    const observer = new IntersectionObserver(observerCallback, observerOptions);

    sections.forEach((sectionId) => {
      const element = document.getElementById(sectionId);
      if (element) {
        observer.observe(element);
      }
    });

    return () => {
      sections.forEach((sectionId) => {
        const element = document.getElementById(sectionId);
        if (element) {
          observer.unobserve(element);
        }
      });
    };
  }, [pathname]);

  const currentPage = navPages.find((page) => page.href === pathname);
  const isActive = (href: string) => pathname === href;

  if (!mounted) return null;

  return (
    <>
      {/* Sidebar */}
      <aside
        className={`sticky top-16 left-0 h-[calc(100vh-4rem)] w-64 border-r border-ink/10 bg-paper-warm pt-6 pb-6 hidden lg:flex flex-col transition-all duration-300 ease-out overflow-hidden ${
          isExpanded ? 'w-64' : 'w-0'
        }`}
      >
        {/* Toggle button in top-right corner */}
        <div className="absolute top-4 right-4 z-40">
          <button
            onClick={() => setIsExpanded(false)}
            className="flex items-center justify-center h-8 w-8 rounded-lg bg-ink/5 hover:bg-ink text-ink hover:text-paper border border-ink/10 transition-all"
            aria-label="Collapse sidebar"
            title="Collapse sidebar"
          >
            <svg
              className="h-4 w-4"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M15 18l-6-6 6-6" />
            </svg>
          </button>
        </div>

        <nav className="px-6 py-8 space-y-8 flex-1 overflow-y-auto">
          {/* All pages */}
          <div>
            <span className="font-mono text-[10px] uppercase tracking-widest text-ink-faint block mb-4">
              Pages
            </span>
            <div className="space-y-1">
              {navPages.map((page) => (
                <Link
                  key={page.href}
                  href={page.href}
                  className={`block px-3 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${
                    isActive(page.href)
                      ? 'bg-ink text-paper'
                      : 'text-ink-soft hover:bg-paper hover:text-ink'
                    }`}
                >
                  {page.label}
                </Link>
              ))}
            </div>
          </div>

          {/* Current page sections */}
          {currentPage && (
            <div>
              <span className="font-mono text-[10px] uppercase tracking-widest text-ink-faint block mb-4">
                On this page
              </span>
              <div className="space-y-1">
                {currentPage.sections.map((section) => (
                  <a
                    key={section.id}
                    href={`#${section.id}`}
                    className={`block px-3 py-2 rounded-lg text-sm transition-all duration-200 whitespace-nowrap ${
                      activeSection === section.id
                        ? 'bg-coral text-ink font-semibold shadow-sm'
                        : 'text-ink-soft hover:text-ink hover:bg-paper'
                    }`}
                  >
                    {section.title}
                  </a>
                ))}
              </div>
            </div>
          )}
        </nav>
      </aside>

      {/* Expand button when collapsed */}
      {!isExpanded && (
        <button
          onClick={() => setIsExpanded(true)}
          className="fixed top-20 left-4 z-20 hidden lg:flex items-center justify-center h-9 w-9 rounded-lg bg-ink text-paper border border-ink/10 hover:bg-coral hover:text-ink transition-all shadow-md"
          aria-label="Expand sidebar"
          title="Expand sidebar"
        >
          <svg
            className="h-4 w-4"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M9 18l6-6-6-6" />
          </svg>
        </button>
      )}
    </>
  );
}

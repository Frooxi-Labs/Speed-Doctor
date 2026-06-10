import React from 'react';
import { type ScanDevice } from '@speed-doctor/shared-types';

interface DeviceTabsProps {
  active: ScanDevice;
  available: ScanDevice[];
  onChange: (device: ScanDevice) => void;
}

function MobileIcon() {
  return (
    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <rect x="7" y="3" width="10" height="18" rx="2.5" strokeLinejoin="round" />
      <path d="M11 18h2" strokeLinecap="round" />
    </svg>
  );
}

function DesktopIcon() {
  return (
    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <rect x="3" y="4" width="18" height="12" rx="2" strokeLinejoin="round" />
      <path d="M9 20h6M12 16v4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

const META: Record<ScanDevice, { label: string; Icon: React.FC }> = {
  mobile: { label: 'Mobile', Icon: MobileIcon },
  desktop: { label: 'Desktop', Icon: DesktopIcon },
};

export default function DeviceTabs({ active, available, onChange }: DeviceTabsProps) {
  if (available.length < 2) return null;

  return (
    <div className="inline-flex select-none rounded-full border border-ink/10 bg-paper-pure p-1 shadow-card">
      {available.map((device) => {
        const { label, Icon } = META[device];
        const isActive = active === device;
        return (
          <button
            key={device}
            onClick={() => onChange(device)}
            className={`flex items-center gap-2 rounded-full px-5 py-2 text-sm font-semibold tracking-tight transition-all ${
              isActive ? 'bg-ink text-paper shadow-card' : 'text-ink-soft hover:text-ink'
            }`}
          >
            <Icon />
            {label}
          </button>
        );
      })}
    </div>
  );
}

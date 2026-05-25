'use client';

import { AppShell } from '@/components/shell/AppShell';
import { CommandPalette } from '@/components/shell/CommandPalette';
import { DetailDrawer } from '@/components/shell/DetailDrawer';
import { WorkspaceProvider } from '@/lib/WorkspaceContext';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <WorkspaceProvider>
      <AppShell>{children}</AppShell>
      <DetailDrawer />
      <CommandPalette />
    </WorkspaceProvider>
  );
}

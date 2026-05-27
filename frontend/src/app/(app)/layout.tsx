'use client';

import { AppShell } from '@/components/shell/AppShell';
import { CommandPalette } from '@/components/shell/CommandPalette';
import { DetailDrawer } from '@/components/shell/DetailDrawer';
import { WorkspaceProvider } from '@/lib/WorkspaceContext';
import ProtectedRoute from '@/components/ProtectedRoute';
import { LivingSystemProvider } from '@/context/LivingSystemContext';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <ProtectedRoute>
      <WorkspaceProvider>
        <LivingSystemProvider>
          <AppShell>{children}</AppShell>
          <DetailDrawer />
          <CommandPalette />
        </LivingSystemProvider>
      </WorkspaceProvider>
    </ProtectedRoute>
  );
}

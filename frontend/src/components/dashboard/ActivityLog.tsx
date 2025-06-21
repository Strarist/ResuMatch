import React from 'react';
import type { ReactElement } from 'react';
import { DocumentTextIcon, BriefcaseIcon, ChartBarIcon } from '@heroicons/react/24/outline';

interface Activity {
  id: string;
  type: string;
  title: string;
  description: string;
  date: string;
}

interface ActivityLogProps {
  activities: Activity[];
}

const iconMap: Record<string, ReactElement> = {
  resume_upload: <DocumentTextIcon className="h-5 w-5" />,
  job_match: <BriefcaseIcon className="h-5 w-5" />,
  analysis: <ChartBarIcon className="h-5 w-5" />,
};

export default function ActivityLog({ activities }: ActivityLogProps) {
  if (!activities?.length) return <div className="text-gray-400 text-center py-8">No recent activity</div>;
  return (
    <ol className="relative border-l border-gray-200 dark:border-gray-700">
      {activities.map((a: Activity, i: number) => (
        <li key={a.id} className="mb-10 ml-6">
          <span className="absolute flex items-center justify-center w-8 h-8 bg-blue-100 rounded-full -left-4 ring-8 ring-white dark:ring-gray-900">
            {iconMap[a.type] || <ChartBarIcon className="h-5 w-5" />}
          </span>
          <h3 className="font-semibold text-gray-900 dark:text-white">{a.title}</h3>
          <p className="text-sm text-gray-500 dark:text-gray-300">{a.description}</p>
          <time className="block text-xs text-gray-400">{a.date}</time>
        </li>
      ))}
    </ol>
  );
} 
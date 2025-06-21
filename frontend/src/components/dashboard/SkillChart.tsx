import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip } from 'recharts';

interface SkillChartData {
  skill: string;
  count: number;
}

interface SkillChartProps {
  data: SkillChartData[];
  loading?: boolean;
}

export default function SkillChart({ data, loading = false }: SkillChartProps) {
  if (loading) return <div className="h-48 flex items-center justify-center">Loading...</div>;
  if (!data?.length) return <div className="h-48 flex items-center justify-center text-gray-400">No skill data</div>;
  return (
    <ResponsiveContainer width="100%" height={200}>
      <BarChart data={data}>
        <XAxis dataKey="skill" stroke="#8884d8" />
        <YAxis />
        <Tooltip />
        <Bar dataKey="count" fill="#6366f1" radius={[8, 8, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
} 
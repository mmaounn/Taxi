"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { formatEur, formatEurShort } from "@/lib/format";

interface WeeklyRevenue {
  week: string;
  bolt: number;
  uber: number;
  freenow: number;
}

export function RevenueChart({ data }: { data: WeeklyRevenue[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm">Wöchentlicher Umsatz nach Plattform</CardTitle>
      </CardHeader>
      <CardContent>
        {data.length === 0 ? (
          <div className="flex h-64 items-center justify-center text-gray-500">
            Noch keine Umsatzdaten vorhanden
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="week" fontSize={12} />
              <YAxis fontSize={12} tickFormatter={(v) => formatEurShort(v)} />
              <Tooltip
                formatter={(value) => formatEur(Number(value))}
              />
              <Legend />
              <Bar dataKey="bolt" fill="#22c55e" name="Bolt" />
              <Bar dataKey="uber" fill="#000000" name="Uber" />
              <Bar dataKey="freenow" fill="#ef4444" name="FreeNow" />
            </BarChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}

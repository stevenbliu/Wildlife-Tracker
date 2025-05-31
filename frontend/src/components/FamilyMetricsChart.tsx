import React from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';

type Family = { label: string; value: number };
type Props = {
  normalizedData: any[];
  selectedFamilies: Family[];
  colorMap: { [key: number]: string };
  metrics: string[];
};

export const FamilyMetricsChart: React.FC<Props> = ({
  normalizedData,
  selectedFamilies,
  colorMap,
  metrics,
}) => (
  <footer className="app-footer">
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={normalizedData} margin={{ top: 10, right: 40, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis
          dataKey="time_bucket"
          tickFormatter={(t) => new Date(t).toLocaleTimeString()}
        />
        <YAxis />
        <Tooltip labelFormatter={(label: string | number | Date) => new Date(label).toLocaleString()} />
        <Legend
          layout="vertical"
          align="left"
          verticalAlign="middle"
          wrapperStyle={{
            lineHeight: '24px',
          }}
          content={({ payload }) => (
            <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
              {payload?.map((entry, index) => (
                <li
                  key={`legend-${index}`}
                  style={{ display: 'flex', alignItems: 'center', marginBottom: 6 }}
                >
                  <svg width="30" height="10" style={{ marginRight: 8 }}>
                    <line
                      x1={0}
                      y1={5}
                      x2={30}
                      y2={5}
                      stroke={entry.color}
                      strokeWidth={2}
                      strokeDasharray={entry.payload.strokeDasharray || '0'}
                    />
                  </svg>
                  <span>{entry.value}</span>
                </li>
              ))}
            </ul>
          )}
        />

        {selectedFamilies.map((fam) => {
          const baseColor = colorMap[fam.value];

          return (
            <React.Fragment key={fam.value}>
              {metrics.includes('size') && (
                <Line
                  key={`${fam.value}-size`}
                  type="monotone"
                  dataKey={`avg_size_${fam.value}`}
                  name={`${fam.label} (Size)`}
                  stroke={baseColor}
                  strokeWidth={2}
                  dot={false}
                />
              )}
              {metrics.includes('health') && (
                <Line
                  key={`${fam.value}-health`}
                  type="monotone"
                  dataKey={`avg_health_${fam.value}`}
                  name={`${fam.label} (Health)`}
                  stroke={baseColor}
                  strokeDasharray="5 5"
                  strokeWidth={2}
                  dot={false}
                />
              )}
            </React.Fragment>
          );
        })}
      </LineChart>
    </ResponsiveContainer>
  </footer>
);
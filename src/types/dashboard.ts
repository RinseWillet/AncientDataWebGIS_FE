export interface TypeCount {
  type: string;
  count: number;
}

export interface TypeLength {
  type: string;
  lengthKm: number;
}

export interface MetricSummary {
  total: number;
  byType: TypeCount[];
}

export interface RoadMetric {
  total: number;
  byType: TypeCount[];
  lengthKmTotal: number;
  lengthKmByType: TypeLength[];
}

export interface DashboardSummary {
  schemaVersion: number;
  generatedAt: string; // ISO-8601
  sites: MetricSummary;
  roads: RoadMetric;
}


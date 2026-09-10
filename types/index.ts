export interface User {
  id: string;
  email: string;
  name: string;
  avatar_url?: string;
  subscription_status: 'active' | 'inactive' | 'cancelled';
  subscription_plan: 'starter' | 'professional' | 'enterprise';
  stripe_customer_id?: string;
  stripe_subscription_id?: string;
  created_at: string;
  updated_at: string;
}

export interface Event {
  id: string;
  user_id: string;
  event_type: 'bug' | 'security';
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  description: string;
  stack_trace?: string;
  source_file?: string;
  line_number?: number;
  metadata?: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface IngestPayload {
  type: 'bug' | 'security';
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  description: string;
  stackTrace?: string;
  sourceFile?: string;
  lineNumber?: number;
  timestamp?: string;
  metadata?: Record<string, unknown>;
}

export interface EventStats {
  totalEvents: number;
  bugCount: number;
  securityCount: number;
  criticalCount: number;
  highCount: number;
}

export interface TimeSeriesStats {
  date: string;
  count: number;
  eventType: 'bug' | 'security';
  severity: 'low' | 'medium' | 'high' | 'critical';
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  timestamp: string;
}

export interface CheckoutSession {
  sessionId: string;
  url: string | null;
}

export interface IngestResponse {
  eventId: string;
  timestamp: string;
}

export interface Subscription {
  id: string;
  user_id: string;
  plan: 'starter' | 'professional' | 'enterprise';
  status: 'active' | 'cancelled' | 'expired';
  stripe_subscription_id: string;
  stripe_customer_id: string;
  current_period_start: string;
  current_period_end: string;
  cancel_at?: string;
  created_at: string;
  updated_at: string;
}

export interface WebhookEvent {
  id: string;
  type: string;
  data: Record<string, unknown>;
  timestamp: string;
  processed: boolean;
}

export interface PaginationParams {
  page?: number;
  limit?: number;
  sort?: string;
  order?: 'asc' | 'desc';
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface EventFilters {
  type?: 'bug' | 'security' | 'all';
  severity?: 'low' | 'medium' | 'high' | 'critical' | 'all';
  startDate?: string;
  endDate?: string;
  sourceFile?: string;
  search?: string;
}

export interface Auth0Session {
  user: {
    sub: string;
    email: string;
    name: string;
    picture?: string;
    updated_at: string;
  };
}

export interface PulseGuardError {
  code: string;
  message: string;
  statusCode: number;
  details?: Record<string, unknown>;
}

export interface DashboardData {
  stats: EventStats;
  recentEvents: Event[];
  topSources: { source: string; count: number }[];
  severityTrend: TimeSeriesStats[];
}

export interface UserSettings {
  user_id: string;
  email_notifications: boolean;
  critical_alerts: boolean;
  daily_digest: boolean;
  api_key: string;
  timezone: string;
  created_at: string;
  updated_at: string;
}

export interface Integration {
  id: string;
  user_id: string;
  type: 'slack' | 'webhook' | 'email' | 'custom';
  name: string;
  config: Record<string, unknown>;
  active: boolean;
  created_at: string;
  updated_at: string;
}

export interface UsageMetrics {
  user_id: string;
  period_start: string;
  period_end: string;
  events_received: number;
  events_processed: number;
  api_calls: number;
  emails_sent: number;
  storage_used: number;
}

export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH' | 'OPTIONS';

export interface HttpRequest {
  method: HttpMethod;
  path: string;
  headers: Record<string, string>;
  body?: unknown;
}

export interface HttpResponse {
  status: number;
  headers: Record<string, string>;
  body: unknown;
}

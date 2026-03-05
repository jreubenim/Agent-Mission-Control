/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type SegmentType = 'DOMESTIC' | 'OVERSEAS' | 'MARITIME' | 'SPACE';

export interface NetworkNode {
  id: string;
  name: string;
  type: SegmentType;
  status: 'ONLINE' | 'OFFLINE' | 'DEGRADED' | 'SURGE';
  location: { lat: number; lng: number };
  telemetry: {
    signalStrength: number;
    latency: number;
    bandwidth: number;
    cpuLoad: number;
  };
  alarmActive?: boolean;
  powerRouting?: string;
}

export interface Agent {
  id: string;
  name: string;
  role: string;
  status: 'IDLE' | 'ACTIVE' | 'ERROR' | 'DEPLOYING';
  hierarchyLevel: number;
  parentId?: string;
  embodiment?: string;
  tasks: string[];
}

export interface SigintEvent {
  id: string;
  timestamp: string;
  frequency: string;
  location: { lat: number; lng: number };
  confidence: number;
  type: 'EMISSION' | 'INTERCEPT' | 'GEOLOCATION';
}

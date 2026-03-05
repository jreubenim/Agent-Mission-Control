/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { NetworkNode, Agent, SegmentType } from './types';

export const SEGMENTS: SegmentType[] = ['DOMESTIC', 'OVERSEAS', 'MARITIME', 'SPACE'];

export const INITIAL_NODES: NetworkNode[] = [
  // DOMESTIC — Core Western Europe (~8 nodes)
  { id: 'D-CC-01', name: 'London Central Control', type: 'DOMESTIC', status: 'ONLINE', location: { lat: 51.5074, lng: -0.1278 }, telemetry: { signalStrength: 98, latency: 2, bandwidth: 1000, cpuLoad: 42 } },
  { id: 'D-CC-02', name: 'Paris Operations Hub', type: 'DOMESTIC', status: 'ONLINE', location: { lat: 48.8566, lng: 2.3522 }, telemetry: { signalStrength: 97, latency: 3, bandwidth: 950, cpuLoad: 38 } },
  { id: 'D-ST-01', name: 'Berlin Relay Station', type: 'DOMESTIC', status: 'ONLINE', location: { lat: 52.5200, lng: 13.4050 }, telemetry: { signalStrength: 96, latency: 4, bandwidth: 900, cpuLoad: 35 } },
  { id: 'D-ST-02', name: 'Brussels Command Node', type: 'DOMESTIC', status: 'ONLINE', location: { lat: 50.8503, lng: 4.3517 }, telemetry: { signalStrength: 95, latency: 3, bandwidth: 850, cpuLoad: 30 } },
  { id: 'D-ST-03', name: 'Amsterdam Data Center', type: 'DOMESTIC', status: 'ONLINE', location: { lat: 52.3676, lng: 4.9041 }, telemetry: { signalStrength: 96, latency: 4, bandwidth: 920, cpuLoad: 44 } },
  { id: 'D-ST-04', name: 'Frankfurt Uplink', type: 'DOMESTIC', status: 'SURGE', location: { lat: 50.1109, lng: 8.6821 }, telemetry: { signalStrength: 94, latency: 5, bandwidth: 880, cpuLoad: 62 } },
  { id: 'D-ST-05', name: 'Munich Ground Station', type: 'DOMESTIC', status: 'ONLINE', location: { lat: 48.1351, lng: 11.5820 }, telemetry: { signalStrength: 93, latency: 6, bandwidth: 800, cpuLoad: 28 } },
  { id: 'D-ST-06', name: 'Rome Tactical Node', type: 'DOMESTIC', status: 'ONLINE', location: { lat: 41.9028, lng: 12.4964 }, telemetry: { signalStrength: 92, latency: 7, bandwidth: 750, cpuLoad: 33 } },

  // OVERSEAS — Extended European Reach (~6 nodes)
  { id: 'O-ST-01', name: 'Madrid Forward Base', type: 'OVERSEAS', status: 'ONLINE', location: { lat: 40.4168, lng: -3.7038 }, telemetry: { signalStrength: 88, latency: 10, bandwidth: 400, cpuLoad: 36 } },
  { id: 'O-ST-02', name: 'Warsaw Eastern Post', type: 'OVERSEAS', status: 'DEGRADED', location: { lat: 52.2297, lng: 21.0122 }, telemetry: { signalStrength: 82, latency: 14, bandwidth: 300, cpuLoad: 48 } },
  { id: 'O-ST-03', name: 'Bucharest Outpost', type: 'OVERSEAS', status: 'ONLINE', location: { lat: 44.4268, lng: 26.1025 }, telemetry: { signalStrength: 80, latency: 16, bandwidth: 250, cpuLoad: 41 } },
  { id: 'O-ST-04', name: 'Stockholm Nordic Relay', type: 'OVERSEAS', status: 'ONLINE', location: { lat: 59.3293, lng: 18.0686 }, telemetry: { signalStrength: 86, latency: 12, bandwidth: 350, cpuLoad: 29 } },
  { id: 'O-ST-05', name: 'Athens Mediterranean Post', type: 'OVERSEAS', status: 'OFFLINE', location: { lat: 37.9838, lng: 23.7275 }, telemetry: { signalStrength: 0, latency: 0, bandwidth: 0, cpuLoad: 0 } },
  { id: 'O-ST-06', name: 'Istanbul Gateway', type: 'OVERSEAS', status: 'SURGE', location: { lat: 41.0082, lng: 28.9784 }, telemetry: { signalStrength: 84, latency: 18, bandwidth: 280, cpuLoad: 58 } },

  // MARITIME — Sea Corridors (~6 nodes)
  { id: 'M-SH-01', name: 'North Sea Patrol', type: 'MARITIME', status: 'ONLINE', location: { lat: 56.0, lng: 3.0 }, telemetry: { signalStrength: 78, latency: 22, bandwidth: 150, cpuLoad: 52 } },
  { id: 'M-SH-02', name: 'Mediterranean Sentinel', type: 'MARITIME', status: 'ONLINE', location: { lat: 38.0, lng: 15.0 }, telemetry: { signalStrength: 76, latency: 25, bandwidth: 120, cpuLoad: 48 } },
  { id: 'M-SH-03', name: 'Baltic Guardian', type: 'MARITIME', status: 'DEGRADED', location: { lat: 57.5, lng: 19.5 }, telemetry: { signalStrength: 72, latency: 28, bandwidth: 100, cpuLoad: 55 } },
  { id: 'M-SH-04', name: 'English Channel Watch', type: 'MARITIME', status: 'ONLINE', location: { lat: 50.2, lng: 0.5 }, telemetry: { signalStrength: 85, latency: 15, bandwidth: 180, cpuLoad: 38 } },
  { id: 'M-SH-05', name: 'Adriatic Monitor', type: 'MARITIME', status: 'ONLINE', location: { lat: 42.5, lng: 16.0 }, telemetry: { signalStrength: 74, latency: 24, bandwidth: 110, cpuLoad: 44 } },
  { id: 'M-SH-06', name: 'Norwegian Sea Tracker', type: 'MARITIME', status: 'ONLINE', location: { lat: 64.0, lng: 5.0 }, telemetry: { signalStrength: 70, latency: 30, bandwidth: 90, cpuLoad: 50 } },

  // SPACE — Satellite & High-Altitude (~5 nodes)
  { id: 'S-SA-01', name: 'GEO-EUR-1 Geostationary', type: 'SPACE', status: 'ONLINE', location: { lat: 47.0, lng: 10.0 }, telemetry: { signalStrength: 99, latency: 240, bandwidth: 2000, cpuLoad: 12 } },
  { id: 'S-SA-02', name: 'GEO-EUR-2 Geostationary', type: 'SPACE', status: 'ONLINE', location: { lat: 45.0, lng: -5.0 }, telemetry: { signalStrength: 98, latency: 245, bandwidth: 1800, cpuLoad: 15 } },
  { id: 'S-SA-03', name: 'Polar Relay Alpha', type: 'SPACE', status: 'ONLINE', location: { lat: 70.0, lng: 25.0 }, telemetry: { signalStrength: 94, latency: 260, bandwidth: 1200, cpuLoad: 18 } },
  { id: 'S-SA-04', name: 'Azores Uplink Station', type: 'SPACE', status: 'ONLINE', location: { lat: 38.7, lng: -27.2 }, telemetry: { signalStrength: 96, latency: 250, bandwidth: 1500, cpuLoad: 10 } },
  { id: 'S-SA-05', name: 'Svalbard Arctic Ground', type: 'SPACE', status: 'DEGRADED', location: { lat: 78.2, lng: 15.6 }, telemetry: { signalStrength: 88, latency: 270, bandwidth: 800, cpuLoad: 22 } },
];

export const INITIAL_AGENTS: Agent[] = [
  { id: 'A-ORCH-01', name: 'G-TT&C Orchestrator', role: 'Global Mission Control', status: 'ACTIVE', hierarchyLevel: 0, tasks: ['Mission Synchronization', 'Resource Allocation', 'Segment Cueing'] },

  { id: 'A-SEG-01', name: 'Domestic Ground Agent', role: 'Segment Controller', status: 'ACTIVE', hierarchyLevel: 1, parentId: 'A-ORCH-01', tasks: ['Surge Capacity Management', 'High-Tempo Ops'] },
  { id: 'A-SEG-02', name: 'Overseas Reach Agent', role: 'Segment Controller', status: 'ACTIVE', hierarchyLevel: 1, parentId: 'A-ORCH-01', tasks: ['Line-of-Sight Coverage', 'Third-Party Service Reduction'] },
  { id: 'A-SEG-03', name: 'Maritime Corridor Agent', role: 'Segment Controller', status: 'ACTIVE', hierarchyLevel: 1, parentId: 'A-ORCH-01', tasks: ['Ocean Corridor Positioning', 'Launch Window Support'] },
  { id: 'A-SEG-04', name: 'Space Awareness Agent', role: 'Segment Controller', status: 'ACTIVE', hierarchyLevel: 1, parentId: 'A-ORCH-01', tasks: ['Relay Monitoring', 'Resilience Management'] },

  { id: 'A-NODE-01', name: 'London Core Agent', role: 'Node Controller', status: 'ACTIVE', hierarchyLevel: 2, parentId: 'A-SEG-01', embodiment: 'D-CC-01', tasks: ['Telemetry Processing', 'Command Uplink'] },
  { id: 'A-NODE-02', name: 'North Sea Tactical Agent', role: 'Node Controller', status: 'ACTIVE', hierarchyLevel: 2, parentId: 'A-SEG-03', embodiment: 'M-SH-01', tasks: ['Mobile Tracking', 'Signal Intercept'] },
  { id: 'A-NODE-03', name: 'GEO-EUR Relay Agent', role: 'Node Controller', status: 'ACTIVE', hierarchyLevel: 2, parentId: 'A-SEG-04', embodiment: 'S-SA-01', tasks: ['Data Relay', 'Persistent Collection'] },
];

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { NetworkNode, Agent, SegmentType } from './types';

export const SEGMENTS: SegmentType[] = ['DOMESTIC', 'OVERSEAS', 'MARITIME', 'SPACE'];

export const INITIAL_NODES: NetworkNode[] = [
  // Domestic Ground (Edinburgh City & Immediate Surroundings)
  { id: 'D-CC-01', name: 'Edinburgh Central Control', type: 'DOMESTIC', status: 'ONLINE', location: { lat: 55.9533, lng: -3.1883 }, telemetry: { signalStrength: 98, latency: 2, bandwidth: 1000, cpuLoad: 42 } },
  { id: 'D-CC-02', name: 'Leith Operations Hub', type: 'DOMESTIC', status: 'ONLINE', location: { lat: 55.9790, lng: -3.1720 }, telemetry: { signalStrength: 96, latency: 4, bandwidth: 800, cpuLoad: 35 } },
  { id: 'D-ST-01', name: 'Portobello Relay', type: 'DOMESTIC', status: 'ONLINE', location: { lat: 55.9510, lng: -3.1110 }, telemetry: { signalStrength: 94, latency: 6, bandwidth: 500, cpuLoad: 28 } },
  { id: 'D-ST-02', name: 'Morningside Node', type: 'DOMESTIC', status: 'ONLINE', location: { lat: 55.9230, lng: -3.2120 }, telemetry: { signalStrength: 95, latency: 5, bandwidth: 500, cpuLoad: 24 } },
  { id: 'D-ST-03', name: 'Corstorphine Uplink', type: 'DOMESTIC', status: 'ONLINE', location: { lat: 55.9410, lng: -3.2830 }, telemetry: { signalStrength: 93, latency: 7, bandwidth: 500, cpuLoad: 31 } },

  // Overseas (Nearby Lothian & Fife Regions)
  { id: 'O-ST-01', name: 'Livingston Reach', type: 'OVERSEAS', status: 'DEGRADED', location: { lat: 55.8830, lng: -3.5150 }, telemetry: { signalStrength: 82, latency: 12, bandwidth: 200, cpuLoad: 45 } },
  { id: 'O-ST-02', name: 'Dunfermline Facility', type: 'OVERSEAS', status: 'OFFLINE', location: { lat: 56.0710, lng: -3.4520 }, telemetry: { signalStrength: 0, latency: 0, bandwidth: 0, cpuLoad: 0 } },
  { id: 'O-ST-03', name: 'Musselburgh Station', type: 'OVERSEAS', status: 'SURGE', location: { lat: 55.9430, lng: -3.0520 }, telemetry: { signalStrength: 90, latency: 8, bandwidth: 400, cpuLoad: 55 } },
  { id: 'O-ST-04', name: 'Queensferry Node', type: 'OVERSEAS', status: 'ONLINE', location: { lat: 55.9890, lng: -3.3940 }, telemetry: { signalStrength: 88, latency: 10, bandwidth: 200, cpuLoad: 32 } },

  // Maritime (Firth of Forth & Coastal)
  { id: 'M-SH-01', name: 'Forth Guardian (Vessel)', type: 'MARITIME', status: 'ONLINE', location: { lat: 56.0200, lng: -3.1500 }, telemetry: { signalStrength: 85, latency: 15, bandwidth: 150, cpuLoad: 48 } },
  { id: 'M-SH-02', name: 'North Sea Tracker', type: 'MARITIME', status: 'ONLINE', location: { lat: 56.1500, lng: -2.8000 }, telemetry: { signalStrength: 78, latency: 22, bandwidth: 100, cpuLoad: 52 } },
  { id: 'M-SH-03', name: 'Coastal Sentinel', type: 'MARITIME', status: 'ONLINE', location: { lat: 55.9300, lng: -2.5000 }, telemetry: { signalStrength: 81, latency: 18, bandwidth: 120, cpuLoad: 44 } },

  // Space (Pentland Hills & High-Altitude)
  { id: 'S-SA-01', name: 'Pentland Relay Alpha', type: 'SPACE', status: 'ONLINE', location: { lat: 55.8600, lng: -3.3000 }, telemetry: { signalStrength: 99, latency: 25, bandwidth: 1000, cpuLoad: 12 } },
  { id: 'S-SA-02', name: 'Arthur\'s Seat Uplink', type: 'SPACE', status: 'ONLINE', location: { lat: 55.9440, lng: -3.1620 }, telemetry: { signalStrength: 97, latency: 20, bandwidth: 1000, cpuLoad: 15 } },
];

export const INITIAL_AGENTS: Agent[] = [
  { id: 'A-ORCH-01', name: 'G-TT&C Orchestrator', role: 'Global Mission Control', status: 'ACTIVE', hierarchyLevel: 0, tasks: ['Mission Synchronization', 'Resource Allocation', 'Segment Cueing'] },
  
  { id: 'A-SEG-01', name: 'Domestic Ground Agent', role: 'Segment Controller', status: 'ACTIVE', hierarchyLevel: 1, parentId: 'A-ORCH-01', tasks: ['Surge Capacity Management', 'High-Tempo Ops'] },
  { id: 'A-SEG-02', name: 'Overseas Reach Agent', role: 'Segment Controller', status: 'ACTIVE', hierarchyLevel: 1, parentId: 'A-ORCH-01', tasks: ['Line-of-Sight Coverage', 'Third-Party Service Reduction'] },
  { id: 'A-SEG-03', name: 'Maritime Corridor Agent', role: 'Segment Controller', status: 'ACTIVE', hierarchyLevel: 1, parentId: 'A-ORCH-01', tasks: ['Ocean Corridor Positioning', 'Launch Window Support'] },
  { id: 'A-SEG-04', name: 'Space Awareness Agent', role: 'Segment Controller', status: 'ACTIVE', hierarchyLevel: 1, parentId: 'A-ORCH-01', tasks: ['Relay Monitoring', 'Resilience Management'] },

  { id: 'A-NODE-01', name: 'Beijing Core Agent', role: 'Node Controller', status: 'ACTIVE', hierarchyLevel: 2, parentId: 'A-SEG-01', embodiment: 'D-CC-01', tasks: ['Telemetry Processing', 'Command Uplink'] },
  { id: 'A-NODE-02', name: 'YW-5 Tactical Agent', role: 'Node Controller', status: 'ACTIVE', hierarchyLevel: 2, parentId: 'A-SEG-03', embodiment: 'M-SH-01', tasks: ['Mobile Tracking', 'Signal Intercept'] },
  { id: 'A-NODE-03', name: 'TL-1 Relay Agent', role: 'Node Controller', status: 'ACTIVE', hierarchyLevel: 2, parentId: 'A-SEG-04', embodiment: 'S-SA-01', tasks: ['Data Relay', 'Persistent Collection'] },
];

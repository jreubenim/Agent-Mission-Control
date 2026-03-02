/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';
import { NetworkNode, SegmentType } from '../types';

interface NetworkMapProps {
  nodes: NetworkNode[];
  activeSegment: SegmentType | 'AGENTS' | 'SIGINT';
}

export const NetworkMap: React.FC<NetworkMapProps> = ({ nodes, activeSegment }) => {
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (!svgRef.current) return;

    const width = svgRef.current.clientWidth;
    const height = svgRef.current.clientHeight;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    const simulation = d3.forceSimulation(nodes as any)
      .force('link', d3.forceLink().id((d: any) => d.id).distance(150))
      .force('charge', d3.forceManyBody().strength(-300))
      .force('center', d3.forceCenter(width / 2, height / 2))
      .force('collision', d3.forceCollide().radius(50));

    // Create links (connecting nodes of the same segment or to control centers)
    const links: any[] = [];
    nodes.forEach((node, i) => {
      nodes.slice(i + 1).forEach(other => {
        if (node.type === other.type || node.id.includes('CC') || other.id.includes('CC')) {
          links.push({ source: node.id, target: other.id });
        }
      });
    });

    const link = svg.append('g')
      .attr('stroke', '#1e1e24')
      .attr('stroke-opacity', 0.6)
      .selectAll('line')
      .data(links)
      .join('line')
      .attr('stroke-width', 1);

    const node = svg.append('g')
      .selectAll('g')
      .data(nodes)
      .join('g')
      .call(d3.drag<SVGGElement, any>()
        .on('start', (event, d) => {
          if (!event.active) simulation.alphaTarget(0.3).restart();
          d.fx = d.x;
          d.fy = d.y;
        })
        .on('drag', (event, d) => {
          d.fx = event.x;
          d.fy = event.y;
        })
        .on('end', (event, d) => {
          if (!event.active) simulation.alphaTarget(0);
          d.fx = null;
          d.fy = null;
        }));

    node.append('circle')
      .attr('r', (d: any) => d.id.includes('CC') ? 12 : 8)
      .attr('fill', (d: any) => {
        if (d.type === activeSegment) return '#10b981';
        if (d.type === 'DOMESTIC') return '#3b82f6';
        if (d.type === 'OVERSEAS') return '#8b5cf6';
        if (d.type === 'MARITIME') return '#f59e0b';
        if (d.type === 'SPACE') return '#ec4899';
        return '#4b5563';
      })
      .attr('stroke', '#0a0a0c')
      .attr('stroke-width', 2)
      .attr('class', 'transition-all duration-300');

    node.append('text')
      .text((d: any) => d.name)
      .attr('x', 14)
      .attr('y', 4)
      .attr('fill', '#9ca3af')
      .attr('font-size', '10px')
      .attr('font-family', 'monospace')
      .attr('pointer-events', 'none');

    simulation.on('tick', () => {
      link
        .attr('x1', (d: any) => d.source.x)
        .attr('y1', (d: any) => d.source.y)
        .attr('x2', (d: any) => d.target.x)
        .attr('y2', (d: any) => d.target.y);

      node
        .attr('transform', (d: any) => `translate(${d.x},${d.y})`);
    });

    return () => simulation.stop();
  }, [nodes, activeSegment]);

  return (
    <div className="w-full h-full bg-[#0a0a0c] relative overflow-hidden">
      <div className="absolute top-4 left-4 z-10 flex flex-col gap-2">
        <div className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest mb-2">Network Topology Legend</div>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-blue-500" />
          <span className="text-[10px] font-mono text-zinc-400">Domestic Ground</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-purple-500" />
          <span className="text-[10px] font-mono text-zinc-400">Overseas Reach</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-amber-500" />
          <span className="text-[10px] font-mono text-zinc-400">Maritime Corridor</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-pink-500" />
          <span className="text-[10px] font-mono text-zinc-400">Space Segment</span>
        </div>
      </div>
      <svg ref={svgRef} className="w-full h-full" />
    </div>
  );
};

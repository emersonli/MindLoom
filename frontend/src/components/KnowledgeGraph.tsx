import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import { GraphService, GraphNode, GraphLink } from '../services/graph';

interface Note {
  id: string;
  title: string;
  content: string;
}

interface KnowledgeGraphProps {
  notes: Note[];
  onNodeClick?: (noteId: string) => void;
}

export const KnowledgeGraph: React.FC<KnowledgeGraphProps> = ({ notes, onNodeClick }) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 });

  useEffect(() => {
    // Update dimensions on mount and resize
    const updateDimensions = () => {
      if (containerRef.current) {
        const { clientWidth, clientHeight } = containerRef.current;
        setDimensions({
          width: clientWidth || 800,
          height: clientHeight || 600,
        });
      }
    };

    updateDimensions();
    window.addEventListener('resize', updateDimensions);
    return () => window.removeEventListener('resize', updateDimensions);
  }, []);

  useEffect(() => {
    if (!svgRef.current || notes.length === 0) return;

    const data = GraphService.buildGraphData(notes);
    const { width, height } = dimensions;

    // Clear previous content
    d3.select(svgRef.current).selectAll('*').remove();

    // Create force simulation
    const simulation = d3
      .forceSimulation(data.nodes as any)
      .force('link', d3.forceLink(data.links as any).id((d: any) => d.id).distance(150))
      .force('charge', d3.forceManyBody().strength(-300))
      .force('center', d3.forceCenter(width / 2, height / 2))
      .force('collide', d3.forceCollide(40));

    // Create SVG
    const svg = d3.select(svgRef.current)
      .attr('width', width)
      .attr('height', height)
      .attr('viewBox', [0, 0, width, height])
      .attr('style', 'max-width: 100%; height: auto; font-family: sans-serif;');

    // Add zoom and pan
    svg.call(
      d3.zoom<SVGSVGElement, unknown>()
        .extent([[0, 0], [width, height]])
        .scaleExtent([0.5, 4])
        .on('zoom', (event) => {
          g.attr('transform', event.transform);
        })
    );

    const g = svg.append('g');

    // Draw links
    const link = g
      .append('g')
      .attr('stroke', '#6B7280')
      .attr('stroke-opacity', 0.6)
      .selectAll('line')
      .data(data.links)
      .join('line')
      .attr('stroke-width', 2);

    // Draw nodes
    const node = g
      .append('g')
      .attr('stroke', '#E5E7EB')
      .attr('stroke-width', 2)
      .selectAll('circle')
      .data(data.nodes)
      .join('circle')
      .attr('r', 20)
      .attr('fill', (d: any) => GraphService.getNodeColor(d.group))
      .attr('stroke', '#E5E7EB')
      .style('cursor', 'pointer')
      .call(drag(simulation) as any);

    // Add node labels
    const label = g
      .append('g')
      .selectAll('text')
      .data(data.nodes)
      .join('text')
      .text((d: any) => d.title.length > 15 ? d.title.substring(0, 15) + '...' : d.title)
      .attr('font-size', '11px')
      .attr('text-anchor', 'middle')
      .attr('dy', 35)
      .attr('fill', 'var(--text-primary)')
      .style('pointer-events', 'none')
      .style('font-weight', '500');

    // Node click event
    node.on('click', (event, d: any) => {
      if (onNodeClick) {
        onNodeClick(d.id);
      }
    });

    // Add tooltip
    node.append('title').text((d: any) => d.title);

    // Update positions on tick
    simulation.on('tick', () => {
      link
        .attr('x1', (d: any) => d.source.x)
        .attr('y1', (d: any) => d.source.y)
        .attr('x2', (d: any) => d.target.x)
        .attr('y2', (d: any) => d.target.y);

      node.attr('cx', (d: any) => d.x).attr('cy', (d: any) => d.y);

      label.attr('x', (d: any) => d.x).attr('y', (d: any) => d.y);
    });

    // Drag functions
    function drag(simulation: any) {
      function dragstarted(event: any) {
        if (!event.active) simulation.alphaTarget(0.3).restart();
        event.subject.fx = event.subject.x;
        event.subject.fy = event.subject.y;
      }

      function dragged(event: any) {
        event.subject.fx = event.x;
        event.subject.fy = event.y;
      }

      function dragended(event: any) {
        if (!event.active) simulation.alphaTarget(0);
        event.subject.fx = null;
        event.subject.fy = null;
      }

      return d3.drag()
        .on('start', dragstarted)
        .on('drag', dragged)
        .on('end', dragended);
    }

    return () => {
      simulation.stop();
    };
  }, [notes, dimensions, onNodeClick]);

  return (
    <div
      ref={containerRef}
      className="knowledge-graph-container"
      data-testid="knowledge-graph"
      style={{
        width: '100%',
        height: 'calc(100vh - 100px)',
        backgroundColor: 'var(--bg-secondary)',
        borderRadius: '8px',
        overflow: 'hidden',
        position: 'relative',
      }}
    >
      {/* Header */}
      <div
        className="graph-header"
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '12px 16px',
          backgroundColor: 'var(--bg-tertiary)',
          borderBottom: '1px solid var(--border-color)',
        }}
      >
        <h3 style={{ margin: 0, fontSize: '16px', color: 'var(--text-primary)' }}>
          🕸️ 知识图谱
        </h3>
        <span
          className="node-count"
          style={{
            fontSize: '12px',
            color: 'var(--text-secondary)',
          }}
        >
          {notes.length} 个笔记
        </span>
      </div>

      {/* SVG Canvas */}
      <svg ref={svgRef} data-testid="knowledge-graph-svg" />

      {/* Help Text */}
      <div
        className="graph-help"
        style={{
          position: 'absolute',
          bottom: '16px',
          left: '16px',
          padding: '8px 12px',
          backgroundColor: 'rgba(0, 0, 0, 0.7)',
          borderRadius: '4px',
          fontSize: '12px',
          color: 'var(--text-secondary)',
          pointerEvents: 'none',
        }}
      >
        💡 拖拽节点 | 滚轮缩放 | 点击节点跳转
      </div>
    </div>
  );
};

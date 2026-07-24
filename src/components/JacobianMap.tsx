import { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';

type TooltipData = {
  id: string;
  group: number;
  x: number;
  y: number;
  status: string;
  metric: string;
} | null;

export default function JacobianMap({ darkMode }: { darkMode: boolean }) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [singularityValue, setSingularityValue] = useState(0.000432);
  const [tooltip, setTooltip] = useState<TooltipData>(null);

  useEffect(() => {
    if (!svgRef.current) return;

    const width = 250;
    const height = 200;
    
    // Create nodes that represent the singularity and Jacobian clusters
    const nodes = [
      { id: 'Singularity', group: 1, radius: 8, status: 'STABLE', metric: '0.9992' },
      { id: 'J-Cluster Alpha', group: 2, radius: 5, status: 'RESOLVING', metric: '0.4201' },
      { id: 'J-Cluster Beta', group: 2, radius: 5, status: 'RESOLVING', metric: '0.4188' },
      { id: 'J-Cluster Gamma', group: 2, radius: 5, status: 'RESONATING', metric: '0.4190' },
      { id: 'Boundary Node', group: 3, radius: 3, status: 'ANCHORED', metric: '1.0000' },
      { id: 'Manifold Edge', group: 3, radius: 3, status: 'FLUX', metric: '0.8802' },
    ];
    
    const links = [
      { source: 'Singularity', target: 'J-Cluster Alpha' },
      { source: 'Singularity', target: 'J-Cluster Beta' },
      { source: 'Singularity', target: 'J-Cluster Gamma' },
      { source: 'J-Cluster Alpha', target: 'Boundary Node' },
      { source: 'J-Cluster Beta', target: 'Manifold Edge' },
      { source: 'Boundary Node', target: 'Manifold Edge' }
    ];

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    const simulation = d3
      .forceSimulation(nodes as any)
      .force('link', d3.forceLink(links).id((d: any) => d.id).distance(40))
      .force('charge', d3.forceManyBody().strength(-100))
      .force('center', d3.forceCenter(width / 2, height / 2))
      .force('collide', d3.forceCollide().radius((d: any) => d.radius + 2));

    const link = svg
      .append('g')
      .selectAll('line')
      .data(links)
      .join('line')
      .attr('stroke', darkMode ? '#4b5563' : '#d1d5db')
      .attr('stroke-width', 1)
      .attr('stroke-dasharray', '4 2');

    const node = svg
      .append('g')
      .selectAll('circle')
      .data(nodes)
      .join('circle')
      .attr('r', (d: any) => d.radius)
      .attr('fill', (d) => {
        if (d.group === 1) return '#3b82f6';
        if (d.group === 2) return '#8b5cf6';
        return '#10b981';
      })
      .attr('stroke', darkMode ? '#1f2937' : '#ffffff')
      .attr('stroke-width', 1.5)
      .attr('class', 'cursor-pointer hover:opacity-80 transition-opacity duration-150');

    // Interactive Dragging & Clicking
    node.call(d3.drag()
      .on('start', (event, d: any) => {
        if (!event.active) simulation.alphaTarget(0.3).restart();
        d.fx = d.x;
        d.fy = d.y;
      })
      .on('drag', (event, d: any) => {
        d.fx = event.x;
        d.fy = event.y;
      })
      .on('end', (event, d: any) => {
        if (!event.active) simulation.alphaTarget(0);
        d.fx = null;
        d.fy = null;
      }) as any);
      
    // Set Tooltip on Click
    node.on('click', (event, d: any) => {
      event.stopPropagation();
      const pt = d3.pointer(event, svgRef.current);
      setTooltip(prev => {
        if (prev?.id === d.id) return null; // Toggle off if clicking same node
        return {
          id: d.id,
          group: d.group,
          status: d.status,
          metric: d.metric,
          x: pt[0],
          y: pt[1]
        };
      });
    });

    svg.on('click', () => {
      setTooltip(null);
    });

    node.append('title').text((d: any) => d.id);

    simulation.on('tick', () => {
      link
        .attr('x1', (d: any) => d.source.x)
        .attr('y1', (d: any) => d.source.y)
        .attr('x2', (d: any) => d.target.x)
        .attr('y2', (d: any) => d.target.y);
      node.attr('cx', (d: any) => d.x).attr('cy', (d: any) => d.y);
    });

    // Real-time perturbation effect
    const interval = setInterval(() => {
        setSingularityValue(prev => {
            const shift = (Math.random() - 0.5) * 0.0001;
            return Math.max(0, prev + shift);
        });

        // Pulsate radius
        node.transition()
            .duration(300)
            .attr('r', (d: any) => d.radius + (Math.random() * 2 - 1));
            
        simulation.alpha(0.1).restart(); // Keep it slightly moving
    }, 1000);

    return () => {
        clearInterval(interval);
        simulation.stop();
    }
  }, [darkMode]);

  return (
    <div className="flex flex-col items-center">
      <div className="relative">
        <svg ref={svgRef} width={250} height={200} className={`cursor-grab active:cursor-grabbing rounded-lg bg-opacity-20 ${darkMode ? 'bg-gray-800' : 'bg-gray-100'}`} />
        
        {tooltip && (
          <div 
            className={`absolute z-10 p-3 w-44 rounded shadow-[0_0_15px_rgba(34,197,94,0.3)] text-[10px] font-mono border backdrop-blur-md transition-all duration-300 ${darkMode ? 'bg-black/70 border-green-500/50 text-green-100' : 'bg-white/80 border-green-400/50 text-gray-800'}`}
            style={{ 
              left: Math.min(tooltip.x + 15, 250 - 180), 
              top: Math.min(tooltip.y + 15, 200 - 90),
              pointerEvents: 'none'
            }}
          >
            <div className={`font-bold mb-1 border-b pb-1 ${tooltip.group === 1 ? (darkMode ? 'text-blue-400 border-blue-500/30' : 'text-blue-600 border-blue-200') : tooltip.group === 2 ? (darkMode ? 'text-purple-400 border-purple-500/30' : 'text-purple-600 border-purple-200') : (darkMode ? 'text-green-400 border-green-500/30' : 'text-green-600 border-green-200')}`}>
              {tooltip.id}
            </div>
            <div className="grid grid-cols-2 gap-x-2 gap-y-1 text-[9px] mt-1">
              <span className={darkMode ? "text-green-500/70" : "text-gray-500"}>Tier:</span> <span>{tooltip.group}</span>
              <span className={darkMode ? "text-green-500/70" : "text-gray-500"}>Status:</span> <span className={tooltip.status === 'STABLE' || tooltip.status === 'ANCHORED' ? 'text-green-400 font-bold drop-shadow-[0_0_3px_rgba(74,222,128,0.5)]' : tooltip.status === 'FLUX' ? 'text-red-400 font-bold drop-shadow-[0_0_3px_rgba(248,113,113,0.5)]' : 'text-yellow-400 font-bold drop-shadow-[0_0_3px_rgba(250,204,21,0.5)]'}>{tooltip.status}</span>
              <span className={darkMode ? "text-green-500/70" : "text-gray-500"}>J-Val:</span> <span>{tooltip.metric}</span>
            </div>
          </div>
        )}
      </div>
      <div className={`mt-2 text-[10px] font-mono w-full flex justify-between ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
        <span>SIM_STATUS: ONLINE</span>
        <span>J-VAL: {singularityValue.toFixed(6)}</span>
      </div>
    </div>
  );
}

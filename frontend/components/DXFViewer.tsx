'use client';

import React, { useEffect, useRef, useState } from 'react';

interface DXFViewerProps {
  dxfContent: string;
  stats?: {
    entities: number;
    layers: number;
    bounds?: {
      min_x: number;
      min_y: number;
      max_x: number;
      max_y: number;
    };
  };
}

export default function DXFViewer({ dxfContent, stats }: DXFViewerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [showRawDXF, setShowRawDXF] = useState(false);

  // Parse DXF content
  const parseDXFContent = (dxfString: string) => {
    const entities: any[] = [];
    const lines = dxfString.split('\n');
    
    let i = 0;
    let inEntities = false;
    
    while (i < lines.length) {
      const line = lines[i].trim();
      
      if (line === 'SECTION' && lines[i + 2]?.trim() === 'ENTITIES') {
        inEntities = true;
        i += 3;
        continue;
      }
      
      if (line === 'ENDSEC' && inEntities) {
        break;
      }
      
      if (inEntities && line === 'LINE') {
        const entity: any = { type: 'LINE', dxfattribs: {} };
        i++;
        while (i < lines.length) {
          const code = lines[i].trim();
          const value = lines[i + 1]?.trim();
          
          if (code === '0') break;
          
          if (code === '8') entity.dxfattribs.layer = value;
          else if (code === '62') entity.dxfattribs.color = parseInt(value);
          else if (code === '10') entity.start = [parseFloat(value), 0];
          else if (code === '20') entity.start[1] = parseFloat(value);
          else if (code === '11') entity.end = [parseFloat(value), 0];
          else if (code === '21') entity.end[1] = parseFloat(value);
          
          i += 2;
        }
        if (entity.start && entity.end) entities.push(entity);
        continue;
      }
      
      if (inEntities && line === 'CIRCLE') {
        const entity: any = { type: 'CIRCLE', dxfattribs: {} };
        i++;
        while (i < lines.length) {
          const code = lines[i].trim();
          const value = lines[i + 1]?.trim();
          
          if (code === '0') break;
          
          if (code === '8') entity.dxfattribs.layer = value;
          else if (code === '62') entity.dxfattribs.color = parseInt(value);
          else if (code === '10') entity.center = [parseFloat(value), 0];
          else if (code === '20') entity.center[1] = parseFloat(value);
          else if (code === '40') entity.radius = parseFloat(value);
          
          i += 2;
        }
        if (entity.center && entity.radius) entities.push(entity);
        continue;
      }
      
      if (inEntities && line === 'LWPOLYLINE') {
        const entity: any = { type: 'LWPOLYLINE', points: [], dxfattribs: {} };
        i++;
        while (i < lines.length) {
          const code = lines[i].trim();
          const value = lines[i + 1]?.trim();
          
          if (code === '0') break;
          
          if (code === '8') entity.dxfattribs.layer = value;
          else if (code === '62') entity.dxfattribs.color = parseInt(value);
          else if (code === '70') entity.dxfattribs.close = value === '1';
          else if (code === '10') {
            const x = parseFloat(value);
            const y = parseFloat(lines[i + 3]?.trim() || '0');
            entity.points.push([x, y]);
          }
          
          i += 2;
        }
        if (entity.points.length > 0) entities.push(entity);
        continue;
      }
      
      if (inEntities && line === 'TEXT') {
        const entity: any = { type: 'TEXT', placement: [0, 0], dxfattribs: {} };
        i++;
        while (i < lines.length) {
          const code = lines[i].trim();
          const value = lines[i + 1]?.trim();
          
          if (code === '0') break;
          
          if (code === '8') entity.dxfattribs.layer = value;
          else if (code === '1') entity.text = value;
          else if (code === '10') entity.placement[0] = parseFloat(value);
          else if (code === '20') entity.placement[1] = parseFloat(value);
          else if (code === '40') entity.dxfattribs.height = parseFloat(value);
          else if (code === '72') entity.align = parseInt(value);
          
          i += 2;
        }
        if (entity.text) entities.push(entity);
        continue;
      }
      
      i++;
    }
    
    return entities;
  };

  // Render DXF on canvas
  const renderDXF = () => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!ctx || !canvas) return;
    
    const w = canvas.width;
    const h = canvas.height;
    
    // Black background
    ctx.fillStyle = '#0a0a0a';
    ctx.fillRect(0, 0, w, h);
    
    // Parse entities
    const entities = parseDXFContent(dxfContent);
    
    if (entities.length === 0) {
      ctx.fillStyle = '#666666';
      ctx.font = '14px Arial';
      ctx.textAlign = 'center';
      ctx.fillText('No entities found in DXF', w / 2, h / 2);
      return;
    }
    
    // Calculate bounds
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    
    for (const e of entities) {
      if (e.type === 'LINE') {
        minX = Math.min(minX, e.start[0], e.end[0]);
        minY = Math.min(minY, e.start[1], e.end[1]);
        maxX = Math.max(maxX, e.start[0], e.end[0]);
        maxY = Math.max(maxY, e.start[1], e.end[1]);
      } else if (e.type === 'CIRCLE') {
        minX = Math.min(minX, e.center[0] - e.radius);
        minY = Math.min(minY, e.center[1] - e.radius);
        maxX = Math.max(maxX, e.center[0] + e.radius);
        maxY = Math.max(maxY, e.center[1] + e.radius);
      } else if (e.type === 'LWPOLYLINE') {
        for (const p of e.points) {
          minX = Math.min(minX, p[0]);
          minY = Math.min(minY, p[1]);
          maxX = Math.max(maxX, p[0]);
          maxY = Math.max(maxY, p[1]);
        }
      } else if (e.type === 'TEXT') {
        minX = Math.min(minX, e.placement[0]);
        minY = Math.min(minY, e.placement[1]);
        maxX = Math.max(maxX, e.placement[0]);
        maxY = Math.max(maxY, e.placement[1]);
      }
    }
    
    // Transform function
    const pad = 40;
    const rx = maxX - minX || 1;
    const ry = maxY - minY || 1;
    const s = Math.min((w - 2 * pad) / rx, (h - 2 * pad) / ry);
    const T = (x: number, y: number): [number, number] => [
      pad + (x - minX) * s,
      h - (pad + (y - minY) * s)
    ];
    
    // Color map
    const colors: Record<number, string> = {
      1: '#FF0000', 2: '#FFFF00', 3: '#00FF00', 4: '#00FFFF',
      5: '#0000FF', 6: '#FF00FF', 7: '#FFFFFF', 8: '#808080'
    };
    
    // Draw entities
    for (const e of entities) {
      const color = colors[e.dxfattribs?.color || 7] || '#FFFFFF';
      ctx.strokeStyle = color;
      ctx.fillStyle = color;
      ctx.lineWidth = 1.5;
      
      if (e.type === 'LINE') {
        const [x1, y1] = T(e.start[0], e.start[1]);
        const [x2, y2] = T(e.end[0], e.end[1]);
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.stroke();
      } else if (e.type === 'CIRCLE') {
        const [cx, cy] = T(e.center[0], e.center[1]);
        ctx.beginPath();
        ctx.arc(cx, cy, e.radius * s, 0, 2 * Math.PI);
        ctx.stroke();
      } else if (e.type === 'LWPOLYLINE') {
        if (e.points.length === 0) continue;
        ctx.beginPath();
        const [x0, y0] = T(e.points[0][0], e.points[0][1]);
        ctx.moveTo(x0, y0);
        for (let i = 1; i < e.points.length; i++) {
          const [x, y] = T(e.points[i][0], e.points[i][1]);
          ctx.lineTo(x, y);
        }
        if (e.dxfattribs?.close) ctx.closePath();
        ctx.stroke();
      } else if (e.type === 'TEXT') {
        const [tx, ty] = T(e.placement[0], e.placement[1]);
        const fontSize = Math.max((e.dxfattribs?.height || 2) * s, 10);
        ctx.font = `${fontSize}px Arial`;
        ctx.textAlign = e.align ? 'center' : 'left';
        ctx.fillText(e.text, tx, ty);
      }
    }
  };

  useEffect(() => {
    if (!showRawDXF && dxfContent) {
      renderDXF();
    }
  }, [dxfContent, showRawDXF]);

  return (
    <div className="bg-[#0a0a0a] rounded-xl overflow-hidden border border-[#27272a]">
      {/* Header with Stats and Toggle */}
      <div className="bg-[#18181b] p-4 border-b border-[#27272a]">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-[#10b981]"></div>
            <h3 className="text-sm font-medium text-[#fafafa]">Drawing Generated</h3>
          </div>
          <button
            onClick={() => setShowRawDXF(!showRawDXF)}
            className="px-3 py-1 text-xs bg-[#27272a] hover:bg-[#3f3f46] rounded-lg transition-colors text-[#a1a1aa]"
          >
            {showRawDXF ? '2D View' : 'Raw DXF'}
          </button>
        </div>
        {stats && (
          <div className="text-xs text-[#71717a] space-y-1">
            <p>{stats.entities} entities • {stats.layers} layers</p>
            {stats.bounds && (
              <p className="text-[#52525b] font-mono text-[10px]">
                [{stats.bounds.min_x.toFixed(1)}, {stats.bounds.min_y.toFixed(1)}] → [{stats.bounds.max_x.toFixed(1)}, {stats.bounds.max_y.toFixed(1)}]
              </p>
            )}
          </div>
        )}
      </div>

      {/* Viewer Content */}
      {showRawDXF ? (
        <div className="p-4">
          <div className="bg-[#18181b] rounded-lg p-4 border border-[#27272a]">
            <p className="text-xs text-[#71717a] mb-3 font-medium">Raw DXF Content</p>
            <pre className="text-[11px] text-[#a1a1aa] max-h-96 overflow-auto font-mono leading-relaxed">
              {dxfContent.substring(0, 3000)}
              {dxfContent.length > 3000 && '\n...\n(content truncated)'}
            </pre>
          </div>
        </div>
      ) : (
        <canvas
          ref={canvasRef}
          width={1200}
          height={600}
          className="w-full bg-black"
          style={{ display: 'block' }}
        />
      )}

      {/* Download Instructions */}
      <div className="bg-[#18181b] p-3 border-t border-[#27272a] text-center">
        <p className="text-xs text-[#52525b]">
          Compatible with AutoCAD, LibreCAD, and other DXF viewers
        </p>
      </div>
    </div>
  );
}

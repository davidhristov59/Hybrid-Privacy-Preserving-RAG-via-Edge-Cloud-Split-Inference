import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import ForceGraph2D from "react-force-graph-2d";
import { Network, X, ZoomIn, ZoomOut, RotateCcw, Info, Maximize2, Minimize2 } from "lucide-react";
import { apiFetch } from "../utils/api";

export function GraphPage() {
  const [graphData, setGraphData] = useState({ nodes: [], links: [] });
  const [selectedNode, setSelectedNode] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [nodeFilter, setNodeFilter] = useState("all");
  const [isFullscreen, setIsFullscreen] = useState(false);
  const fgRef = useRef();

  // Fetch graph data from backend
  const fetchGraphData = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await apiFetch("/vault/graph");
      setGraphData(data);
    } catch (err) {
      setError("Failed to load graph data: " + err.message);
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGraphData();
  }, []);

  // Filter nodes based on type
  const filteredData = useMemo(() => {
  const filteredNodes =
    nodeFilter === "all"
      ? graphData.nodes
      : graphData.nodes.filter((n) => n.type === nodeFilter);
  const filteredNodeIds = new Set(filteredNodes.map((n) => n.id));
  
  const filteredLinks =
    nodeFilter === "all"
      ? graphData.links
      : graphData.links.filter((l) => {
          const sourceId = typeof l.source === "object" ? l.source.id : l.source;
          const targetId = typeof l.target === "object" ? l.target.id : l.target;
          return filteredNodeIds.has(sourceId) && filteredNodeIds.has(targetId);
        });
  return { nodes: filteredNodes, links: filteredLinks };
}, [graphData, nodeFilter]);

  // Get unique entity types for filtering
  const entityTypes = ["all", ...new Set(graphData.nodes.map(n => n.type))];

  const handleNodeClick = useCallback((node) => {
    setSelectedNode(node);
    
    // Center view on clicked node
    if (fgRef.current && node.x !== undefined && node.y !== undefined) {
      fgRef.current.centerAt(node.x, node.y, 1000);
      fgRef.current.zoom(3, 1000);
    }
  }, []);

  const handleZoomIn = () => {
    if (fgRef.current) {
      fgRef.current.zoom(fgRef.current.zoom() * 1.3, 500);
    }
  };

  const handleZoomOut = () => {
    if (fgRef.current) {
      fgRef.current.zoom(fgRef.current.zoom() / 1.3, 500);
    }
  };

  const handleReset = () => {
    if (fgRef.current) {
      fgRef.current.zoomToFit(400);
    }
    setSelectedNode(null);
  };

  const nodeCanvasObject = useCallback((node, ctx, globalScale) => {
    const label = node.label;
    const fontSize = 12/globalScale;
    ctx.font = `${fontSize}px Sans-Serif`;
    const textWidth = ctx.measureText(label).width;
    const bckgDimensions = [textWidth, fontSize].map(n => n + fontSize * 0.4);

    // Draw node circle
    ctx.beginPath();
    ctx.arc(node.x, node.y, node.val || 4, 0, 2 * Math.PI, false);
    ctx.fillStyle = node.color || "#999";
    ctx.fill();

    // Add glow effect for selected node
    if (selectedNode && selectedNode.id === node.id) {
      ctx.strokeStyle = "#fff";
      ctx.lineWidth = 3 / globalScale;
      ctx.stroke();
    }

    // Draw label on zoom
    if (globalScale > 1.5) {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
      ctx.fillRect(node.x - bckgDimensions[0] / 2, node.y - bckgDimensions[1] / 2 + node.val + 2, bckgDimensions[0], bckgDimensions[1]);

      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = '#fff';
      ctx.fillText(label, node.x, node.y + node.val + fontSize / 2 + 2);
    }
  }, [selectedNode]);

  return (
    <div className={`flex bg-background text-foreground ${isFullscreen ? 'fixed inset-0 z-50' : 'h-screen'}`}>
      {/* Main Graph Area */}
      <div className="flex-1 relative">
        {/* Header */}
        <div className="absolute top-0 left-0 right-0 z-10 p-6 bg-gradient-to-b from-background/95 to-transparent pointer-events-none">
          <div className="flex items-center justify-between pointer-events-auto">
            <div>
              <h1 className="text-3xl font-bold flex items-center gap-3">
                <Network className="text-accent" />
                Knowledge Graph
              </h1>
              <p className="text-sm text-muted-foreground mt-1">
                Visualize entity relationships without revealing identities
              </p>
            </div>
            
            {/* Filter Dropdown */}
            <div className="flex items-center gap-3">
              <label className="text-sm text-muted-foreground">Filter:</label>
              <select
                value={nodeFilter}
                onChange={(e) => setNodeFilter(e.target.value)}
                className="px-4 py-2 rounded-lg bg-card border border-border text-foreground text-sm hover:border-accent transition-colors cursor-pointer"
              >
                {entityTypes.map(type => (
                  <option key={type} value={type}>
                    {type === "all" ? "All Types" : type}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Graph Controls */}
        <div className="absolute top-32 right-6 z-10 flex flex-col gap-2">
          <button
            onClick={handleZoomIn}
            className="p-3 bg-card/80 backdrop-blur-sm border border-border rounded-lg hover:bg-accent/10 hover:border-accent transition-all"
            title="Zoom In"
            aria-label="Zoom In"
          >
            <ZoomIn size={20} />
          </button>
          <button
            onClick={handleZoomOut}
            className="p-3 bg-card/80 backdrop-blur-sm border border-border rounded-lg hover:bg-accent/10 hover:border-accent transition-all"
            title="Zoom Out"
            aria-label="Zoom Out"
          >
            <ZoomOut size={20} />
          </button>
          <button
            onClick={handleReset}
            className="p-3 bg-card/80 backdrop-blur-sm border border-border rounded-lg hover:bg-accent/10 hover:border-accent transition-all"
            title="Reset View"
            aria-label="Reset View"
          >
            <RotateCcw size={20} />
          </button>
          <button
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="p-3 bg-card/80 backdrop-blur-sm border border-border rounded-lg hover:bg-accent/10 hover:border-accent transition-all"
            title={isFullscreen ? "Exit Fullscreen" : "Fullscreen"}
            aria-label={isFullscreen ? "Exit Fullscreen" : "Fullscreen"}
          >
            {isFullscreen ? <Minimize2 size={20} /> : <Maximize2 size={20} />}
          </button>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center bg-background">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent mb-4 mx-auto"></div>
              <p className="text-muted-foreground">Loading graph data...</p>
            </div>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="absolute inset-0 flex items-center justify-center bg-background">
            <div className="text-center max-w-md">
              <div className="text-destructive text-5xl mb-4">⚠</div>
              <p className="text-destructive font-semibold mb-2">{error}</p>
              <button
                onClick={fetchGraphData}
                className="mt-4 px-4 py-2 bg-accent text-background rounded-lg hover:bg-accent/80 transition-colors"
              >
                Retry
              </button>
            </div>
          </div>
        )}

        {/* 2D Force Graph */}
        {!loading && !error && (
          <ForceGraph2D
            ref={fgRef}
            graphData={filteredData}
            nodeLabel={node => {
              return `${node.label} (${node.type}) - ${node.sources.length} source(s)`;
            }}
            nodeColor={node => node.color}
            nodeVal={node => node.val}
            nodeCanvasObject={nodeCanvasObject}
            linkColor={() => "rgba(150,150,150,0.3)"}
            linkWidth={link => Math.sqrt(link.value || 1) * 0.5}
            onNodeClick={handleNodeClick}
            backgroundColor="#0a0a0a"
            enableNodeDrag={true}
            warmupTicks={100}
            cooldownTicks={0}
          />
        )}

        {/* Info Badge */}
        {!loading && !error && (
          <div className="absolute bottom-6 left-6 z-10 px-4 py-2 bg-card/80 backdrop-blur-sm border border-border rounded-lg flex items-center gap-2 text-sm">
            <Info size={16} className="text-accent" />
            <span className="text-muted-foreground">
              {filteredData.nodes.length} nodes, {filteredData.links.length} connections
            </span>
          </div>
        )}
      </div>

      {/* Sidebar - Node Details */}
      {selectedNode && !isFullscreen && (
        <div className="w-96 border-l border-border bg-card p-6 overflow-y-auto">
          <div className="flex items-start justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold text-accent mb-2">{selectedNode.label}</h2>
              <p className="text-sm text-muted-foreground">Entity Details</p>
            </div>
            <button
              onClick={() => setSelectedNode(null)}
              className="p-2 hover:bg-background/50 rounded-lg transition-colors"
              aria-label="Close details"
            >
              <X size={20} />
            </button>
          </div>

          <div className="space-y-4">
            {/* Entity Type */}
            <div className="p-4 bg-background/50 rounded-lg border border-border">
              <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Type</p>
              <div className="flex items-center gap-2">
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: selectedNode.color }}
                ></div>
                <p className="font-mono text-sm">{selectedNode.type}</p>
              </div>
            </div>

            {/* Node ID */}
            <div className="p-4 bg-background/50 rounded-lg border border-border">
              <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Masked ID</p>
              <p className="font-mono text-sm text-accent">{selectedNode.id}</p>
            </div>

            {/* Sources */}
            <div className="p-4 bg-background/50 rounded-lg border border-border">
              <p className="text-xs text-muted-foreground uppercase tracking-wide mb-2">
                Source Documents ({selectedNode.sources?.length || 0})
              </p>
              {selectedNode.sources && selectedNode.sources.length > 0 ? (
                <ul className="space-y-1">
                  {selectedNode.sources.map((source, idx) => (
                    <li key={idx} className="text-sm font-mono flex items-center gap-2">
                      <span className="text-accent">•</span>
                      <span className="truncate">{source}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-muted-foreground italic">No sources available</p>
              )}
            </div>

            {/* Connected Nodes */}
            <div className="p-4 bg-background/50 rounded-lg border border-border">
              <p className="text-xs text-muted-foreground uppercase tracking-wide mb-2">
                Connected Entities
              </p>
              {(() => {
                const connected = graphData.links
                  .filter(l => {
                    const sourceId = typeof l.source === 'object' ? l.source.id : l.source;
                    const targetId = typeof l.target === 'object' ? l.target.id : l.target;
                    return sourceId === selectedNode.id || targetId === selectedNode.id;
                  })
                  .map(l => {
                    const sourceId = typeof l.source === 'object' ? l.source.id : l.source;
                    const targetId = typeof l.target === 'object' ? l.target.id : l.target;
                    const connectedId = sourceId === selectedNode.id ? targetId : sourceId;
                    const connectedNode = graphData.nodes.find(n => n.id === connectedId);
                    return { ...connectedNode, linkStrength: l.value };
                  })
                  .filter(n => n.id); // Remove any null nodes
                
                return connected.length > 0 ? (
                  <ul className="space-y-2">
                    {connected.map((node, idx) => (
                      <li
                        key={node.id}
                        className="flex items-center justify-between p-2 bg-background/30 rounded hover:bg-accent/10 transition-colors cursor-pointer"
                        onClick={() => handleNodeClick(node)}
                      >
                        <div className="flex items-center gap-2">
                          <div
                            className="w-2 h-2 rounded-full"
                            style={{ backgroundColor: node.color }}
                          ></div>
                          <span className="font-mono text-xs">{node.label}</span>
                        </div>
                        <span className="text-xs text-muted-foreground">
                          {node.linkStrength} link{node.linkStrength > 1 ? 's' : ''}
                        </span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-muted-foreground italic">No connections</p>
                );
              })()}
            </div>
          </div>

          {/* Privacy Note */}
          <div className="mt-6 p-4 bg-accent/10 border border-accent/20 rounded-lg">
            <p className="text-xs text-accent/80 leading-relaxed">
              <strong className="block mb-1">🔒 Privacy Protection Active</strong>
              All entities are masked. The original identity is stored securely in the local Identity Vault
              and never sent to the cloud.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

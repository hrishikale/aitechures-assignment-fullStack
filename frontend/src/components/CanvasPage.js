import React, { useRef, useState, useEffect } from 'react';
import * as PIXI from 'pixi.js';
import './CanvasPage.css';
import axios from 'axios';

function CanvasPage({ user, onLogout }) {
  const containerRef = useRef(null);
  const appRef = useRef(null);
  const spritesRef = useRef({});
  const currentShapeRef = useRef(null);
  const isDrawingRef = useRef(false);
  const startPosRef = useRef(null);
  
  const [tool, setTool] = useState(null);
  const [shapes, setShapes] = useState([]);
  const [images, setImages] = useState([]);
  const [selectedItem, setSelectedItem] = useState(null);
  const imageInput = useRef(null);
  const deleteHandlesRef = useRef({});
  const [elementMenuOpen, setElementMenuOpen] = useState(false);
  const elementMenuRef = useRef(null);

  // Refs to access current values in closures
  const toolRef = useRef(tool);
  const shapesRef = useRef(shapes);
  const selectedItemRef = useRef(selectedItem);

  useEffect(() => {
    toolRef.current = tool;
  }, [tool]);

  useEffect(() => {
    shapesRef.current = shapes;
  }, [shapes]);

  useEffect(() => {
    selectedItemRef.current = selectedItem;
  }, [selectedItem]);

  useEffect(() => {
    loadCanvasState();
  }, []);

  useEffect(() => {
    if (shapes.length > 0 || images.length > 0) {
      const timer = setTimeout(() => {
        saveCanvasState();
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [shapes, images]);

  useEffect(() => {
    if (!elementMenuOpen) return;
    function handleClickOutside(event) {
      if (elementMenuRef.current && !elementMenuRef.current.contains(event.target)) {
        setElementMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [elementMenuOpen]);

  const loadCanvasState = async () => {
    try {
      const response = await axios.get(`http://localhost:3001/canvas/load/${user.id}`);
      if (response.data.canvasData) {
        const data = JSON.parse(response.data.canvasData);
        setShapes(data.shapes || []);
        setImages(data.images || []);
      }
    } catch (error) {
      console.error('Error loading canvas:', error);
    }
  };

  const saveCanvasState = async () => {
    try {
      const canvasData = JSON.stringify({ shapes, images });
      await axios.post(`http://localhost:3001/canvas/save/${user.id}`, {
        canvasData,
      });
    } catch (error) {
      console.error('Error saving canvas:', error);
    }
  };

  useEffect(() => {
    if (!containerRef.current) return;

    const initPixi = async () => {
      // Initialize Pixi.js v6
      const app = new PIXI.Application({
        width: window.innerWidth - 250,
        height: window.innerHeight,
        backgroundColor: 0xf0f0f0,
        antialias: true,
      });

      app.stage.interactive = true;
      app.stage.hitArea = app.screen;

      containerRef.current.appendChild(app.view);
      appRef.current = app;

      setupInteractions(app);
      renderContent(app);

      const handleResize = () => {
        if (app) {
          app.renderer.resize(window.innerWidth - 250, window.innerHeight);
        }
      };
      window.addEventListener('resize', handleResize);
    };

    initPixi();

    return () => {
      if (appRef.current) {
        appRef.current.destroy(true);
      }
    };
  }, []);

  useEffect(() => {
    if (appRef.current) {
      renderContent(appRef.current);
    }
  }, [shapes, images, selectedItem]);

  const addResizeHandles = (app, shape, graphics, onUpdate) => {
    if (!app || !app.stage) return;
    
    const handleSize = 8;
    // Use current graphics position and size, not state values
    const currentX = graphics.x !== undefined ? graphics.x : shape.x;
    const currentY = graphics.y !== undefined ? graphics.y : shape.y;
    const currentWidth = graphics._currentWidth !== undefined ? graphics._currentWidth : shape.width;
    const currentHeight = graphics._currentHeight !== undefined ? graphics._currentHeight : shape.height;
    
    const handles = [
      { pos: 'top-left', x: currentX, y: currentY },
      { pos: 'top-right', x: currentX + currentWidth, y: currentY },
      { pos: 'bottom-left', x: currentX, y: currentY + currentHeight },
      { pos: 'bottom-right', x: currentX + currentWidth, y: currentY + currentHeight },
    ];

    handles.forEach((handle) => {
      const handleGraphics = new PIXI.Graphics();
      handleGraphics.lineStyle(2, 0x4a90e2);
      handleGraphics.beginFill(0xffffff);
      handleGraphics.drawRect(-handleSize / 2, -handleSize / 2, handleSize, handleSize);
      handleGraphics.endFill();
      handleGraphics.x = handle.x;
      handleGraphics.y = handle.y;

      handleGraphics.interactive = true;
      handleGraphics.buttonMode = true;
      handleGraphics.cursor = 'pointer';
      handleGraphics._isResizeHandle = true;
      handleGraphics._handleOwnerId = shape.id;
      handleGraphics._handlePos = handle.pos;

      const resizeState = {
        isResizing: false,
        startResizePos: null,
        startShapeBounds: null,
      };

      handleGraphics.on('pointerdown', (e) => {
        e.stopPropagation();
        if (!app.stage) return;
        
        isInteractingRef.current = true;
        resizeState.isResizing = true;
        resizeState.startResizePos = { x: e.data.global.x, y: e.data.global.y };
        
        // Use current graphics position and size, not state values
        // Graphics might have been resized previously, so check _currentWidth/Height first
        const currentX = graphics.x !== undefined ? graphics.x : shape.x;
        const currentY = graphics.y !== undefined ? graphics.y : shape.y;
        const currentWidth = graphics._currentWidth !== undefined ? graphics._currentWidth : shape.width;
        const currentHeight = graphics._currentHeight !== undefined ? graphics._currentHeight : shape.height;
        
        resizeState.startShapeBounds = { 
          x: currentX, 
          y: currentY, 
          width: currentWidth, 
          height: currentHeight 
        };

        const onResizeMove = (e) => {
          if (resizeState.isResizing && resizeState.startResizePos && resizeState.startShapeBounds && app.stage) {
            const deltaX = e.data.global.x - resizeState.startResizePos.x;
            const deltaY = e.data.global.y - resizeState.startResizePos.y;
            let newBounds = { ...resizeState.startShapeBounds };

            if (handle.pos.includes('left')) {
              newBounds.x = resizeState.startShapeBounds.x + deltaX;
              newBounds.width = resizeState.startShapeBounds.width - deltaX;
            } else {
              newBounds.width = resizeState.startShapeBounds.width + deltaX;
            }

            if (handle.pos.includes('top')) {
              newBounds.y = resizeState.startShapeBounds.y + deltaY;
              newBounds.height = resizeState.startShapeBounds.height - deltaY;
            } else {
              newBounds.height = resizeState.startShapeBounds.height + deltaY;
            }

            // Ensure minimum size
            if (newBounds.width < 10) {
              newBounds.width = 10;
              if (handle.pos.includes('left')) {
                newBounds.x = resizeState.startShapeBounds.x + resizeState.startShapeBounds.width - 10;
              }
            }
            if (newBounds.height < 10) {
              newBounds.height = 10;
              if (handle.pos.includes('top')) {
                newBounds.y = resizeState.startShapeBounds.y + resizeState.startShapeBounds.height - 10;
              }
            }

            // Store current bounds for immediate updates
            resizeState.currentBounds = newBounds;

            // Direct graphics updates for smooth resizing - update immediately
            graphics.clear();
            if (shape.type === 'rectangle') {
              graphics.lineStyle(shape.strokeWidth, selectedItem === shape.id ? 0xff0000 : shape.stroke);
              graphics.beginFill(shape.fill, 0.8);
              graphics.drawRect(0, 0, newBounds.width, newBounds.height);
              graphics.endFill();
            } else if (shape.type === 'circle') {
              const radius = Math.max(Math.abs(newBounds.width), Math.abs(newBounds.height)) / 2;
              graphics.lineStyle(shape.strokeWidth, selectedItem === shape.id ? 0xff0000 : shape.stroke);
              graphics.beginFill(shape.fill, 0.8);
              graphics.drawCircle(newBounds.width / 2, newBounds.height / 2, radius);
              graphics.endFill();
            }
            graphics.x = newBounds.x;
            graphics.y = newBounds.y;
            
            // Store the current size in graphics for reference
            graphics._currentWidth = newBounds.width;
            graphics._currentHeight = newBounds.height;

            // Update all handles immediately with new bounds
            app.stage.children.forEach((child) => {
              if (child._isResizeHandle && child._handleOwnerId === shape.id) {
                const pos = child._handlePos;
                if (pos === 'top-left') {
                  child.x = newBounds.x;
                  child.y = newBounds.y;
                } else if (pos === 'top-right') {
                  child.x = newBounds.x + newBounds.width;
                  child.y = newBounds.y;
                } else if (pos === 'bottom-left') {
                  child.x = newBounds.x;
                  child.y = newBounds.y + newBounds.height;
                } else if (pos === 'bottom-right') {
                  child.x = newBounds.x + newBounds.width;
                  child.y = newBounds.y + newBounds.height;
                }
              }
            });
            // Update delete handle during resize
            addOrUpdateDeleteHandle(app, shape.id, newBounds.x, newBounds.y, newBounds.width, newBounds.height, (id) => {
              if (existingGraphicsRef.current[id]?.parent) {
                app.stage.removeChild(existingGraphicsRef.current[id]);
              }
              app.stage.children.forEach((child) => {
                if ((child._isResizeHandle || child._isDeleteHandle) && child._handleOwnerId === id) {
                  if (child.parent) app.stage.removeChild(child);
                }
              });
              delete existingGraphicsRef.current[id];
              delete dragStatesRef.current[id];
              delete resizeHandlesRef.current[id];
              delete deleteHandlesRef.current[id];
              setShapes((prev) => prev.filter((s) => s.id !== id));
              setSelectedItem(null);
            });
          }
        };

        const stopResize = () => {
          if (!app.stage) return;
          isInteractingRef.current = false;
          resizeState.isResizing = false;
          
          // Final state update using current bounds
          // Keep _currentWidth/_currentHeight until state updates and renderContent clears them
          if (resizeState.currentBounds) {
            // Update state - the dimensions are already stored in graphics._currentWidth/_currentHeight
            onUpdate({ 
              ...shape, 
              x: resizeState.currentBounds.x,
              y: resizeState.currentBounds.y,
              width: resizeState.currentBounds.width,
              height: resizeState.currentBounds.height
            });
          } else if (resizeState.startShapeBounds) {
            const finalWidth = graphics._currentWidth || resizeState.startShapeBounds.width;
            const finalHeight = graphics._currentHeight || resizeState.startShapeBounds.height;
            const finalBounds = {
              x: graphics.x,
              y: graphics.y,
              width: finalWidth,
              height: finalHeight,
            };
            onUpdate({ ...shape, ...finalBounds });
          }
          app.stage.off('pointermove', onResizeMove);
          app.stage.off('pointerup', stopResize);
          app.stage.off('pointerupoutside', stopResize);
        };

        app.stage.on('pointermove', onResizeMove);
        app.stage.on('pointerup', stopResize);
        app.stage.on('pointerupoutside', stopResize);
      });

      app.stage.addChild(handleGraphics);
    });
  };

  const addResizeHandlesForImage = (app, img, sprite, onUpdate) => {
    if (!app || !app.stage) return;
    
    const handleSize = 8;
    // Use current sprite position and size, not state values
    const currentX = sprite.x !== undefined ? sprite.x : img.x;
    const currentY = sprite.y !== undefined ? sprite.y : img.y;
    const currentWidth = sprite.width && sprite.width > 0 ? sprite.width : img.width;
    const currentHeight = sprite.height && sprite.height > 0 ? sprite.height : img.height;
    
    const handles = [
      { pos: 'top-left', x: currentX, y: currentY },
      { pos: 'top-right', x: currentX + currentWidth, y: currentY },
      { pos: 'bottom-left', x: currentX, y: currentY + currentHeight },
      { pos: 'bottom-right', x: currentX + currentWidth, y: currentY + currentHeight },
    ];

    handles.forEach((handle) => {
      const handleGraphics = new PIXI.Graphics();
      handleGraphics.lineStyle(2, 0x4a90e2);
      handleGraphics.beginFill(0xffffff);
      handleGraphics.drawRect(-handleSize / 2, -handleSize / 2, handleSize, handleSize);
      handleGraphics.endFill();
      handleGraphics.x = handle.x;
      handleGraphics.y = handle.y;

      handleGraphics.interactive = true;
      handleGraphics.buttonMode = true;
      handleGraphics.cursor = 'pointer';
      handleGraphics._isResizeHandle = true;
      handleGraphics._handleOwnerId = img.id;
      handleGraphics._handlePos = handle.pos;

      const resizeState = {
        isResizing: false,
        startResizePos: null,
        startImgBounds: null,
      };

      handleGraphics.on('pointerdown', (e) => {
        e.stopPropagation();
        if (!app.stage) return;
        
        isInteractingRef.current = true;
        resizeState.isResizing = true;
        resizeState.startResizePos = { x: e.data.global.x, y: e.data.global.y };
        
        // Use current sprite position and size, not state values
        const currentX = sprite.x !== undefined ? sprite.x : img.x;
        const currentY = sprite.y !== undefined ? sprite.y : img.y;
        // Sprites have direct width/height access, use actual current values
        const currentWidth = sprite.width && sprite.width > 0 ? sprite.width : img.width;
        const currentHeight = sprite.height && sprite.height > 0 ? sprite.height : img.height;
        
        resizeState.startImgBounds = { 
          x: currentX, 
          y: currentY, 
          width: currentWidth, 
          height: currentHeight 
        };

        const onResizeMove = (e) => {
          if (resizeState.isResizing && resizeState.startResizePos && resizeState.startImgBounds && app.stage) {
            const deltaX = e.data.global.x - resizeState.startResizePos.x;
            const deltaY = e.data.global.y - resizeState.startResizePos.y;
            let newBounds = { ...resizeState.startImgBounds };

            if (handle.pos.includes('left')) {
              newBounds.x = resizeState.startImgBounds.x + deltaX;
              newBounds.width = resizeState.startImgBounds.width - deltaX;
            } else {
              newBounds.width = resizeState.startImgBounds.width + deltaX;
            }

            if (handle.pos.includes('top')) {
              newBounds.y = resizeState.startImgBounds.y + deltaY;
              newBounds.height = resizeState.startImgBounds.height - deltaY;
            } else {
              newBounds.height = resizeState.startImgBounds.height + deltaY;
            }

            // Ensure minimum size
            if (newBounds.width < 10) {
              newBounds.width = 10;
              if (handle.pos.includes('left')) {
                newBounds.x = resizeState.startImgBounds.x + resizeState.startImgBounds.width - 10;
              }
            }
            if (newBounds.height < 10) {
              newBounds.height = 10;
              if (handle.pos.includes('top')) {
                newBounds.y = resizeState.startImgBounds.y + resizeState.startImgBounds.height - 10;
              }
            }

            // Store current bounds
            resizeState.currentBounds = newBounds;

            // Direct sprite updates for smooth resizing - update immediately
            sprite.x = newBounds.x;
            sprite.y = newBounds.y;
            sprite.width = newBounds.width;
            sprite.height = newBounds.height;

            // Update all handles immediately with new bounds
            app.stage.children.forEach((child) => {
              if (child._isResizeHandle && child._handleOwnerId === img.id) {
                const pos = child._handlePos;
                if (pos === 'top-left') {
                  child.x = newBounds.x;
                  child.y = newBounds.y;
                } else if (pos === 'top-right') {
                  child.x = newBounds.x + newBounds.width;
                  child.y = newBounds.y;
                } else if (pos === 'bottom-left') {
                  child.x = newBounds.x;
                  child.y = newBounds.y + newBounds.height;
                } else if (pos === 'bottom-right') {
                  child.x = newBounds.x + newBounds.width;
                  child.y = newBounds.y + newBounds.height;
                }
              }
            });
            // Update delete handle during image resize
            addOrUpdateDeleteHandle(app, img.id, newBounds.x, newBounds.y, newBounds.width, newBounds.height, (id) => {
              const sp = spritesRef.current[id];
              if (sp?.parent) app.stage.removeChild(sp);
              app.stage.children.forEach((child) => {
                if ((child._isResizeHandle || child._isDeleteHandle) && child._handleOwnerId === id) {
                  if (child.parent) app.stage.removeChild(child);
                }
              });
              delete spritesRef.current[id];
              delete dragStatesRef.current[id];
              delete resizeHandlesRef.current[id];
              delete deleteHandlesRef.current[id];
              setImages((prev) => prev.filter((i) => i.id !== id));
              setSelectedItem(null);
            });
          }
        };

        const stopResize = () => {
          if (!app.stage) return;
          isInteractingRef.current = false;
          resizeState.isResizing = false;
          // Final state update using current bounds
          if (resizeState.currentBounds) {
            onUpdate({ 
              ...img, 
              x: resizeState.currentBounds.x,
              y: resizeState.currentBounds.y,
              width: resizeState.currentBounds.width,
              height: resizeState.currentBounds.height
            });
          } else if (resizeState.startImgBounds) {
            onUpdate({ 
              ...img, 
              x: sprite.x, 
              y: sprite.y, 
              width: sprite.width, 
              height: sprite.height 
            });
          }
          app.stage.off('pointermove', onResizeMove);
          app.stage.off('pointerup', stopResize);
          app.stage.off('pointerupoutside', stopResize);
        };

        app.stage.on('pointermove', onResizeMove);
        app.stage.on('pointerup', stopResize);
        app.stage.on('pointerupoutside', stopResize);
      });

      app.stage.addChild(handleGraphics);
    });
  };

  const addOrUpdateDeleteHandle = (app, ownerId, x, y, width, height, onDelete) => {
    // position: top-right corner with offset (keep away from resize handle)
    const size = 16;
    const offset = 18;
    const posX = x + width + offset;
    const posY = y - offset / 2;

    // Always remove old handle if present to ensure only one and bring to top
    let container = deleteHandlesRef.current[ownerId];
    if (container && container.parent) {
      container.parent.removeChild(container);
    }

    if (!container) {
      container = new PIXI.Container();
      container._isDeleteHandle = true;
      container._handleOwnerId = ownerId;
      container.interactive = true;
      container.buttonMode = true;
      container.cursor = 'pointer';

      const g = new PIXI.Graphics();
      // set debug fill color visible (light red background)
      g.clear();
      g.lineStyle(2, 0xd0021b);
      g.beginFill(0xffcccc); // notice color for debugging
      g.drawRoundedRect(-size / 2, -size / 2, size, size, 3);
      g.endFill();
      // 'X'
      g.lineStyle(2, 0xd0021b);
      g.moveTo(-4, -4);
      g.lineTo(4, 4);
      g.moveTo(4, -4);
      g.lineTo(-4, 4);

      const label = new PIXI.Text('Delete', { fontFamily: 'Arial', fontSize: 10, fill: 0xd0021b, align: 'left' });
      label.x = size / 2 + 6;
      label.y = -size / 2 + 1;

      container.addChild(g);
      container.addChild(label);
      container.on('pointerdown', (e) => {
        e.stopPropagation();
        onDelete(ownerId);
      });
      deleteHandlesRef.current[ownerId] = container;
    } else {
      // update graphics if already exists
      container.x = posX;
      container.y = posY;
      // update possible children if necessary
    }
    container.x = posX;
    container.y = posY;

    // Always add the handle to stage as last child (top z-index)
    if (container.parent !== app.stage) {
      app.stage.addChild(container);
    } else {
      // remove and re-add to bring to front
      app.stage.removeChild(container);
      app.stage.addChild(container);
    }
  };

  const setupInteractions = (app) => {
    app.stage.on('pointerdown', (e) => {
      const clickedOnStageBackground = e.target === app.stage;

      // Deselect if clicking on empty stage
      if (clickedOnStageBackground && selectedItemRef.current) {
        setSelectedItem(null);
        selectedItemRef.current = null;
      }
      
      // Only start drawing if no item is selected, tool is active, and user clicked empty canvas
      const isDrawingToolActive = toolRef.current === 'rectangle' || toolRef.current === 'circle';
      if (clickedOnStageBackground && isDrawingToolActive && !selectedItemRef.current) {
        isDrawingRef.current = true;
        startPosRef.current = { x: e.data.global.x, y: e.data.global.y };
        currentShapeRef.current = new PIXI.Graphics();
        // seed a tiny preview at the pointer location so it doesn't appear at (0,0)
        currentShapeRef.current.lineStyle(2, 0x2c5aa0);
        currentShapeRef.current.beginFill(0x4a90e2, 0.5);
        currentShapeRef.current.drawRect(startPosRef.current.x, startPosRef.current.y, 1, 1);
        currentShapeRef.current.endFill();
        app.stage.addChildAt(currentShapeRef.current, 0);
      }
    });

    // In pointermove (drawing preview) logic update:
    app.stage.on('pointermove', (e) => {
      if (isDrawingRef.current && currentShapeRef.current && startPosRef.current) {
        const x = e.data.global.x;
        const y = e.data.global.y;
        if (toolRef.current === 'rectangle') {
          const minX = Math.min(startPosRef.current.x, x);
          const minY = Math.min(startPosRef.current.y, y);
          const width = Math.abs(x - startPosRef.current.x);
          const height = Math.abs(y - startPosRef.current.y);
          currentShapeRef.current.clear();
          currentShapeRef.current.lineStyle(2, 0x2c5aa0);
          currentShapeRef.current.beginFill(0x4a90e2, 0.5);
          currentShapeRef.current.drawRect(0, 0, width, height);
          currentShapeRef.current.endFill();
          currentShapeRef.current.x = minX;
          currentShapeRef.current.y = minY;
        } else if (toolRef.current === 'circle') {
          const dx = x - startPosRef.current.x;
          const dy = y - startPosRef.current.y;
          const radius = Math.sqrt(dx * dx + dy * dy);
          currentShapeRef.current.clear();
          currentShapeRef.current.lineStyle(2, 0x2c5aa0);
          currentShapeRef.current.beginFill(0x4a90e2, 0.5);
          currentShapeRef.current.drawCircle(0, 0, radius);
          currentShapeRef.current.endFill();
          currentShapeRef.current.x = startPosRef.current.x;
          currentShapeRef.current.y = startPosRef.current.y;
        }
      }
    });

    app.stage.on('pointerup', (e) => {
      if (isDrawingRef.current && currentShapeRef.current && startPosRef.current) {
        const lastX = e.data.global.x;
        const lastY = e.data.global.y;
        let shape = null;
        if (toolRef.current === 'rectangle') {
          const minX = Math.min(startPosRef.current.x, lastX);
          const minY = Math.min(startPosRef.current.y, lastY);
          const width = Math.abs(lastX - startPosRef.current.x);
          const height = Math.abs(lastY - startPosRef.current.y);
          shape = {
            id: Date.now(),
            type: 'rectangle',
            x: minX,
            y: minY,
            width,
            height,
            fill: 0x4a90e2,
            stroke: 0x2c5aa0,
            strokeWidth: 2,
          };
        } else if (toolRef.current === 'circle') {
          const dx = lastX - startPosRef.current.x;
          const dy = lastY - startPosRef.current.y;
          const radius = Math.sqrt(dx * dx + dy * dy);
          shape = {
            id: Date.now(),
            type: 'circle',
            x: startPosRef.current.x,
            y: startPosRef.current.y,
            width: radius * 2,
            height: radius * 2,
            fill: 0x4a90e2,
            stroke: 0x2c5aa0,
            strokeWidth: 2,
          };
        }
        if (shape) setShapes((prevShapes) => [...prevShapes, shape]);
        app.stage.removeChild(currentShapeRef.current);
        currentShapeRef.current = null;
        isDrawingRef.current = false;
      }
    });
  };

  const dragStatesRef = useRef({});
  const resizeHandlesRef = useRef({});
  const existingGraphicsRef = useRef({});
  const existingSpritesRef = useRef({});
  const isInteractingRef = useRef(false); // Prevent re-renders during interaction

  const renderContent = (app) => {
    // Skip re-render if currently dragging or resizing
    if (isInteractingRef.current) {
      return;
    }
    
    // Ensure app and stage exist
    if (!app || !app.stage) {
      return;
    }
    
    // Track control handles to preserve/remove them appropriately
    const handlesToRemove = [];
    app.stage.children.forEach((child) => {
      if (child._isResizeHandle) {
        const handleId = child._handleOwnerId;
        if (handleId && selectedItem !== handleId) {
          handlesToRemove.push(child);
        }
      } else if (child._isDeleteHandle) {
        const ownerId = child._handleOwnerId;
        if (ownerId && selectedItem !== ownerId) {
          handlesToRemove.push(child);
        }
      } else if (child !== currentShapeRef.current) {
        if (!child._isShape && !child._isImage) {
          handlesToRemove.push(child);
        }
      }
    });
    handlesToRemove.forEach((handle) => {
      if (handle.parent === app.stage) {
        app.stage.removeChild(handle);
      }
    });

    // Render shapes
    shapes.forEach((shape) => {
      let graphics = existingGraphicsRef.current[shape.id];
      
      if (!graphics) {
        graphics = new PIXI.Graphics();
        graphics._isShape = true;
        graphics._shapeId = shape.id;
        existingGraphicsRef.current[shape.id] = graphics;
        
        graphics.interactive = true;
        graphics.buttonMode = true;

        // Setup drag handlers once
        graphics.on('pointerdown', (e) => {
          e.stopPropagation();
          setSelectedItem(shape.id);
          selectedItemRef.current = shape.id;
          
          // Use current graphics position, not state position
          const currentX = graphics.x || shape.x;
          const currentY = graphics.y || shape.y;
          
          dragStatesRef.current[shape.id] = {
            isDragging: true,
            offset: {
              x: e.data.global.x - currentX,
              y: e.data.global.y - currentY,
            },
            startX: currentX,
            startY: currentY,
            hasMoved: false,
          };

          const onPointerMove = (e) => {
            if (!app.stage) return;
            const dragState = dragStatesRef.current[shape.id];
            if (dragState && dragState.isDragging && !isDrawingRef.current) {
              if (!dragState.hasMoved) {
                dragState.hasMoved = true;
                isInteractingRef.current = true;
              }
              const newX = e.data.global.x - dragState.offset.x;
              const newY = e.data.global.y - dragState.offset.y;
              // Direct position update for smooth dragging
              graphics.x = newX;
              graphics.y = newY;
              
              // Get current dimensions - prefer stored values, then bounds, then state
              let currentWidth = graphics._currentWidth;
              let currentHeight = graphics._currentHeight;
              
              // If not stored, calculate from graphics bounds
              if (!currentWidth || !currentHeight) {
                const bounds = graphics.getBounds();
                currentWidth = bounds.width || shape.width;
                currentHeight = bounds.height || shape.height;
              }
              
              // Update handles immediately with current dimensions
              app.stage.children.forEach((child) => {
                if (child._isResizeHandle && child._handleOwnerId === shape.id) {
                  const handlePos = child._handlePos;
                  if (handlePos === 'top-left') {
                    child.x = newX;
                    child.y = newY;
                  } else if (handlePos === 'top-right') {
                    child.x = newX + currentWidth;
                    child.y = newY;
                  } else if (handlePos === 'bottom-left') {
                    child.x = newX;
                    child.y = newY + currentHeight;
                  } else if (handlePos === 'bottom-right') {
                    child.x = newX + currentWidth;
                    child.y = newY + currentHeight;
                  }
                }
              });
          // Move delete handle with the shape while dragging
          addOrUpdateDeleteHandle(app, shape.id, newX, newY, currentWidth, currentHeight, (id) => {
            if (existingGraphicsRef.current[id]?.parent) {
              app.stage.removeChild(existingGraphicsRef.current[id]);
            }
            app.stage.children.forEach((child) => {
              if ((child._isResizeHandle || child._isDeleteHandle) && child._handleOwnerId === id) {
                if (child.parent) app.stage.removeChild(child);
              }
            });
            delete existingGraphicsRef.current[id];
            delete dragStatesRef.current[id];
            delete resizeHandlesRef.current[id];
            delete deleteHandlesRef.current[id];
            setShapes((prev) => prev.filter((s) => s.id !== id));
            setSelectedItem(null);
          });
            }
          };

          const stopDrag = () => {
            if (!app.stage) return;
            const dragState = dragStatesRef.current[shape.id];
            if (dragState) {
              isInteractingRef.current = false;
              dragState.isDragging = false;
              // Final state update on mouse up!
              setShapes((prevShapes) =>
                prevShapes.map((s) => 
                  s.id === shape.id 
                    ? { ...s, x: graphics.x, y: graphics.y } 
                    : s
                )
              );
            }
            app.stage.off('pointermove', onPointerMove);
            app.stage.off('pointerup', stopDrag);
            app.stage.off('pointerupoutside', stopDrag);
          };

          if (app.stage) {
            app.stage.on('pointermove', onPointerMove);
            app.stage.on('pointerup', stopDrag);
            app.stage.on('pointerupoutside', stopDrag);
          }
        });
      }

      // Update graphics visual properties only if not dragging and not resizing
      // Check if graphics has a current width/height set (from resize) - if so, don't overwrite
      const hasActiveResize = graphics._currentWidth !== undefined && graphics._currentHeight !== undefined;
      
      // If we have stored dimensions and they match state, clear them (state has been updated)
      if (hasActiveResize) {
        const storedMatchesState = 
          Math.abs(graphics._currentWidth - shape.width) < 0.1 && 
          Math.abs(graphics._currentHeight - shape.height) < 0.1;
        if (storedMatchesState) {
          // State has been updated, safe to clear stored dimensions
          delete graphics._currentWidth;
          delete graphics._currentHeight;
        }
      }
      
      if (!dragStatesRef.current[shape.id]?.isDragging && !hasActiveResize) {
        graphics.clear();
        if (shape.type === 'rectangle') {
          graphics.lineStyle(shape.strokeWidth, selectedItem === shape.id ? 0xff0000 : shape.stroke);
          graphics.beginFill(shape.fill, 0.8);
          graphics.drawRect(0, 0, shape.width, shape.height);
          graphics.endFill();
        } else if (shape.type === 'circle') {
          const radius = Math.max(Math.abs(shape.width), Math.abs(shape.height)) / 2;
          graphics.lineStyle(shape.strokeWidth, selectedItem === shape.id ? 0xff0000 : shape.stroke);
          graphics.beginFill(shape.fill, 0.8);
          graphics.drawCircle(shape.width / 2, shape.height / 2, radius);
          graphics.endFill();
        }
        // Always update position to match state (prevents jump-to-corner bug)
        graphics.x = shape.x;
        graphics.y = shape.y;
      }

      if (!graphics.parent && app.stage) {
        app.stage.addChild(graphics);
      }

      // Add/update resize handles if selected
      if (selectedItem === shape.id) {
        if (!resizeHandlesRef.current[shape.id]) {
          addResizeHandles(app, shape, graphics, (newShape) => {
            setShapes((prevShapes) =>
              prevShapes.map((s) => (s.id === shape.id ? newShape : s))
            );
          });
          resizeHandlesRef.current[shape.id] = true;
        } else {
          // Update handle positions for existing handles using current graphics position and size
          if (app.stage) {
            const currentX = graphics.x !== undefined ? graphics.x : shape.x;
            const currentY = graphics.y !== undefined ? graphics.y : shape.y;
            const currentWidth = graphics._currentWidth !== undefined ? graphics._currentWidth : shape.width;
            const currentHeight = graphics._currentHeight !== undefined ? graphics._currentHeight : shape.height;
            app.stage.children.forEach((child) => {
              if (child._isResizeHandle && child._handleOwnerId === shape.id) {
                const handlePos = child._handlePos;
                if (handlePos === 'top-left') {
                  child.x = currentX;
                  child.y = currentY;
                } else if (handlePos === 'top-right') {
                  child.x = currentX + currentWidth;
                  child.y = currentY;
                } else if (handlePos === 'bottom-left') {
                  child.x = currentX;
                  child.y = currentY + currentHeight;
                } else if (handlePos === 'bottom-right') {
                  child.x = currentX + currentWidth;
                  child.y = currentY + currentHeight;
                }
              }
            });
            // Update delete handle position
            addOrUpdateDeleteHandle(app, shape.id, currentX, currentY, currentWidth, currentHeight, (id) => {
              if (existingGraphicsRef.current[id]?.parent) {
                app.stage.removeChild(existingGraphicsRef.current[id]);
              }
              app.stage.children.forEach((child) => {
                if ((child._isResizeHandle || child._isDeleteHandle) && child._handleOwnerId === id) {
                  if (child.parent) app.stage.removeChild(child);
                }
              });
              delete existingGraphicsRef.current[id];
              delete dragStatesRef.current[id];
              delete resizeHandlesRef.current[id];
              delete deleteHandlesRef.current[id];
              setShapes((prev) => prev.filter((s) => s.id !== id));
              setSelectedItem(null);
            });
          }
        }
      } else if (selectedItem !== shape.id && resizeHandlesRef.current[shape.id]) {
        resizeHandlesRef.current[shape.id] = false;
      }
      // Only update/add delete handle for selected
      const delWidth = graphics._currentWidth !== undefined ? graphics._currentWidth : shape.width;
      const delHeight = graphics._currentHeight !== undefined ? graphics._currentHeight : shape.height;
      addOrUpdateDeleteHandle(app, shape.id, graphics.x, graphics.y, delWidth, delHeight, (id) => {
        if (existingGraphicsRef.current[id]?.parent) { app.stage.removeChild(existingGraphicsRef.current[id]); }
        app.stage.children.forEach((child) => {
          if (child._isResizeHandle && child._handleOwnerId === id) { if (child.parent) app.stage.removeChild(child); }
          if (child._isDeleteHandle && child._handleOwnerId === id) { if (child.parent) app.stage.removeChild(child); }
        });
        delete existingGraphicsRef.current[id];
        delete dragStatesRef.current[id];
        delete resizeHandlesRef.current[id];
        delete deleteHandlesRef.current[id];
        setShapes((prev) => prev.filter((s) => s.id !== id));
        setSelectedItem(null);
      });
    });

    // Render images
    images.forEach((img) => {
      let sprite = spritesRef.current[img.id];
      
      if (!sprite) {
        const texture = PIXI.Texture.from(img.url);
        sprite = new PIXI.Sprite(texture);
        sprite._isImage = true;
        sprite._imageId = img.id;
        spritesRef.current[img.id] = sprite;

        sprite.interactive = true;
        sprite.buttonMode = true;

        // Setup drag handlers once
        sprite.on('pointerdown', (e) => {
          e.stopPropagation();
          setSelectedItem(img.id);
          selectedItemRef.current = img.id;
          
          // Use current sprite position, not state position
          const currentX = sprite.x || img.x;
          const currentY = sprite.y || img.y;
          
          dragStatesRef.current[img.id] = {
            isDragging: true,
            offset: {
              x: e.data.global.x - currentX,
              y: e.data.global.y - currentY,
            },
            hasMoved: false,
          };

          const onPointerMove = (e) => {
            if (!app.stage) return;
            const dragState = dragStatesRef.current[img.id];
            if (dragState && dragState.isDragging && !isDrawingRef.current) {
              if (!dragState.hasMoved) {
                dragState.hasMoved = true;
                isInteractingRef.current = true;
              }
              const newX = e.data.global.x - dragState.offset.x;
              const newY = e.data.global.y - dragState.offset.y;
              // Direct position update for smooth dragging
              sprite.x = newX;
              sprite.y = newY;
              
              // Get current dimensions from sprite (always up-to-date after resize)
              const currentWidth = sprite.width && sprite.width > 0 ? sprite.width : img.width;
              const currentHeight = sprite.height && sprite.height > 0 ? sprite.height : img.height;
              
              // Update handles immediately with current dimensions
              app.stage.children.forEach((child) => {
                if (child._isResizeHandle && child._handleOwnerId === img.id) {
                  const handlePos = child._handlePos;
                  if (handlePos === 'top-left') {
                    child.x = newX;
                    child.y = newY;
                  } else if (handlePos === 'top-right') {
                    child.x = newX + currentWidth;
                    child.y = newY;
                  } else if (handlePos === 'bottom-left') {
                    child.x = newX;
                    child.y = newY + currentHeight;
                  } else if (handlePos === 'bottom-right') {
                    child.x = newX + currentWidth;
                    child.y = newY + currentHeight;
                  }
                }
              });
          // Move delete handle with the image while dragging
          addOrUpdateDeleteHandle(app, img.id, newX, newY, currentWidth, currentHeight, (id) => {
            const sp = spritesRef.current[id];
            if (sp?.parent) app.stage.removeChild(sp);
            app.stage.children.forEach((child) => {
              if ((child._isResizeHandle || child._isDeleteHandle) && child._handleOwnerId === id) {
                if (child.parent) app.stage.removeChild(child);
              }
            });
            delete spritesRef.current[id];
            delete dragStatesRef.current[id];
            delete resizeHandlesRef.current[id];
            delete deleteHandlesRef.current[id];
            setImages((prev) => prev.filter((i) => i.id !== id));
            setSelectedItem(null);
          });
            }
          };

          const stopDragSprite = () => {
            if (!app.stage) return;
            const dragState = dragStatesRef.current[img.id];
            if (dragState) {
              isInteractingRef.current = false;
              dragState.isDragging = false;
              setImages((prevImages) =>
                prevImages.map((i) =>
                  i.id === img.id
                    ? { ...i, x: sprite.x, y: sprite.y }
                    : i
                )
              );
            }
            app.stage.off('pointermove', onPointerMove);
            app.stage.off('pointerup', stopDragSprite);
            app.stage.off('pointerupoutside', stopDragSprite);
          };

          if (app.stage) {
            app.stage.on('pointermove', onPointerMove);
            app.stage.on('pointerup', stopDragSprite);
            app.stage.on('pointerupoutside', stopDragSprite);
          }
        });

        if (app.stage) {
          app.stage.addChild(sprite);
        }
      }

      // Update sprite properties only if not dragging
      if (!dragStatesRef.current[img.id]?.isDragging) {
        sprite.x = img.x;
        sprite.y = img.y;
        sprite.width = img.width;
        sprite.height = img.height;
      }

      // Add/update resize handles if selected
      if (selectedItem === img.id) {
        if (!resizeHandlesRef.current[img.id]) {
          addResizeHandlesForImage(app, img, sprite, (newImg) => {
            setImages((prevImages) =>
              prevImages.map((i) => (i.id === img.id ? newImg : i))
            );
          });
          resizeHandlesRef.current[img.id] = true;
        } else {
          // Update handle positions for existing handles using current sprite position and size
          if (app.stage) {
            const currentX = sprite.x !== undefined ? sprite.x : img.x;
            const currentY = sprite.y !== undefined ? sprite.y : img.y;
            const currentWidth = sprite.width && sprite.width > 0 ? sprite.width : img.width;
            const currentHeight = sprite.height && sprite.height > 0 ? sprite.height : img.height;
            app.stage.children.forEach((child) => {
              if (child._isResizeHandle && child._handleOwnerId === img.id) {
                const handlePos = child._handlePos;
                if (handlePos === 'top-left') {
                  child.x = currentX;
                  child.y = currentY;
                } else if (handlePos === 'top-right') {
                  child.x = currentX + currentWidth;
                  child.y = currentY;
                } else if (handlePos === 'bottom-left') {
                  child.x = currentX;
                  child.y = currentY + currentHeight;
                } else if (handlePos === 'bottom-right') {
                  child.x = currentX + currentWidth;
                  child.y = currentY + currentHeight;
                }
              }
            });
            // Update delete handle position
            addOrUpdateDeleteHandle(app, img.id, currentX, currentY, currentWidth, currentHeight, (id) => {
              const sp = spritesRef.current[id];
              if (sp?.parent) app.stage.removeChild(sp);
              app.stage.children.forEach((child) => {
                if ((child._isResizeHandle || child._isDeleteHandle) && child._handleOwnerId === id) {
                  if (child.parent) app.stage.removeChild(child);
                }
              });
              delete spritesRef.current[id];
              delete dragStatesRef.current[id];
              delete resizeHandlesRef.current[id];
              delete deleteHandlesRef.current[id];
              setImages((prev) => prev.filter((i) => i.id !== id));
              setSelectedItem(null);
            });
          }
        }
      } else if (selectedItem !== img.id && resizeHandlesRef.current[img.id]) {
        resizeHandlesRef.current[img.id] = false;
      }
      // Only update/add delete handle for selected
      addOrUpdateDeleteHandle(app, img.id, sprite.x, sprite.y, sprite.width, sprite.height, (id) => {
        const sp = spritesRef.current[id];
        if (sp?.parent) app.stage.removeChild(sp);
        app.stage.children.forEach((child) => {
          if ((child._isResizeHandle || child._isDeleteHandle) && child._handleOwnerId === id) {
            if (child.parent) app.stage.removeChild(child);
          }
        });
        delete spritesRef.current[id];
        delete dragStatesRef.current[id];
        delete resizeHandlesRef.current[id];
        delete deleteHandlesRef.current[id];
        setImages((prev) => prev.filter((i) => i.id !== id));
        setSelectedItem(null);
      });
    });

    // Cleanup: remove all stray delete handles except for selectedItem
    Object.keys(deleteHandlesRef.current).forEach(id => {
      if (id != selectedItem && deleteHandlesRef.current[id]) {
        const handle = deleteHandlesRef.current[id];
        if (handle.parent) handle.parent.removeChild(handle);
        delete deleteHandlesRef.current[id];
      }
    });
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const newImage = {
          id: Date.now(),
          url: event.target.result,
          x: 50,
          y: 50,
          width: 200,
          height: 200,
        };
        setImages([...images, newImage]);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDelete = () => {
    if (selectedItem && appRef.current && appRef.current.stage) {
      const app = appRef.current;
      const shapeExists = shapes.some((s) => s.id === selectedItem);
      
      // Remove from stage immediately
      if (shapeExists) {
        // Remove graphics
        const graphics = existingGraphicsRef.current[selectedItem];
        if (graphics && graphics.parent) {
          app.stage.removeChild(graphics);
        }
        delete existingGraphicsRef.current[selectedItem];
        delete dragStatesRef.current[selectedItem];
        delete resizeHandlesRef.current[selectedItem];
        
        // Remove resize handles
        app.stage.children.forEach((child) => {
          if (child._isResizeHandle && child._handleOwnerId === selectedItem) {
            if (child.parent) {
              app.stage.removeChild(child);
            }
          }
        });
        
        setShapes(shapes.filter((s) => s.id !== selectedItem));
      } else {
        // Remove sprite
        const sprite = spritesRef.current[selectedItem];
        if (sprite && sprite.parent) {
          app.stage.removeChild(sprite);
        }
        delete spritesRef.current[selectedItem];
        delete dragStatesRef.current[selectedItem];
        delete resizeHandlesRef.current[selectedItem];
        
        // Remove resize handles
        app.stage.children.forEach((child) => {
          if (child._isResizeHandle && child._handleOwnerId === selectedItem) {
            if (child.parent) {
              app.stage.removeChild(child);
            }
          }
        });
        
        setImages(images.filter((i) => i.id !== selectedItem));
      }
      setSelectedItem(null);
    }
  };

  return (
    <div className="canvas-container">
      <aside className="left-toolbar">
        <div className="sidebar-flex-grow">
          <div className="toolbar-header">
            <span className="icon">≡</span>
            <span>File</span>
          </div>
          <div className="toolbar-section">
            <div className="toolbar-item"
              ref={elementMenuRef}
              onClick={() => setElementMenuOpen((open) => !open)}
              style={{ cursor: 'pointer', position: 'relative' }}
            >
              <div className="icon">⬜</div>
              <div className="label">Elements ▼</div>
              {elementMenuOpen && (
                <div className="submenu" style={{display: 'flex', flexDirection: 'column', position: 'absolute', left: 0, right: 0, top: '100%', marginTop: 4, zIndex: 20, minWidth: '180px', width: '100%'}}>
                  <div className="pill" style={{display:'flex', alignItems:'center', gap:8}} onClick={(e) => {e.stopPropagation(); setTool('rectangle'); setElementMenuOpen(false);}}>
                    <svg width="16" height="16"><rect x="2" y="4" width="12" height="8" fill="#4a90e2" stroke="#2c5aa0" strokeWidth="2"></rect></svg>
                    Rectangle
                  </div>
                  <div className="pill" style={{display:'flex', alignItems:'center', gap:8}} onClick={(e) => {e.stopPropagation(); setTool('circle'); setElementMenuOpen(false);}}>
                    <svg width="16" height="16"><circle cx="8" cy="8" r="6" fill="#4a90e2" stroke="#2c5aa0" strokeWidth="2"></circle></svg>
                    Circle
                  </div>
                </div>
              )}
            </div>
            <div className="toolbar-item" onClick={() => imageInput.current?.click()}>
              <div className="icon">⭳</div>
              <div className="label">Uploads</div>
            </div>
            <input
              className="hidden-input"
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              ref={imageInput}
            />
          </div>
        </div>
        <div className="sidebar-logout-row">
          <button onClick={onLogout} className="logout-btn">Logout</button>
        </div>
      </aside>
      <div className="canvas-area">
        <div ref={containerRef} className="canvas-host"></div>
      </div>
    </div>
  );
}

export default CanvasPage;

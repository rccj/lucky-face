'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import * as faceapi from 'face-api.js';
import { DetectedFace } from '@/lib/faceDetection';
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";

interface FaceAdjusterProps {
  isOpen: boolean;
  onClose: () => void;
  selectedImage: string | null;
  faces: DetectedFace[];
  onSave: (adjustedFaces: DetectedFace[]) => void;
}

export default function FaceAdjuster({ 
  isOpen, 
  onClose, 
  selectedImage, 
  faces, 
  onSave 
}: FaceAdjusterProps) {
  const [adjustableFaces, setAdjustableFaces] = useState<DetectedFace[]>([]);
  const [selectedFaceIndex, setSelectedFaceIndex] = useState<number>(-1);
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [resizeHandle, setResizeHandle] = useState<string>('');
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [initialBox, setInitialBox] = useState({ x: 0, y: 0, width: 0, height: 0 });
  const [initialMousePos, setInitialMousePos] = useState({ x: 0, y: 0 });
  const [hasMoved, setHasMoved] = useState(false);
  
  const adjustImageRef = useRef<HTMLImageElement>(null);
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;

  // 當彈窗開啟時，初始化調整面板的人臉數據
  useEffect(() => {
    if (isOpen && faces.length > 0) {
      setAdjustableFaces([...faces]);
      setSelectedFaceIndex(-1);
    }
  }, [isOpen, faces]);


  // 處理人臉框拖拽和縮放
  useEffect(() => {
    if (!isDragging && !isResizing) return;

    // 當開始拖拽或縮放時，完全禁用頁面滾動
    const originalBodyStyle = document.body.style.overflow;
    const originalBodyTouchAction = document.body.style.touchAction;
    const originalDocumentStyle = document.documentElement.style.overflow;
    const originalDocumentTouchAction = document.documentElement.style.touchAction;
    
    document.body.style.overflow = 'hidden';
    document.body.style.touchAction = 'none';
    document.documentElement.style.overflow = 'hidden';
    document.documentElement.style.touchAction = 'none';

    const handleMove = (e: MouseEvent | TouchEvent) => {
      if (selectedFaceIndex < 0 || !adjustImageRef.current) return;

      const imgElement = adjustImageRef.current;
      const imgRect = imgElement.getBoundingClientRect();
      
      // 獲取觸控或滑鼠位置
      const clientX = 'touches' in e ? e.touches[0]?.clientX || 0 : e.clientX;
      const clientY = 'touches' in e ? e.touches[0]?.clientY || 0 : e.clientY;
      
      if (isDragging) {
        // 檢查是否真的在拖拽（移動距離超過閾值）
        const distance = Math.sqrt(
          Math.pow(clientX - initialMousePos.x, 2) + 
          Math.pow(clientY - initialMousePos.y, 2)
        );
        
        if (distance > 5) { // 增加閾值到5px
          if (!hasMoved) {
            setHasMoved(true);
          }
          
          // 阻止觸控滾動
          if ('touches' in e) {
            e.preventDefault();
          }
          
          // 計算相對於圖片的位置
          const mouseX = clientX - imgRect.left;
          const mouseY = clientY - imgRect.top;
          
          // 計算縮放比例
          const scaleX = imgElement.clientWidth / imgElement.naturalWidth;
          const scaleY = imgElement.clientHeight / imgElement.naturalHeight;
          const scale = Math.min(scaleX, scaleY);
          
          // 計算實際圖片顯示區域
          const displayWidth = imgElement.naturalWidth * scale;
          const displayHeight = imgElement.naturalHeight * scale;
          const offsetX = (imgElement.clientWidth - displayWidth) / 2;
          const offsetY = (imgElement.clientHeight - displayHeight) / 2;
          
          // 轉換為自然圖片座標
          const naturalX = (mouseX - dragOffset.x - offsetX) / scale;
          const naturalY = (mouseY - dragOffset.y - offsetY) / scale;
          
          // 限制在圖片邊界內
          const currentFace = adjustableFaces[selectedFaceIndex];
          const clampedX = Math.max(0, Math.min(naturalX, imgElement.naturalWidth - currentFace.box.width));
          const clampedY = Math.max(0, Math.min(naturalY, imgElement.naturalHeight - currentFace.box.height));
          
          setAdjustableFaces(prev => prev.map((f, i) => 
            i === selectedFaceIndex 
              ? { ...f, box: { ...f.box, x: clampedX, y: clampedY } }
              : f
          ));
        }
      } else if (isResizing) {
        // 檢查是否真的在縮放（移動距離超過閾值）
        const distance = Math.sqrt(
          Math.pow(clientX - initialMousePos.x, 2) + 
          Math.pow(clientY - initialMousePos.y, 2)
        );
        
        if (distance > 3 || hasMoved) { // 3px 閾值，比拖拽更敏感
          if (!hasMoved) {
            setHasMoved(true);
          }
          
          // 阻止觸控滾動
          if ('touches' in e) {
            e.preventDefault();
          }
        
          // 計算相對於圖片的位置
          const mouseX = clientX - imgRect.left;
          const mouseY = clientY - imgRect.top;
          
          // 計算縮放比例
          const scaleX = imgElement.clientWidth / imgElement.naturalWidth;
          const scaleY = imgElement.clientHeight / imgElement.naturalHeight;
          const scale = Math.min(scaleX, scaleY);
          
          // 計算實際圖片顯示區域
          const displayWidth = imgElement.naturalWidth * scale;
          const displayHeight = imgElement.naturalHeight * scale;
          const offsetX = (imgElement.clientWidth - displayWidth) / 2;
          const offsetY = (imgElement.clientHeight - displayHeight) / 2;
          // 縮放調整 - 對角位置固定
          const currentMouseX = (mouseX - offsetX) / scale;
          const currentMouseY = (mouseY - offsetY) / scale;
          
          const newBox = { ...initialBox };
          
          switch (resizeHandle) {
            case 'top-left':
              // 固定右下角，調整左上角
              const fixedRightX = initialBox.x + initialBox.width;
              const fixedBottomY = initialBox.y + initialBox.height;
              newBox.x = Math.min(currentMouseX, fixedRightX - 20);
              newBox.y = Math.min(currentMouseY, fixedBottomY - 20);
              newBox.width = fixedRightX - newBox.x;
              newBox.height = fixedBottomY - newBox.y;
              break;
            case 'top-right':
              // 固定左下角，調整右上角
              const fixedLeftX = initialBox.x;
              const fixedBottomY2 = initialBox.y + initialBox.height;
              newBox.x = fixedLeftX;
              newBox.y = Math.min(currentMouseY, fixedBottomY2 - 20);
              newBox.width = Math.max(currentMouseX - fixedLeftX, 20);
              newBox.height = fixedBottomY2 - newBox.y;
              break;
            case 'bottom-left':
              // 固定右上角，調整左下角
              const fixedRightX2 = initialBox.x + initialBox.width;
              const fixedTopY = initialBox.y;
              newBox.x = Math.min(currentMouseX, fixedRightX2 - 20);
              newBox.y = fixedTopY;
              newBox.width = fixedRightX2 - newBox.x;
              newBox.height = Math.max(currentMouseY - fixedTopY, 20);
              break;
            case 'bottom-right':
              // 固定左上角，調整右下角
              const fixedLeftX2 = initialBox.x;
              const fixedTopY2 = initialBox.y;
              newBox.x = fixedLeftX2;
              newBox.y = fixedTopY2;
              newBox.width = Math.max(currentMouseX - fixedLeftX2, 20);
              newBox.height = Math.max(currentMouseY - fixedTopY2, 20);
              break;
          }
          
          // 限制在圖片邊界內
          newBox.x = Math.max(0, Math.min(newBox.x, imgElement.naturalWidth - 20));
          newBox.y = Math.max(0, Math.min(newBox.y, imgElement.naturalHeight - 20));
          newBox.width = Math.min(newBox.width, imgElement.naturalWidth - newBox.x);
          newBox.height = Math.min(newBox.height, imgElement.naturalHeight - newBox.y);
          
          setAdjustableFaces(prev => prev.map((f, i) => 
            i === selectedFaceIndex 
              ? { ...f, box: newBox }
              : f
          ));
        }
      }
    };

    const handleEnd = () => {
      setIsDragging(false);
      setIsResizing(false);
      setResizeHandle('');
      setHasMoved(false);
      
      // 恢復頁面滾動
      document.body.style.overflow = originalBodyStyle;
      document.body.style.touchAction = originalBodyTouchAction;
      document.documentElement.style.overflow = originalDocumentStyle;
      document.documentElement.style.touchAction = originalDocumentTouchAction;
    };

    // 添加滑鼠和觸控事件
    document.addEventListener('mousemove', handleMove as EventListener);
    document.addEventListener('mouseup', handleEnd);
    document.addEventListener('touchmove', handleMove as EventListener, { passive: false });
    document.addEventListener('touchend', handleEnd);

    return () => {
      document.removeEventListener('mousemove', handleMove as EventListener);
      document.removeEventListener('mouseup', handleEnd);
      document.removeEventListener('touchmove', handleMove as EventListener);
      document.removeEventListener('touchend', handleEnd);
      
      // 清理時也要恢復滾動，防止意外情況
      document.body.style.overflow = originalBodyStyle;
      document.body.style.touchAction = originalBodyTouchAction;
    };
  }, [isDragging, isResizing, selectedFaceIndex, dragOffset, adjustableFaces, resizeHandle, initialBox, initialMousePos, hasMoved]);

  const handleAddFace = useCallback(() => {
    const newFace: DetectedFace = {
      id: `manual-face-${Date.now()}`,
      box: {
        x: 100,
        y: 100,
        width: 100,
        height: 100,
      },
      detection: {} as faceapi.FaceDetection, // 手動添加的不需要真正的檢測對象
    };
    setAdjustableFaces(prev => [...prev, newFace]);
  }, []);

  const handleDeleteFace = useCallback(() => {
    if (selectedFaceIndex >= 0) {
      setAdjustableFaces(prev => prev.filter((_, i) => i !== selectedFaceIndex));
      setSelectedFaceIndex(-1);
    }
  }, [selectedFaceIndex]);

  const handleSave = useCallback(() => {
    onSave(adjustableFaces);
    onClose();
  }, [adjustableFaces, onSave, onClose]);

  if (!isOpen || !selectedImage) return null;

  if (isMobile) {
    return (
      <Drawer open={isOpen} onOpenChange={onClose}>
        <DrawerContent 
          className="bg-white max-h-[85vh]"
          style={{
            touchAction: isDragging || isResizing ? 'none' : 'auto'
          }}
        >
          <DrawerHeader className="text-center pb-2">
            <DrawerTitle className="text-xl font-bold text-gray-900">✏️ 手動調整人臉框</DrawerTitle>
            <DrawerDescription className="text-gray-600">
              點擊並拖拽來調整人臉框位置和大小
            </DrawerDescription>
          </DrawerHeader>
          
          <div 
            className="px-4 pb-8 flex-1 overflow-y-auto"
            style={{
              touchAction: isDragging || isResizing ? 'none' : 'auto'
            }}
          >
            <div className="space-y-4">
            {/* 圖片預覽區域 */}
            <div 
              className="relative mx-auto max-w-full"
              onClick={() => setSelectedFaceIndex(-1)}
              style={{ 
                touchAction: isDragging || isResizing ? 'none' : 'manipulation'
              }}
            >
              <img
                ref={adjustImageRef}
                src={selectedImage}
                alt="調整人臉框"
                className={`w-full object-contain rounded-lg ${isMobile ? 'max-h-80' : 'max-h-[500px]'}`}
                style={{ maxWidth: '100%' }}
                onLoad={() => {
                  // 圖片加載完成後強制重新渲染
                  setAdjustableFaces(prev => [...prev]);
                }}
              />
            
            {/* 可拖拽的人臉框覆蓋層 */}
            {adjustImageRef.current && adjustableFaces.map((face, index) => {
              const imgElement = adjustImageRef.current!;
              
              // 計算縮放和位置
              const scaleX = imgElement.clientWidth / imgElement.naturalWidth;
              const scaleY = imgElement.clientHeight / imgElement.naturalHeight;
              const scale = Math.min(scaleX, scaleY);
              
              const displayWidth = imgElement.naturalWidth * scale;
              const displayHeight = imgElement.naturalHeight * scale;
              const offsetX = (imgElement.clientWidth - displayWidth) / 2;
              const offsetY = (imgElement.clientHeight - displayHeight) / 2;
              
              const x = face.box.x * scale + offsetX;
              const y = face.box.y * scale + offsetY;
              const width = face.box.width * scale;
              const height = face.box.height * scale;
              
              const isSelected = selectedFaceIndex === index;
              
              return (
                <div key={face.id || `face-${index}`}>
                  {/* 人臉框 */}
                  <div
                    className="absolute cursor-move transition-all duration-200 hover:scale-105"
                    style={{
                      left: `${x}px`,
                      top: `${y}px`,
                      width: `${width}px`,
                      height: `${height}px`,
                      borderWidth: isMobile ? '1px' : '1px',
                      borderColor: isSelected ? '#dc2626' : '#16a34a',
                      touchAction: 'none', // 完全禁用觸控的默認行為
                    }}
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedFaceIndex(index);
                    }}
                    onMouseDown={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setSelectedFaceIndex(index);
                      setIsDragging(true);
                      setHasMoved(false);
                      
                      const imgRect = imgElement.getBoundingClientRect();
                      setInitialMousePos({ x: e.clientX, y: e.clientY });
                      setDragOffset({
                        x: e.clientX - imgRect.left - x,
                        y: e.clientY - imgRect.top - y
                      });
                    }}
                    onTouchStart={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setSelectedFaceIndex(index);
                      setIsDragging(true);
                      setHasMoved(false);
                      
                      const imgRect = imgElement.getBoundingClientRect();
                      const touch = e.touches[0];
                      setInitialMousePos({ x: touch.clientX, y: touch.clientY });
                      setDragOffset({
                        x: touch.clientX - imgRect.left - x,
                        y: touch.clientY - imgRect.top - y
                      });
                    }}
                  >
                    {/* 四個角落的拖拽點 */}
                    <div 
                      className={`absolute ${isMobile ? 'w-1 h-1' : 'w-2 h-2'} rounded-full cursor-nw-resize`}
                      style={{ 
                        left: '-4px', 
                        top: '-4px',
                        backgroundColor: isSelected ? '#dc2626' : '#16a34a',
                        border: '1px solid white',
                        boxShadow: '0 1px 3px rgba(0,0,0,0.3)',
                        touchAction: 'none'
                      }}
                      onMouseDown={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setSelectedFaceIndex(index);
                        setIsDragging(false);
                        setIsResizing(true);
                        setResizeHandle('top-left');
                        setInitialBox({ ...face.box });
                        setInitialMousePos({ x: e.clientX, y: e.clientY });
                        setHasMoved(false);
                      }}
                      onTouchStart={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setSelectedFaceIndex(index);
                        setIsDragging(false);
                        setIsResizing(true);
                        setResizeHandle('top-left');
                        setInitialBox({ ...face.box });
                        const touch = e.touches[0];
                        setInitialMousePos({ x: touch.clientX, y: touch.clientY });
                        setHasMoved(false);
                      }}
                    />
                    <div 
                      className={`absolute ${isMobile ? 'w-1 h-1' : 'w-2 h-2'} rounded-full cursor-ne-resize`}
                      style={{ 
                        right: '-4px', 
                        top: '-4px',
                        backgroundColor: isSelected ? '#dc2626' : '#16a34a',
                        border: '1px solid white',
                        boxShadow: '0 1px 3px rgba(0,0,0,0.3)',
                        touchAction: 'none'
                      }}
                      onMouseDown={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setSelectedFaceIndex(index);
                        setIsDragging(false);
                        setIsResizing(true);
                        setResizeHandle('top-right');
                        setInitialBox({ ...face.box });
                        setInitialMousePos({ x: e.clientX, y: e.clientY });
                        setHasMoved(false);
                      }}
                      onTouchStart={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setSelectedFaceIndex(index);
                        setIsDragging(false);
                        setIsResizing(true);
                        setResizeHandle('top-right');
                        setInitialBox({ ...face.box });
                        const touch = e.touches[0];
                        setInitialMousePos({ x: touch.clientX, y: touch.clientY });
                        setHasMoved(false);
                      }}
                    />
                    <div 
                      className={`absolute ${isMobile ? 'w-1 h-1' : 'w-2 h-2'} rounded-full cursor-sw-resize`}
                      style={{ 
                        left: '-4px', 
                        bottom: '-4px',
                        backgroundColor: isSelected ? '#dc2626' : '#16a34a',
                        border: '1px solid white',
                        boxShadow: '0 1px 3px rgba(0,0,0,0.3)',
                        touchAction: 'none'
                      }}
                      onMouseDown={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setSelectedFaceIndex(index);
                        setIsDragging(false);
                        setIsResizing(true);
                        setResizeHandle('bottom-left');
                        setInitialBox({ ...face.box });
                        setInitialMousePos({ x: e.clientX, y: e.clientY });
                        setHasMoved(false);
                      }}
                      onTouchStart={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setSelectedFaceIndex(index);
                        setIsDragging(false);
                        setIsResizing(true);
                        setResizeHandle('bottom-left');
                        setInitialBox({ ...face.box });
                        const touch = e.touches[0];
                        setInitialMousePos({ x: touch.clientX, y: touch.clientY });
                        setHasMoved(false);
                      }}
                    />
                    <div 
                      className={`absolute ${isMobile ? 'w-1 h-1' : 'w-2 h-2'} rounded-full cursor-se-resize`}
                      style={{ 
                        right: '-4px', 
                        bottom: '-4px',
                        backgroundColor: isSelected ? '#dc2626' : '#16a34a',
                        border: '1px solid white',
                        boxShadow: '0 1px 3px rgba(0,0,0,0.3)',
                        touchAction: 'none'
                      }}
                      onMouseDown={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setSelectedFaceIndex(index);
                        setIsDragging(false);
                        setIsResizing(true);
                        setResizeHandle('bottom-right');
                        setInitialBox({ ...face.box });
                        setInitialMousePos({ x: e.clientX, y: e.clientY });
                        setHasMoved(false);
                      }}
                      onTouchStart={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setSelectedFaceIndex(index);
                        setIsDragging(false);
                        setIsResizing(true);
                        setResizeHandle('bottom-right');
                        setInitialBox({ ...face.box });
                        const touch = e.touches[0];
                        setInitialMousePos({ x: touch.clientX, y: touch.clientY });
                        setHasMoved(false);
                      }}
                    />
                  </div>
                  
                  {/* 編號標籤 */}
                  <div
                    className="absolute text-white font-semibold flex items-center justify-center cursor-move hover:scale-110 transition-transform"
                    style={{
                      left: `${x + width + 6}px`,
                      top: `${y - 6}px`,
                      width: '14px',
                      height: '14px',
                      backgroundColor: isSelected ? '#dc2626' : '#16a34a',
                      fontSize: '10px',
                      boxShadow: '0 2px 4px rgba(0, 0, 0, 0.3)',
                      fontFamily: '-apple-system, BlinkMacSystemFont, sans-serif',
                      transform: 'translate(-50%, -50%)',
                      borderRadius: '2px',
                      touchAction: 'none',
                    }}
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedFaceIndex(index);
                    }}
                    onMouseDown={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setSelectedFaceIndex(index);
                      setIsDragging(true);
                      setHasMoved(false);
                      
                      const imgRect = imgElement.getBoundingClientRect();
                      setInitialMousePos({ x: e.clientX, y: e.clientY });
                      setDragOffset({
                        x: e.clientX - imgRect.left - x,
                        y: e.clientY - imgRect.top - y
                      });
                    }}
                    onTouchStart={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setSelectedFaceIndex(index);
                      setIsDragging(true);
                      setHasMoved(false);
                      
                      const imgRect = imgElement.getBoundingClientRect();
                      const touch = e.touches[0];
                      setInitialMousePos({ x: touch.clientX, y: touch.clientY });
                      setDragOffset({
                        x: touch.clientX - imgRect.left - x,
                        y: touch.clientY - imgRect.top - y
                      });
                    }}
                  >
                    {index + 1}
                  </div>
                </div>
              );
            })}
            </div>
            
            {/* 操作按鈕 */}
            <div className="flex flex-col gap-3">
              <div className="flex gap-3">
                <button
                  onClick={handleAddFace}
                  className="flex-1 px-4 py-3 bg-green-500 text-white rounded-2xl hover:bg-green-600 transition-all duration-200 font-medium"
                >
                  ➕ 新增人臉框
                </button>
                <button
                  onClick={handleDeleteFace}
                  disabled={selectedFaceIndex < 0}
                  className="flex-1 px-4 py-3 bg-red-500 text-white rounded-2xl hover:bg-red-600 transition-all duration-200 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  ➖ 刪除選中
                </button>
              </div>
              
              <div className="flex gap-3">
                <DrawerClose asChild>
                  <button className="flex-1 px-4 py-3 bg-gray-100 text-gray-600 rounded-2xl hover:bg-gray-200 transition-all duration-200 font-medium">
                    取消
                  </button>
                </DrawerClose>
                <button
                  onClick={handleSave}
                  className="flex-1 px-4 py-3 bg-gray-900 text-white rounded-2xl hover:bg-gray-800 transition-all duration-200 font-medium"
                >
                  💾 保存調整
                </button>
              </div>
            </div>
          </div>
        </div>
      </DrawerContent>
    </Drawer>
    );
  }

  // 桌面版使用自定義彈窗
  return (
    <div 
      className="fixed inset-0 z-50 flex justify-center items-center" 
      style={{ 
        backdropFilter: 'blur(8px)', 
        backgroundColor: 'rgba(0, 0, 0, 0.5)'
      }} 
      onClick={onClose}
    >
      <div 
        className="bg-white shadow-2xl rounded-3xl w-full max-w-4xl mx-4 animate-[scale-in_0.3s_ease-out] p-6 max-h-[90vh] overflow-y-auto"
        style={{
          touchAction: isDragging || isResizing ? 'none' : 'auto'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="text-center mb-6">
          <h3 className="text-xl font-bold text-gray-900 mb-2">✏️ 手動調整人臉框</h3>
          <p className="text-gray-600">點擊並拖拽來調整人臉框位置和大小</p>
        </div>
        
        <div className="space-y-6">
          {/* 圖片預覽區域 */}
          <div 
            className="relative mx-auto max-w-full"
            onClick={() => setSelectedFaceIndex(-1)}
            style={{ 
              touchAction: isDragging || isResizing ? 'none' : 'manipulation'
            }}
          >
            <img
              ref={adjustImageRef}
              src={selectedImage}
              alt="調整人臉框"
              className="w-full object-contain rounded-lg max-h-[500px]"
              style={{ maxWidth: '100%' }}
              onLoad={() => {
                // 圖片加載完成後強制重新渲染
                setAdjustableFaces(prev => [...prev]);
              }}
            />
            
            {/* 可拖拽的人臉框覆蓋層 */}
            {adjustImageRef.current && adjustableFaces.map((face, index) => {
              const imgElement = adjustImageRef.current!;
              
              // 計算縮放和位置
              const scaleX = imgElement.clientWidth / imgElement.naturalWidth;
              const scaleY = imgElement.clientHeight / imgElement.naturalHeight;
              const scale = Math.min(scaleX, scaleY);
              
              const displayWidth = imgElement.naturalWidth * scale;
              const displayHeight = imgElement.naturalHeight * scale;
              const offsetX = (imgElement.clientWidth - displayWidth) / 2;
              const offsetY = (imgElement.clientHeight - displayHeight) / 2;
              
              const x = face.box.x * scale + offsetX;
              const y = face.box.y * scale + offsetY;
              const width = face.box.width * scale;
              const height = face.box.height * scale;
              
              const isSelected = selectedFaceIndex === index;
              
              return (
                <div key={face.id || `face-${index}`}>
                  {/* 人臉框 */}
                  <div
                    className="absolute cursor-move transition-all duration-200 hover:scale-105"
                    style={{
                      left: `${x}px`,
                      top: `${y}px`,
                      width: `${width}px`,
                      height: `${height}px`,
                      borderWidth: '1px',
                      borderColor: isSelected ? '#dc2626' : '#16a34a',
                      touchAction: 'none',
                    }}
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedFaceIndex(index);
                    }}
                    onMouseDown={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setSelectedFaceIndex(index);
                      setIsDragging(true);
                      setHasMoved(false);
                      
                      const imgRect = imgElement.getBoundingClientRect();
                      setInitialMousePos({ x: e.clientX, y: e.clientY });
                      setDragOffset({
                        x: e.clientX - imgRect.left - x,
                        y: e.clientY - imgRect.top - y
                      });
                    }}
                    onTouchStart={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setSelectedFaceIndex(index);
                      setIsDragging(true);
                      setHasMoved(false);
                      
                      const imgRect = imgElement.getBoundingClientRect();
                      const touch = e.touches[0];
                      setInitialMousePos({ x: touch.clientX, y: touch.clientY });
                      setDragOffset({
                        x: touch.clientX - imgRect.left - x,
                        y: touch.clientY - imgRect.top - y
                      });
                    }}
                  >
                    {/* 四個角落的拖拽點 */}
                    {[
                      { position: 'top-left', cursor: 'nw-resize', style: { left: '-4px', top: '-4px' } },
                      { position: 'top-right', cursor: 'ne-resize', style: { right: '-4px', top: '-4px' } },
                      { position: 'bottom-left', cursor: 'sw-resize', style: { left: '-4px', bottom: '-4px' } },
                      { position: 'bottom-right', cursor: 'se-resize', style: { right: '-4px', bottom: '-4px' } }
                    ].map((corner) => (
                      <div 
                        key={corner.position}
                        className={`absolute w-2 h-2 rounded-full cursor-${corner.cursor}`}
                        style={{ 
                          ...corner.style,
                          backgroundColor: isSelected ? '#dc2626' : '#16a34a',
                          border: '1px solid white',
                          boxShadow: '0 1px 3px rgba(0,0,0,0.3)',
                          touchAction: 'none'
                        }}
                        onMouseDown={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          setSelectedFaceIndex(index);
                          setIsDragging(false);
                          setIsResizing(true);
                          setResizeHandle(corner.position);
                          setInitialBox({ ...face.box });
                          setInitialMousePos({ x: e.clientX, y: e.clientY });
                          setHasMoved(false);
                        }}
                        onTouchStart={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          setSelectedFaceIndex(index);
                          setIsDragging(false);
                          setIsResizing(true);
                          setResizeHandle(corner.position);
                          setInitialBox({ ...face.box });
                          const touch = e.touches[0];
                          setInitialMousePos({ x: touch.clientX, y: touch.clientY });
                          setHasMoved(false);
                        }}
                      />
                    ))}
                  </div>
                  
                  {/* 編號標籤 */}
                  <div
                    className="absolute text-white font-semibold flex items-center justify-center cursor-move hover:scale-110 transition-transform"
                    style={{
                      left: `${x + width + 6}px`,
                      top: `${y - 6}px`,
                      width: '14px',
                      height: '14px',
                      backgroundColor: isSelected ? '#dc2626' : '#16a34a',
                      fontSize: '10px',
                      boxShadow: '0 2px 4px rgba(0, 0, 0, 0.3)',
                      fontFamily: '-apple-system, BlinkMacSystemFont, sans-serif',
                      transform: 'translate(-50%, -50%)',
                      borderRadius: '2px',
                      touchAction: 'none',
                    }}
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedFaceIndex(index);
                    }}
                    onMouseDown={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setSelectedFaceIndex(index);
                      setIsDragging(true);
                      setHasMoved(false);
                      
                      const imgRect = imgElement.getBoundingClientRect();
                      setInitialMousePos({ x: e.clientX, y: e.clientY });
                      setDragOffset({
                        x: e.clientX - imgRect.left - x,
                        y: e.clientY - imgRect.top - y
                      });
                    }}
                    onTouchStart={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setSelectedFaceIndex(index);
                      setIsDragging(true);
                      setHasMoved(false);
                      
                      const imgRect = imgElement.getBoundingClientRect();
                      const touch = e.touches[0];
                      setInitialMousePos({ x: touch.clientX, y: touch.clientY });
                      setDragOffset({
                        x: touch.clientX - imgRect.left - x,
                        y: touch.clientY - imgRect.top - y
                      });
                    }}
                  >
                    {index + 1}
                  </div>
                </div>
              );
            })}
          </div>
          
          {/* 操作按鈕 */}
          <div className="flex flex-col gap-3">
            <div className="flex gap-3">
              <button
                onClick={handleAddFace}
                className="flex-1 px-4 py-3 bg-green-500 text-white rounded-2xl hover:bg-green-600 transition-all duration-200 font-medium"
              >
                ➕ 新增人臉框
              </button>
              <button
                onClick={handleDeleteFace}
                disabled={selectedFaceIndex < 0}
                className="flex-1 px-4 py-3 bg-red-500 text-white rounded-2xl hover:bg-red-600 transition-all duration-200 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                ➖ 刪除選中
              </button>
            </div>
            
            <div className="flex gap-3">
              <button
                onClick={onClose}
                className="flex-1 px-4 py-3 bg-gray-100 text-gray-600 rounded-2xl hover:bg-gray-200 transition-all duration-200 font-medium"
              >
                取消
              </button>
              <button
                onClick={handleSave}
                className="flex-1 px-4 py-3 bg-gray-900 text-white rounded-2xl hover:bg-gray-800 transition-all duration-200 font-medium"
              >
                💾 保存調整
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
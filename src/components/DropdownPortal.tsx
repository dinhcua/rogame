import React, { useEffect, useRef, useState } from 'react';
import ReactDOM from 'react-dom';

interface DropdownPortalProps {
  children: React.ReactNode;
  targetRef: React.RefObject<HTMLElement>;
  isOpen: boolean;
  onClose: () => void;
}

export default function DropdownPortal({ children, targetRef, isOpen, onClose }: DropdownPortalProps) {
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen || !targetRef.current) return;

    const updatePosition = () => {
      const rect = targetRef.current!.getBoundingClientRect();
      const viewportWidth = window.innerWidth;
      const dropdownWidth = 256; // w-64 = 16rem = 256px
      
      // Calculate position
      let left = rect.right - dropdownWidth;
      let top = rect.bottom + 8; // mt-2 = 0.5rem = 8px
      
      // Ensure dropdown doesn't go off-screen
      if (left < 0) left = 0;
      if (left + dropdownWidth > viewportWidth) {
        left = viewportWidth - dropdownWidth;
      }
      
      setPosition({ top, left });
    };

    updatePosition();
    window.addEventListener('resize', updatePosition);
    window.addEventListener('scroll', updatePosition, true);

    return () => {
      window.removeEventListener('resize', updatePosition);
      window.removeEventListener('scroll', updatePosition, true);
    };
  }, [isOpen, targetRef]);

  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node) &&
          targetRef.current && !targetRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen, onClose, targetRef]);

  if (!isOpen) return null;

  return ReactDOM.createPortal(
    <>
      <div
        ref={dropdownRef}
        className="fixed w-64 bg-game-card/95 backdrop-blur-sm rounded-xl border border-epic-border/50 shadow-2xl overflow-hidden"
        style={{
          top: `${position.top}px`,
          left: `${position.left}px`,
        }}
      >
        {children}
      </div>
    </>,
    document.body
  );
}
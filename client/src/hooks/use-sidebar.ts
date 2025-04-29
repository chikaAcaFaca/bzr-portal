import { useEffect, useState } from "react";

export function useSidebar() {
  const [isMobile, setIsMobile] = useState(window.innerWidth < 1024);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const sidebar = document.getElementById('sidebar');
    const mobileToggle = document.getElementById('mobile-toggle');
    
    const handleToggle = () => {
      const isCurrentlyHidden = sidebar?.classList.contains('hidden') || false;
      setIsOpen(isCurrentlyHidden);
      
      if (isCurrentlyHidden) {
        sidebar?.classList.remove('hidden');
        sidebar?.classList.add('fixed', 'inset-0', 'z-40');
        if (mobileToggle) {
          mobileToggle.innerHTML = '<i class="fas fa-times"></i>';
        }
      } else {
        sidebar?.classList.add('hidden');
        sidebar?.classList.remove('fixed', 'inset-0', 'z-40');
        if (mobileToggle) {
          mobileToggle.innerHTML = '<i class="fas fa-bars"></i>';
        }
      }
    };
    
    const closeSidebar = () => {
      if (isMobile && sidebar && !sidebar.classList.contains('hidden')) {
        sidebar.classList.add('hidden');
        sidebar.classList.remove('fixed', 'inset-0', 'z-40');
        if (mobileToggle) {
          mobileToggle.innerHTML = '<i class="fas fa-bars"></i>';
        }
        setIsOpen(false);
      }
    };
    
    const handleClickOutside = (event: MouseEvent) => {
      if (
        isMobile && 
        isOpen && 
        sidebar && 
        !sidebar.contains(event.target as Node) && 
        mobileToggle && 
        !mobileToggle.contains(event.target as Node)
      ) {
        closeSidebar();
      }
    };
    
    const handleResize = () => {
      const isNowMobile = window.innerWidth < 1024;
      setIsMobile(isNowMobile);
      
      // Adjust sidebar classes based on screen size
      if (!isNowMobile) {
        sidebar?.classList.remove('hidden', 'fixed', 'inset-0', 'z-40');
      } else if (!sidebar?.classList.contains('toggled-open')) {
        sidebar?.classList.add('hidden');
        setIsOpen(false);
      }
    };
    
    // Add event listeners
    mobileToggle?.addEventListener('click', handleToggle);
    window.addEventListener('resize', handleResize);
    document.addEventListener('mousedown', handleClickOutside);
    
    // Initial setup
    handleResize();
    
    // Cleanup
    return () => {
      mobileToggle?.removeEventListener('click', handleToggle);
      window.removeEventListener('resize', handleResize);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isMobile, isOpen]);

  return { isMobile, isOpen, setIsOpen };
}
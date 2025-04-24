import { useEffect, useState } from "react";

export function useMobileSidebar() {
  const [isMobile, setIsMobile] = useState(window.innerWidth < 1024);

  useEffect(() => {
    const sidebar = document.getElementById('sidebar');
    const mobileToggle = document.getElementById('mobile-toggle');
    
    const handleToggle = () => {
      if (sidebar?.classList.contains('hidden')) {
        sidebar.classList.remove('hidden');
        sidebar.classList.add('fixed', 'inset-0', 'z-40');
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
    
    const handleResize = () => {
      const isNowMobile = window.innerWidth < 1024;
      setIsMobile(isNowMobile);
      
      // Adjust sidebar classes based on screen size
      if (!isNowMobile) {
        sidebar?.classList.remove('hidden', 'fixed', 'inset-0', 'z-40');
      } else if (!sidebar?.classList.contains('toggled-open')) {
        sidebar?.classList.add('hidden');
      }
    };
    
    // Add event listeners
    mobileToggle?.addEventListener('click', handleToggle);
    window.addEventListener('resize', handleResize);
    
    // Initial setup
    handleResize();
    
    // Cleanup
    return () => {
      mobileToggle?.removeEventListener('click', handleToggle);
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  return isMobile;
}

import React from 'react';

const Footer = () => {
  return (
    <footer className="mt-12 py-6 border-t border-white/10">
      <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-white/60">
        <div>
          <p>© 2024 Rentala Property Management. All rights reserved.</p>
        </div>
        <div className="flex items-center gap-6">
          <a href="#" className="hover:text-white transition-colors">Help</a>
          <a href="#" className="hover:text-white transition-colors">Privacy</a>
          <a href="#" className="hover:text-white transition-colors">Terms</a>
          <span className="px-2 py-1 rounded-md bg-white/5 text-white/80 text-xs font-semibold">v1.0.0</span>
        </div>
      </div>
    </footer>
  );
};

export default Footer;

'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { LogOut, HelpCircle, User, ChevronDown } from 'lucide-react';

interface UserDropdownProps {
  userName: string;
  userInitial: string;
  avatarUrl?: string | null;
}

export function UserDropdown({ userName, userInitial, avatarUrl }: UserDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (
    <div className="relative" ref={dropdownRef}>
      <button 
        className="flex items-center space-x-3 p-2 rounded-md hover:bg-gray-100 transition-colors"
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
        aria-haspopup="true"
      >
        {avatarUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={avatarUrl} alt={userName} className="w-8 h-8 rounded-full object-cover" />
        ) : (
          <div className="w-8 h-8 rounded-full flex items-center justify-center text-white font-medium" style={{ backgroundColor: '#4bca59' }}>
            {userInitial}
          </div>
        )}
        <span className="text-sm font-medium text-gray-700">{userName}</span>
        <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>
      
      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-50 border border-gray-200">
          <Link 
            href="/configuracoes/perfil" 
            className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
            onClick={() => setIsOpen(false)}
          >
            <User className="w-4 h-4 mr-3" />
            Perfil
          </Link>
          <Link 
            href="/dashboard/help" 
            className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
            onClick={() => setIsOpen(false)}
          >
            <HelpCircle className="w-4 h-4 mr-3" />
            Ajuda
          </Link>
          <div className="border-t border-gray-100 my-1"></div>
          <form action="/api/signout" method="post">
            <button 
              type="submit"
              className="flex items-center w-[98%] rounded px-4 py-2 cursor-pointer text-sm text-white bg-red-500 hover:bg-red-600 transition-colors"
            >
              <LogOut className="w-4 h-4 mr-3" />
              Sair
            </button>
          </form>
        </div>
      )}
    </div>
  );
}

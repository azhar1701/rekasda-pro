import React, { Fragment } from 'react';
import { Menu, Transition } from '@headlessui/react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const DropdownMenu = Menu;
export const DropdownMenuTrigger = Menu.Button;

export const DropdownMenuContent = ({ 
  children, 
  align = 'end',
  className 
}: { 
  children: React.ReactNode; 
  align?: 'start' | 'end';
  className?: string;
}) => (
  <Transition
    as={Fragment}
    enter="transition ease-out duration-100"
    enterFrom="transform opacity-0 scale-95"
    enterTo="transform opacity-100 scale-100"
    leave="transition ease-in duration-75"
    leaveFrom="transform opacity-100 scale-100"
    leaveTo="transform opacity-0 scale-95"
  >
    <Menu.Items 
      className={cn(
        "absolute z-[100] mt-2 w-56 origin-top bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-none shadow-none focus:outline-none",
        align === 'end' ? 'right-0' : 'left-0',
        className
      )}
    >
      {children}
    </Menu.Items>
  </Transition>
);

export const DropdownMenuItem = ({ 
  children, 
  onClick,
  className 
}: { 
  children: React.ReactNode; 
  onClick?: () => void;
  className?: string;
}) => (
  <Menu.Item>
    {({ active }) => (
      <button
        onClick={onClick}
        className={cn(
          "group flex w-full items-center px-3 py-2 text-xs font-bold transition-colors",
          active ? "bg-slate-50 dark:bg-slate-800 text-[#0c3a66] dark:text-blue-400" : "text-slate-700 dark:text-slate-300",
          className
        )}
      >
        {children}
      </button>
    )}
  </Menu.Item>
);

export const DropdownMenuLabel = ({ 
  children,
  className
}: { 
  children: React.ReactNode;
  className?: string;
}) => (
  <div className={cn("px-3 py-2 text-[10px] font-black uppercase tracking-wider text-slate-500", className)}>
    {children}
  </div>
);

export const DropdownMenuSeparator = ({ className }: { className?: string }) => (
  <div className={cn("h-px bg-slate-100 dark:bg-slate-800 my-1", className)} />
);

import React, { useState, useRef, useEffect } from 'react';

interface Props {
 content: string;
}

export const HelpTooltip: React.FC<Props> = ({ content }) => {
 const [show, setShow] = useState(false);
 const [pinned, setPinned] = useState(false);
 const ref = useRef<HTMLDivElement>(null);

 useEffect(() => {
 const handleClickOutside = (e: MouseEvent) => {
 if (ref.current && !ref.current.contains(e.target as Node)) {
 setPinned(false);
 setShow(false);
 }
 };
 document.addEventListener('mousedown', handleClickOutside);
 return () => document.removeEventListener('mousedown', handleClickOutside);
 }, []);

 return (
 <div className="relative inline-block" ref={ref}>
 <button
 onMouseEnter={() => !pinned && setShow(true)}
 onMouseLeave={() => !pinned && setShow(false)}
 onClick={() => { setPinned(!pinned); setShow(!show); }}
 className="w-4 h-4 rounded-sm bg-slate-300 hover:bg-slate-400 text-white text-xs flex items-center justify-center transition-colors"
 type="button"
 >
 ?
 </button>
 {show && (
 <div className={`absolute top-full left-1/2 transform -translate-x-1/2 mt-2 p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-xs rounded-sm z-50 w-44 text-left transition-all duration-75 ease-out ${show ? 'opacity-100' : 'opacity-0'}`}>
 {content}
 <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-b-white"></div>
 </div>
 )}
 </div>
 );
};
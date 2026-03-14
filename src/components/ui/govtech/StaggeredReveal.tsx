import React, { Children, isValidElement, cloneElement } from 'react';

interface StaggeredRevealProps {
 children: React.ReactNode;
 baseDelay?: number;
 interval?: number;
 className?: string;
 direction?: 'up' | 'down' | 'left' | 'right';
}

export const StaggeredReveal: React.FC<StaggeredRevealProps> = ({
 children,
 baseDelay = 0,
 interval = 100,
 className = 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6',
 direction = 'up'
}) => {
 const directionClasses = {
 up: 'slide-in-from-bottom-2',
 down: 'slide-in-from-top-2',
 left: 'slide-in-from-right-2',
 right: 'slide-in-from-left-2',
 };

 return (
 <div className={className}>
 {Children.map(children, (child, index) => {
 if (!isValidElement(child)) return child;

 const delay = baseDelay + index * interval;
 const delayClass = `delay-${delay}`;

 return cloneElement(child as React.ReactElement<any>, {
 className: `${child.props.className || ''} animate-in fade-in ${directionClasses[direction]} duration-75 ${delayClass}`.trim(),
 });
 })}
 </div>
 );
};

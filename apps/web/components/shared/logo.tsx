'use client';

import Image from 'next/image';
import Link from 'next/link';
import { cn } from '@/lib/utils';

interface LogoProps {
  href?: string;
  showText?: boolean;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

const sizeClasses = {
  sm: 'h-8 w-auto',
  md: 'h-11 w-auto',
  lg: 'h-14 w-auto',
};

export function Logo({ href, showText = true, className, size = 'md' }: LogoProps) {
  const content = (
    <div className={cn('flex items-center', className)}>
      <Image
        src={showText ? '/grupo-movensa-horizontal.webp' : '/grupo-movensa.webp'}
        alt="Grupo Movensa"
        width={showText ? 360 : 180}
        height={120}
        priority
        unoptimized
        className={sizeClasses[size]}
      />
    </div>
  );

  return href ? (
    <Link href={href} className="transition-opacity hover:opacity-90">
      {content}
    </Link>
  ) : content;
}

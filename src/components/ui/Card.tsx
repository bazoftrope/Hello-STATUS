import { HTMLAttributes, ReactNode } from 'react';
import styles from './Card.module.css';

type Padding = 'none' | 'sm' | 'md' | 'lg' | 'xl';

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  padding?: Padding;
  maxWidth?: number | string;
  children: ReactNode;
}

function paddingClass(padding: Padding): string {
  if (padding === 'none') return '';
  return styles[`padding${padding.charAt(0).toUpperCase()}${padding.slice(1)}`];
}

export function Card({
  padding = 'none',
  maxWidth,
  className,
  style,
  children,
  ...rest
}: CardProps) {
  const mergedStyle = {
    ...(maxWidth !== undefined ? { maxWidth } : {}),
    ...style,
  };

  return (
    <div
      className={`${styles.card} ${paddingClass(padding)} ${className ?? ''}`.trim()}
      style={mergedStyle}
      {...rest}
    >
      {children}
    </div>
  );
}

interface CardHeaderProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
}

export function CardHeader({ className, children, ...rest }: CardHeaderProps) {
  return (
    <div className={`${styles.header} ${className ?? ''}`.trim()} {...rest}>
      {children}
    </div>
  );
}

interface CardBodyProps extends HTMLAttributes<HTMLDivElement> {
  padding?: Padding;
  children: ReactNode;
}

export function CardBody({ padding = 'md', className, children, ...rest }: CardBodyProps) {
  return (
    <div
      className={`${styles.body} ${paddingClass(padding)} ${className ?? ''}`.trim()}
      {...rest}
    >
      {children}
    </div>
  );
}

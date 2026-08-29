import { HTMLAttributes, ReactNode } from 'react';
import styles from './CenterPage.module.css';

interface CenterPageProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
}

export function CenterPage({ className, children, ...rest }: CenterPageProps) {
  return (
    <div className={`${styles.center} ${className ?? ''}`.trim()} {...rest}>
      {children}
    </div>
  );
}

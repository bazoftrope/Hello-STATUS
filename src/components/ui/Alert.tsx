import { HTMLAttributes, ReactNode } from 'react';
import styles from './Alert.module.css';

type AlertVariant = 'error' | 'success';

interface AlertProps extends HTMLAttributes<HTMLDivElement> {
  variant?: AlertVariant;
  children: ReactNode;
}

export function Alert({ variant = 'error', className, children, ...rest }: AlertProps) {
  const role = variant === 'error' ? 'alert' : 'status';

  return (
    <div className={`${styles.alert} ${styles[variant]} ${className ?? ''}`.trim()} role={role} {...rest}>
      {children}
    </div>
  );
}

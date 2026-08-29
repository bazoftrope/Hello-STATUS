import { HTMLAttributes, ReactNode } from 'react';
import styles from './Modal.module.css';

interface ModalProps extends HTMLAttributes<HTMLDivElement> {
  onClose?: () => void;
  children: ReactNode;
}

export function Modal({ onClose, className, children, ...rest }: ModalProps) {
  return (
    <div className={styles.overlay} onClick={onClose}>
      <div
        className={`${styles.modal} ${className ?? ''}`.trim()}
        onClick={(e) => e.stopPropagation()}
        {...rest}
      >
        {children}
      </div>
    </div>
  );
}

interface ModalHeaderProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
}

export function ModalHeader({ className, children, ...rest }: ModalHeaderProps) {
  return (
    <div className={`${styles.header} ${className ?? ''}`.trim()} {...rest}>
      {children}
    </div>
  );
}

interface ModalBodyProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
}

export function ModalBody({ className, children, ...rest }: ModalBodyProps) {
  return (
    <div className={`${styles.body} ${className ?? ''}`.trim()} {...rest}>
      {children}
    </div>
  );
}

interface ModalFooterProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
}

export function ModalFooter({ className, children, ...rest }: ModalFooterProps) {
  return (
    <div className={`${styles.footer} ${className ?? ''}`.trim()} {...rest}>
      {children}
    </div>
  );
}

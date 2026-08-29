import {
  InputHTMLAttributes,
  LabelHTMLAttributes,
  HTMLAttributes,
  ReactNode,
  TextareaHTMLAttributes,
} from 'react';
import styles from './Form.module.css';

interface FormGroupProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
}

export function FormGroup({ className, children, ...rest }: FormGroupProps) {
  return (
    <div className={`${styles.group} ${className ?? ''}`.trim()} {...rest}>
      {children}
    </div>
  );
}

interface FormLabelProps extends LabelHTMLAttributes<HTMLLabelElement> {
  children: ReactNode;
}

export function FormLabel({ className, children, ...rest }: FormLabelProps) {
  return (
    <label className={`${styles.label} ${className ?? ''}`.trim()} {...rest}>
      {children}
    </label>
  );
}

interface FormInputProps extends InputHTMLAttributes<HTMLInputElement> {
  autoWidth?: boolean;
}

export function FormInput({ autoWidth, className, ...rest }: FormInputProps) {
  return (
    <input
      className={`${styles.input} ${autoWidth ? styles.autoWidth : ''} ${className ?? ''}`.trim()}
      {...rest}
    />
  );
}

interface FormTextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  autoWidth?: boolean;
}

export function FormTextarea({ autoWidth, className, ...rest }: FormTextareaProps) {
  return (
    <textarea
      className={`${styles.input} ${autoWidth ? styles.autoWidth : ''} ${className ?? ''}`.trim()}
      {...rest}
    />
  );
}

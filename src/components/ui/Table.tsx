import { HTMLAttributes, TdHTMLAttributes, ThHTMLAttributes, ReactNode } from 'react';
import styles from './Table.module.css';

type Align = 'left' | 'center' | 'right';

interface TableProps extends HTMLAttributes<HTMLTableElement> {
  children: ReactNode;
}

export function Table({ className, children, ...rest }: TableProps) {
  return (
    <div className={styles.wrapper}>
      <table className={`${styles.table} ${className ?? ''}`.trim()} {...rest}>
        {children}
      </table>
    </div>
  );
}

interface ThProps extends ThHTMLAttributes<HTMLTableCellElement> {
  align?: Align;
  children?: ReactNode;
}

export function Th({ align, className, children, ...rest }: ThProps) {
  const classes = [styles.cell, styles.th, align ? styles[align] : '', className]
    .filter(Boolean)
    .join(' ');

  return (
    <th className={classes} {...rest}>
      {children}
    </th>
  );
}

interface TdProps extends TdHTMLAttributes<HTMLTableCellElement> {
  align?: Align;
  nowrap?: boolean;
  semibold?: boolean;
  bold?: boolean;
  children?: ReactNode;
}

export function Td({ align, nowrap, semibold, bold, className, children, ...rest }: TdProps) {
  const classes = [
    styles.cell,
    align ? styles[align] : '',
    nowrap ? styles.nowrap : '',
    semibold ? styles.semibold : '',
    bold ? styles.bold : '',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <td className={classes} {...rest}>
      {children}
    </td>
  );
}

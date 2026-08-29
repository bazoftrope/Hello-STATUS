import { ReactNode } from 'react';
import { Card, CardBody } from './Card';
import { CenterPage } from './CenterPage';
import styles from './ErrorCard.module.css';

interface ErrorCardProps {
  code: string;
  title: string;
  message: string;
  children?: ReactNode;
}

export function ErrorCard({ code, title, message, children }: ErrorCardProps) {
  return (
    <CenterPage>
      <Card maxWidth="400px" className="text-center">
        <CardBody padding="xl">
          <p className={styles.code}>{code}</p>
          <h1 className={styles.title}>{title}</h1>
          <p className={styles.message}>{message}</p>
          {children && <div className={styles.actions}>{children}</div>}
        </CardBody>
      </Card>
    </CenterPage>
  );
}

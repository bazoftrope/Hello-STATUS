import { useCallback, useEffect, useMemo, useState } from 'react';
import Head from 'next/head';
import { useSession } from 'next-auth/react';
import { Layout } from '@/components/Layout';
import {
  Alert,
  Badge,
  Button,
  Card,
  CardBody,
  PageHeader,
  Table,
  Td,
  Th,
} from '@/components/ui';
import styles from './employees.module.css';

interface Employee {
  id: string;
  email: string;
  fullName: string;
  role: 'employee' | 'manager';
  departmentId: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

function roleLabel(role: Employee['role']): string {
  return role === 'manager' ? 'Руководитель' : 'Сотрудник';
}

export default function EmployeesPage() {
  const { data: session } = useSession();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    try {
      const res = await fetch('/api/users');
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.error || 'Ошибка загрузки сотрудников');
      }
      setEmployees(data);
      setError('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка загрузки сотрудников');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const handleSetActive = async (employee: Employee, isActive: boolean) => {
    const action = isActive ? 'активировать' : 'деактивировать';
    if (!window.confirm(`${action} пользователя «${employee.fullName}»?`)) return;

    setIsSaving(true);
    setError('');
    try {
      const res = await fetch(`/api/users/${employee.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.error || 'Ошибка изменения статуса');
      }
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка изменения статуса');
    } finally {
      setIsSaving(false);
    }
  };

  const sortedEmployees = useMemo(() => {
    return [...employees].sort((a, b) => {
      if (a.isActive !== b.isActive) return a.isActive ? 1 : -1;
      return a.fullName.localeCompare(b.fullName, 'ru');
    });
  }, [employees]);

  const activeCount = employees.filter((e) => e.isActive).length;
  const inactiveCount = employees.length - activeCount;

  return (
    <Layout>
      <Head>
        <title>Сотрудники - Статус</title>
      </Head>

      <PageHeader
        title="Сотрудники"
        subtitle={`Активных: ${activeCount} · Не активировано: ${inactiveCount}`}
      />

      <Card>
        <CardBody>
          {error && <Alert variant="error">{error}</Alert>}

          {isLoading ? (
            <p className={`text-muted text-center ${styles.emptyState}`}>Загрузка...</p>
          ) : sortedEmployees.length === 0 ? (
            <p className={`text-muted text-center ${styles.emptyState}`}>
              Сотрудники не найдены. Новые регистрации появятся здесь после отправки заявки.
            </p>
          ) : (
            <Table>
              <thead>
                <tr>
                  <Th>ФИО</Th>
                  <Th>Email</Th>
                  <Th>Роль</Th>
                  <Th>Статус</Th>
                  <Th>Действия</Th>
                </tr>
              </thead>
              <tbody>
                {sortedEmployees.map((employee) => (
                  <tr key={employee.id}>
                    <Td semibold>{employee.fullName}</Td>
                    <Td className="text-muted">{employee.email}</Td>
                    <Td>{roleLabel(employee.role)}</Td>
                    <Td>
                      {employee.isActive ? (
                        <Badge variant="active">Активен</Badge>
                      ) : (
                        <Badge variant="archived">Не активирован</Badge>
                      )}
                    </Td>
                    <Td>
                      <div className="flex gap-sm">
                        {employee.isActive && session?.user?.id === employee.id ? (
                          <span className="text-muted">Это вы</span>
                        ) : employee.isActive ? (
                          <Button
                            variant="outline"
                            size="sm"
                            disabled={isSaving}
                            onClick={() => handleSetActive(employee, false)}
                          >
                            Деактивировать
                          </Button>
                        ) : (
                          <Button
                            variant="success"
                            size="sm"
                            disabled={isSaving}
                            onClick={() => handleSetActive(employee, true)}
                          >
                            Подтвердить
                          </Button>
                        )}
                      </div>
                    </Td>
                  </tr>
                ))}
              </tbody>
            </Table>
          )}
        </CardBody>
      </Card>
    </Layout>
  );
}

import React, { useEffect, useId, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useI18n } from '../../use-i18n.js';
import { useSession } from '../../use-session.js';

const roleOptions = [
  {
    value: 'ops_admin',
    labelKey: 'ops.userManagement.roles.opsAdmin',
  },
  {
    value: 'ops_dispatcher',
    labelKey: 'ops.userManagement.roles.opsDispatcher',
  },
  {
    value: 'ops_support',
    labelKey: 'ops.userManagement.roles.opsSupport',
  },
];

const statusOptions = [
  {
    value: 'active',
    labelKey: 'ops.userManagement.statuses.active',
  },
  {
    value: 'suspended',
    labelKey: 'ops.userManagement.statuses.suspended',
  },
  {
    value: 'pending',
    labelKey: 'ops.userManagement.statuses.pending',
  },
];

const emptyInviteForm = {
  name: '',
  email: '',
  phone: '',
  role: 'ops_support',
  account_status: 'active',
  password: '',
  password_confirmation: '',
};

export function OpsUserManagementBoard() {
  const { api, session } = useSession();
  const { formatDateTime, t } = useI18n();
  const queryClient = useQueryClient();
  const [inviteForm, setInviteForm] = useState(emptyInviteForm);
  const [feedback, setFeedback] = useState('');

  const { data: users = [], isLoading } = useQuery({
    queryKey: ['ops-users'],
    queryFn: () => api.listOpsUsers(),
  });

  const createMutation = useMutation({
    mutationFn: (payload) => api.createOpsUser(payload),
    onSuccess: (user) => {
      queryClient.setQueryData(['ops-users'], (current = []) =>
        [...current, user].sort((left, right) =>
          left.name.localeCompare(right.name)
        )
      );
      setInviteForm(emptyInviteForm);
      setFeedback(t('ops.userManagement.inviteSuccess', { name: user.name }));
    },
    onError: (error) => {
      setFeedback(readApiError(error) ?? t('ops.userManagement.inviteFailed'));
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ userUuid, payload }) => api.updateOpsUser(userUuid, payload),
    onSuccess: (user) => {
      queryClient.setQueryData(['ops-users'], (current = []) =>
        current
          .map((entry) => (entry.uuid === user.uuid ? user : entry))
          .sort((left, right) => left.name.localeCompare(right.name))
      );
      setFeedback(t('ops.userManagement.updateSuccess', { name: user.name }));
    },
    onError: (error) => {
      setFeedback(readApiError(error) ?? t('ops.userManagement.updateFailed'));
    },
  });

  const updateInviteField = (field, value) => {
    setInviteForm((current) => ({
      ...current,
      [field]: value,
    }));
  };

  const handleInviteSubmit = (event) => {
    event.preventDefault();

    createMutation.mutate({
      ...inviteForm,
      email: inviteForm.email.trim(),
      name: inviteForm.name.trim(),
      phone: inviteForm.phone.trim() || null,
    });
  };

  return (
    <section className="board panel">
      <div className="board-header">
        <div>
          <span className="eyebrow">{t('ops.userManagement.eyebrow')}</span>
          <h2>{t('ops.userManagement.title')}</h2>
        </div>
        <span className="status-pill" data-tone="info">
          {t('ops.userManagement.totalUsers', { count: users.length })}
        </span>
      </div>

      <div className="catalog-layout">
        <form
          className="catalog-panel panel"
          data-testid="ops-user-invite-form"
          onSubmit={handleInviteSubmit}
        >
          <div className="board-header">
            <div>
              <span className="eyebrow">
                {t('ops.userManagement.inviteEyebrow')}
              </span>
              <h3>{t('ops.userManagement.inviteTitle')}</h3>
            </div>
          </div>

          <p>{t('ops.userManagement.inviteDescription')}</p>

          <div className="field-grid">
            <label className="field-stack">
              <span>{t('ops.userManagement.name')}</span>
              <input
                aria-label={t('ops.userManagement.name')}
                autoComplete="name"
                onChange={(event) =>
                  updateInviteField('name', event.target.value)
                }
                required
                value={inviteForm.name}
              />
            </label>
            <label className="field-stack">
              <span>{t('ops.userManagement.email')}</span>
              <input
                aria-label={t('ops.userManagement.email')}
                autoComplete="email"
                inputMode="email"
                onChange={(event) =>
                  updateInviteField('email', event.target.value)
                }
                required
                type="email"
                value={inviteForm.email}
              />
            </label>
            <label className="field-stack">
              <span>{t('ops.userManagement.phoneOptional')}</span>
              <input
                aria-label={t('ops.userManagement.phoneOptional')}
                autoComplete="tel"
                inputMode="tel"
                onChange={(event) =>
                  updateInviteField('phone', event.target.value)
                }
                value={inviteForm.phone}
              />
            </label>
            <label className="field-stack">
              <span>{t('ops.userManagement.role')}</span>
              <select
                aria-label={t('ops.userManagement.role')}
                onChange={(event) =>
                  updateInviteField('role', event.target.value)
                }
                value={inviteForm.role}
              >
                {roleOptions.map((role) => (
                  <option key={role.value} value={role.value}>
                    {t(role.labelKey)}
                  </option>
                ))}
              </select>
            </label>
            <label className="field-stack">
              <span>{t('ops.userManagement.status')}</span>
              <select
                aria-label={t('ops.userManagement.status')}
                onChange={(event) =>
                  updateInviteField('account_status', event.target.value)
                }
                value={inviteForm.account_status}
              >
                {statusOptions.map((status) => (
                  <option key={status.value} value={status.value}>
                    {t(status.labelKey)}
                  </option>
                ))}
              </select>
            </label>
            <label className="field-stack">
              <span>{t('ops.userManagement.temporaryPassword')}</span>
              <input
                aria-label={t('ops.userManagement.temporaryPassword')}
                autoComplete="new-password"
                minLength={8}
                onChange={(event) =>
                  updateInviteField('password', event.target.value)
                }
                required
                type="password"
                value={inviteForm.password}
              />
            </label>
            <label className="field-stack">
              <span>{t('ops.userManagement.confirmTemporaryPassword')}</span>
              <input
                aria-label={t('ops.userManagement.confirmTemporaryPassword')}
                autoComplete="new-password"
                minLength={8}
                onChange={(event) =>
                  updateInviteField('password_confirmation', event.target.value)
                }
                required
                type="password"
                value={inviteForm.password_confirmation}
              />
            </label>
          </div>

          <div className="card-actions">
            <button
              className="action-button"
              disabled={createMutation.isPending}
              type="submit"
            >
              {createMutation.isPending
                ? t('ops.userManagement.inviting')
                : t('ops.userManagement.inviteUser')}
            </button>
          </div>
        </form>

        <aside className="catalog-sidebar">
          <section className="catalog-panel panel">
            <span className="eyebrow">
              {t('ops.userManagement.directoryEyebrow')}
            </span>
            <h3>{t('ops.userManagement.directoryTitle')}</h3>
            <p>{t('ops.userManagement.directoryDescription')}</p>
          </section>
          <section className="catalog-panel panel">
            <span className="eyebrow">
              {t('ops.userManagement.currentAdmin')}
            </span>
            <h3>{session.user?.name ?? session.label}</h3>
            <p>
              {session.user?.email
                ? t('ops.userManagement.currentAdminDescription', {
                    email: session.user.email,
                  })
                : t('ops.userManagement.demoAdminDescription')}
            </p>
          </section>
        </aside>
      </div>

      <section className="catalog-panel panel">
        <div className="board-header">
          <div>
            <span className="eyebrow">
              {t('ops.userManagement.userDirectory')}
            </span>
            <h3>{t('ops.userManagement.userDirectoryTitle')}</h3>
          </div>
        </div>

        {isLoading ? (
          <div className="empty-state">
            <h3>{t('ops.userManagement.loadingTitle')}</h3>
            <p>{t('ops.userManagement.loadingDescription')}</p>
          </div>
        ) : users.length > 0 ? (
          <div className="board-grid">
            {users.map((user) => (
              <OpsUserCard
                key={user.uuid}
                formatDateTime={formatDateTime}
                session={session}
                t={t}
                updateMutation={updateMutation}
                user={user}
              />
            ))}
          </div>
        ) : (
          <div className="empty-state">
            <h3>{t('ops.userManagement.noUsersTitle')}</h3>
            <p>{t('ops.userManagement.noUsersDescription')}</p>
          </div>
        )}
      </section>

      {feedback ? (
        <p aria-live="polite" className="inline-feedback" role="status">
          {feedback}
        </p>
      ) : null}
    </section>
  );
}

function OpsUserCard({ formatDateTime, session, t, updateMutation, user }) {
  const nameId = useId();
  const phoneId = useId();
  const roleId = useId();
  const statusId = useId();
  const [form, setForm] = useState(() => userFormFromUser(user));
  const isCurrentUser =
    session.user?.uuid === user.uuid || session.user?.email === user.email;
  const isSuspended = user.account_status === 'suspended';

  useEffect(() => {
    setForm(userFormFromUser(user));
  }, [user]);

  const updateField = (field, value) => {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  };

  const saveUser = (event) => {
    event.preventDefault();

    updateMutation.mutate({
      userUuid: user.uuid,
      payload: {
        name: form.name.trim(),
        phone: form.phone.trim() || null,
        role: form.role,
        account_status: form.account_status,
      },
    });
  };

  const setStatus = (accountStatus) => {
    updateMutation.mutate({
      userUuid: user.uuid,
      payload: {
        account_status: accountStatus,
      },
    });
  };

  return (
    <article className="board-card" data-testid={`ops-user-${user.email}`}>
      <header>
        <div>
          <span className="eyebrow">{user.email}</span>
          <h3>{user.name}</h3>
        </div>
        <span className="status-stack">
          {isCurrentUser ? (
            <span className="status-pill" data-tone="info">
              {t('ops.userManagement.currentUser')}
            </span>
          ) : null}
          <span
            className="status-pill"
            data-tone={statusTone(user.account_status)}
          >
            {statusLabel(t, user.account_status)}
          </span>
        </span>
      </header>

      <form className="user-management-form" onSubmit={saveUser}>
        <label className="field-stack" htmlFor={nameId}>
          <span>{t('ops.userManagement.name')}</span>
          <input
            id={nameId}
            onChange={(event) => updateField('name', event.target.value)}
            required
            value={form.name}
          />
        </label>
        <label className="field-stack" htmlFor={phoneId}>
          <span>{t('ops.userManagement.phoneOptional')}</span>
          <input
            id={phoneId}
            inputMode="tel"
            onChange={(event) => updateField('phone', event.target.value)}
            value={form.phone}
          />
        </label>
        <div className="field-grid">
          <label className="field-stack" htmlFor={roleId}>
            <span>{t('ops.userManagement.role')}</span>
            <select
              disabled={isCurrentUser}
              id={roleId}
              onChange={(event) => updateField('role', event.target.value)}
              value={form.role}
            >
              {roleOptions.map((role) => (
                <option key={role.value} value={role.value}>
                  {t(role.labelKey)}
                </option>
              ))}
            </select>
          </label>
          <label className="field-stack" htmlFor={statusId}>
            <span>{t('ops.userManagement.status')}</span>
            <select
              disabled={isCurrentUser}
              id={statusId}
              onChange={(event) =>
                updateField('account_status', event.target.value)
              }
              value={form.account_status}
            >
              {statusOptions.map((status) => (
                <option key={status.value} value={status.value}>
                  {t(status.labelKey)}
                </option>
              ))}
            </select>
          </label>
        </div>

        <dl>
          <div>
            <dt>{t('ops.userManagement.createdAt')}</dt>
            <dd>{formatNullableDate(user.created_at, formatDateTime, t)}</dd>
          </div>
          <div>
            <dt>{t('ops.userManagement.lastLogin')}</dt>
            <dd>{formatNullableDate(user.last_login_at, formatDateTime, t)}</dd>
          </div>
        </dl>

        <footer className="card-actions">
          <button
            className="action-button"
            disabled={updateMutation.isPending}
            type="submit"
          >
            {updateMutation.isPending
              ? t('ops.userManagement.saving')
              : t('ops.userManagement.saveUser')}
          </button>
          {isSuspended ? (
            <button
              className="action-button secondary"
              disabled={updateMutation.isPending}
              onClick={() => setStatus('active')}
              type="button"
            >
              {t('ops.userManagement.reactivateUser')}
            </button>
          ) : (
            <button
              className="action-button secondary"
              disabled={isCurrentUser || updateMutation.isPending}
              onClick={() => setStatus('suspended')}
              type="button"
            >
              {t('ops.userManagement.disableUser')}
            </button>
          )}
        </footer>
      </form>
    </article>
  );
}

function userFormFromUser(user) {
  return {
    name: user.name,
    phone: user.phone ?? '',
    role: user.roles[0] ?? 'ops_support',
    account_status: user.account_status,
  };
}

function statusTone(status) {
  if (status === 'active') {
    return 'success';
  }

  if (status === 'pending') {
    return 'warm';
  }

  return 'alert';
}

function statusLabel(t, status) {
  const statusOption = statusOptions.find((option) => option.value === status);

  return statusOption ? t(statusOption.labelKey) : status;
}

function formatNullableDate(value, formatDateTime, t) {
  if (!value) {
    return t('ops.userManagement.never');
  }

  return formatDateTime(value);
}

function readApiError(error) {
  const errors = error?.response?.data?.errors;
  const firstError = errors ? Object.values(errors).flat()[0] : null;
  const responseMessage = error?.response?.data?.message;

  if (typeof firstError === 'string') {
    return firstError;
  }

  return typeof responseMessage === 'string' ? responseMessage : null;
}

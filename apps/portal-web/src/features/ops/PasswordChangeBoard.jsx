import React, { useId, useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { useI18n } from '../../use-i18n.js';
import { useSession } from '../../use-session.js';

const emptyPasswordForm = {
  current_password: '',
  password: '',
  password_confirmation: '',
};

export function PasswordChangeBoard() {
  const { api, session } = useSession();
  const { t } = useI18n();
  const currentPasswordId = useId();
  const newPasswordId = useId();
  const confirmPasswordId = useId();
  const [form, setForm] = useState(emptyPasswordForm);
  const [feedback, setFeedback] = useState('');

  const mutation = useMutation({
    mutationFn: (payload) => api.changePassword(payload),
    onSuccess: (result) => {
      setForm(emptyPasswordForm);
      setFeedback(result?.message ?? t('ops.accountSecurity.success'));
    },
    onError: (error) => {
      setFeedback(readApiError(error) ?? t('ops.accountSecurity.review'));
    },
  });

  const updateField = (field, value) => {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  };

  const handleSubmit = (event) => {
    event.preventDefault();

    if (form.password !== form.password_confirmation) {
      setFeedback(t('ops.accountSecurity.mismatch'));
      return;
    }

    mutation.mutate(form);
  };

  return (
    <section className="board panel">
      <div className="board-header">
        <div>
          <span className="eyebrow">{t('ops.accountSecurity.eyebrow')}</span>
          <h2>{t('ops.accountSecurity.title')}</h2>
        </div>
        <span className="status-pill" data-tone="success">
          {t('ops.accountSecurity.security')}
        </span>
      </div>

      <div className="catalog-layout">
        <form className="catalog-panel panel" onSubmit={handleSubmit}>
          <div className="board-header">
            <div>
              <span className="eyebrow">
                {t('ops.accountSecurity.passwordForm')}
              </span>
              <h3>{t('ops.accountSecurity.passwordFormTitle')}</h3>
            </div>
          </div>

          <p>{t('ops.accountSecurity.description')}</p>

          <label className="field-stack" htmlFor={currentPasswordId}>
            <span>{t('ops.accountSecurity.currentPassword')}</span>
            <input
              autoComplete="current-password"
              id={currentPasswordId}
              onChange={(event) =>
                updateField('current_password', event.target.value)
              }
              required
              type="password"
              value={form.current_password}
            />
          </label>

          <div className="field-grid">
            <label className="field-stack" htmlFor={newPasswordId}>
              <span>{t('ops.accountSecurity.newPassword')}</span>
              <input
                autoComplete="new-password"
                id={newPasswordId}
                minLength={8}
                onChange={(event) =>
                  updateField('password', event.target.value)
                }
                required
                type="password"
                value={form.password}
              />
            </label>
            <label className="field-stack" htmlFor={confirmPasswordId}>
              <span>{t('ops.accountSecurity.confirmPassword')}</span>
              <input
                autoComplete="new-password"
                id={confirmPasswordId}
                minLength={8}
                onChange={(event) =>
                  updateField('password_confirmation', event.target.value)
                }
                required
                type="password"
                value={form.password_confirmation}
              />
            </label>
          </div>

          <div className="card-actions">
            <button
              className="action-button"
              disabled={mutation.isPending}
              type="submit"
            >
              {mutation.isPending
                ? t('ops.accountSecurity.updatingPassword')
                : t('ops.accountSecurity.updatePassword')}
            </button>
          </div>
        </form>

        <aside className="catalog-sidebar">
          <section className="catalog-panel panel">
            <span className="eyebrow">
              {t('ops.accountSecurity.sessionOwner')}
            </span>
            <h3>{session.user?.name ?? session.label}</h3>
            <p>
              {session.user?.email
                ? t('ops.accountSecurity.signedInAs', {
                    email: session.user.email,
                  })
                : t('ops.accountSecurity.noStoredUser')}
            </p>
          </section>

          <section className="catalog-panel panel">
            <span className="eyebrow">
              {t('ops.accountSecurity.passwordPolicy')}
            </span>
            <h3>{t('ops.accountSecurity.passwordPolicyTitle')}</h3>
            <p>{t('ops.accountSecurity.passwordPolicyCopy')}</p>
            <p>{t('ops.accountSecurity.otherSessions')}</p>
          </section>
        </aside>
      </div>

      {feedback ? (
        <p aria-live="polite" className="inline-feedback" role="status">
          {feedback}
        </p>
      ) : null}
    </section>
  );
}

function readApiError(error) {
  const currentPasswordMessages =
    error?.response?.data?.errors?.current_password;
  const passwordMessages = error?.response?.data?.errors?.password;
  const responseMessage = error?.response?.data?.message;

  if (
    Array.isArray(currentPasswordMessages) &&
    currentPasswordMessages.length > 0
  ) {
    return currentPasswordMessages[0];
  }

  if (Array.isArray(passwordMessages) && passwordMessages.length > 0) {
    return passwordMessages[0];
  }

  return typeof responseMessage === 'string' ? responseMessage : null;
}

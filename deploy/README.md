# Docker VM Deployment Target

Talabix staging and initial production deployments target a Linux VM with Docker Compose, SSH access from GitHub Actions, and an external TLS reverse proxy or load balancer.

## Target Shape

- One VM per environment.
- Docker Compose runs API, worker, scheduler, Reverb, portal, MySQL, and Redis services.
- The reverse proxy terminates TLS and forwards:
  - API traffic to `API_FORWARD_PORT`.
  - portal traffic to `PORTAL_FORWARD_PORT`.
  - Reverb websocket traffic to `REVERB_FORWARD_PORT`.
- GitHub Environments hold environment-specific secrets.

## GitHub Environment Secrets

Create `staging` and `production` GitHub Environments with the same secret names:

| Secret                 | Purpose                                                                 |
| ---------------------- | ----------------------------------------------------------------------- |
| `DEPLOY_HOST`          | VM hostname or IP.                                                      |
| `DEPLOY_USER`          | SSH user with Docker access.                                            |
| `DEPLOY_SSH_KEY`       | Private key for the deploy user.                                        |
| `DEPLOY_PATH`          | Absolute path where the repository is synced on the VM.                 |
| `ROOT_ENV_B64`         | Base64-encoded root `.env` file for Docker-facing ports.                |
| `API_ENV_B64`          | Base64-encoded `apps/api/.env` file for Laravel.                        |
| `READINESS_CHECK_KEY`  | Shared key expected by `/api/v1/readiness`.                             |
| `DEPLOY_READINESS_URL` | Full readiness URL, usually `https://api.example.com/api/v1/readiness`. |

Generate the encoded env files locally with:

```powershell
[Convert]::ToBase64String([Text.Encoding]::UTF8.GetBytes((Get-Content .env -Raw)))
[Convert]::ToBase64String([Text.Encoding]::UTF8.GetBytes((Get-Content apps/api/.env -Raw)))
```

## Manual VM Preparation

1. Install Docker Engine and the Docker Compose plugin.
2. Create the deploy user and allow it to run Docker.
3. Create `DEPLOY_PATH`.
4. Configure the reverse proxy routes.
5. Add the GitHub deploy public key to the deploy user's `authorized_keys`.

The GitHub workflow handles repo sync, env file materialization, Composer install, migrations, service restart, and readiness smoke checks.

# CI/CD Pipeline Demo

A tiny Node/Express todo app whose real purpose is the **automated pipeline** around it.

```
git push  ->  Lint + Test  ->  Build Docker image  ->  Push to GHCR  ->  Deploy  ->  Notify
```

## Pipeline (`.github/workflows/ci-cd.yml`)

| Job | Runs on | What it does |
|-----|---------|--------------|
| `test` | every push and PR | `npm ci`, ESLint, Jest with coverage (npm cache enabled) |
| `docker` | push to `main` | builds a multi-stage image, pushes to GHCR tagged with commit SHA and `latest` (layer cache via GitHub Actions cache) |
| `deploy` | after `docker` | calls a Render deploy hook (skipped if secret is not set) |
| `notify` | always | posts the result to Discord (skipped if secret is not set) |

## Run locally

```bash
npm install
npm test
npm run lint
npm start            # http://localhost:3000
```

```bash
docker build -t cicd-demo --build-arg GIT_SHA=local .
docker run -p 3000:3000 cicd-demo
```

## Setup steps

1. Create a GitHub repo and push this project to `main`.
2. Push a commit and watch the **Actions** tab. Lint, test, build and push should go green.
3. (Optional) Add secrets under *Settings > Secrets and variables > Actions*:
   - `RENDER_DEPLOY_HOOK_URL` for auto deploy to Render
   - `DISCORD_WEBHOOK_URL` for notifications
4. Make the GHCR package public (Profile > Packages > the package > Package settings) so Render or Kubernetes can pull it.
5. **Branch protection:** *Settings > Branches > Add rule* for `main`, then tick *Require status checks to pass* and select **Lint and test**.

## Deploy to Kubernetes (kind or minikube)

```bash
kind create cluster
# edit k8s/deployment.yaml: set your GitHub username in the image
kubectl apply -f k8s/
kubectl get pods
kubectl port-forward svc/cicd-demo 8080:80   # http://localhost:8080
```

## Rollback

Every image is tagged with its commit SHA, so rolling back is just redeploying an older tag:

```bash
kubectl set image deployment/cicd-demo app=ghcr.io/<user>/cicd-pipeline-demo:<old-sha>
# or: kubectl rollout undo deployment/cicd-demo
```

## Ideas to extend

- Add a Trivy image scan step before pushing
- Split into staging and production environments with manual approval
- Add a Kubernetes deploy job using a kubeconfig stored in secrets

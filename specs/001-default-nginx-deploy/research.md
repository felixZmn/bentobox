# Research: Default Nginx Image

## 1. Server image

- **Decision**: Use the official image `docker.io/library/nginx:1.31.8-alpine-slim`. Pin that tag in `helm/values.yaml`. Do not default the tag from the chart `appVersion`. Reject an empty tag and the tag `latest` when the chart renders.
- **Rationale**: The project already runs this official tag as the base of the custom image. Keeping the tag means this change does not also upgrade nginx. A later upgrade is one edit to `image.tag`. The chart version can move when the page or chart changes without publishing a new image.
- **Alternatives considered**: Keep building `ghcr.io/felixzmn/docker/bentobox` (rejected: the spec and constitution forbid a project image). `nginxinc/nginx-unprivileged` (rejected: a second image line, while the official library image already supports a non-root read-only start when the config and writable paths are mounted). Tracking `latest` (rejected: constitution).

## 2. How the page is attached

- **Decision**: Extend the existing chart ConfigMap so it carries `index.html`, `style.css`, `script.js`, `config.json`, and `server.conf`. Mount each key read-only with `subPath`. Do not add a pre-provisioned volume.
- **Rationale**: The chart already ships visitor config this way. The page is a few small text files, well under the ConfigMap size limit. One ConfigMap means `helm upgrade` ships the site. The writable `emptyDir` mounted at `/tmp` is scratch space for nginx, not a second way to attach the page.
- **Alternatives considered**: A volume prepared outside the chart (rejected: the site would not ship with the chart, and the operator would keep a second object in sync). Two mechanisms at once (rejected: spec and constitution allow one). Baking the files into an image (rejected: that is the current design).

## 3. Where the canonical files live

- **Decision**: Move the page and server settings into the chart as `helm/files/index.html`, `helm/files/style.css`, `helm/files/script.js`, `helm/files/config.json`, and `helm/files/server.conf`. Delete `html/`, the root `server.conf`, `Dockerfile`, and `.dockerignore`. Local preview serves `helm/files/`. Deployed `config.json` is still rendered from `helm/values.yaml`, which is the existing deploy path for visitor settings.
- **Rationale**: `helm package` and `.Files.Get` only read files inside the chart. `helm/templates/config.yaml` cannot read `html/` or the root `server.conf`. Copying those bodies into `values.yaml` would make a second page that drifts from local preview. A new directory is the smallest way to keep one copy and still ship it.
- **Alternatives considered**: Leave the files in place and duplicate them in the template (rejected: two copies). Move the whole chart to the repository root so `html/` is inside the chart (rejected: it rewrites every chart path for the same result).

## 4. Non-root read-only start

- **Decision**: Replace `/etc/nginx/nginx.conf` with the mounted `server.conf`. That file is the full main config: no `user` directive, `pid /tmp/nginx.pid`, logs to stdout and stderr, temp paths under `/tmp`, `listen 8080`, and no `include` of `/etc/nginx/conf.d/*.conf`. Mount one `emptyDir` at `/tmp` with a size limit. Set `runAsUser` and `runAsGroup` to `1000` and `fsGroup` to `1000`. Keep `runAsNonRoot`, `readOnlyRootFilesystem`, and `capabilities.drop: ALL`. Do not mount `/var/cache/nginx` or `/run`. Do not replace the image command.
- **Rationale**: The official image documents this pattern for an arbitrary non-root user on a read-only root. Nginx creates `/tmp/client_temp` and the other temp directories when `/tmp` exists and is writable. `fsGroup` is what makes the `emptyDir` writable by user 1000. The stock `default.conf` stays in the image and is never loaded, so the welcome page is not served. The entrypoint's note that it cannot edit `default.conf` on a read-only filesystem is expected and is not a failed start. Port 8080 stays aligned with the existing Service, so `helm/templates/service.yaml` does not change.
- **Alternatives considered**: Run as root so the stock config can bind port 80 (rejected: weakens the chart). Wrap the image to add a user and temp directories (rejected: constitution). Keep the current cache and `/run` mounts plus a shell command that creates directories (rejected: extra mounts and a custom command the full config makes unnecessary). `nginxinc/nginx-unprivileged` (rejected: see decision 1).

## 5. Rollout when the page changes

- **Decision**: Put a pod-template checksum over the ConfigMap contents, including the packaged files and `.Values.config`.
- **Rationale**: `subPath` mounts do not refresh in a running pod. The checksum makes `helm upgrade` roll the pod when the page, server settings, or visitor config change, which is the spec's one-redeploy update.
- **Alternatives considered**: Rely on a ConfigMap update alone (rejected: existing pods would keep the old files). An extra reloader container (rejected: a new component).

## 6. Registry credentials

- **Decision**: Default `imagePullSecrets` to an empty list. The public official image does not need `regcred`.
- **Rationale**: A required pull secret would mean the default image is not enough to ship the site. A private mirror may set `imagePullSecrets` to a name that already exists outside the repo. The chart must not contain registry credentials.
- **Alternatives considered**: Keep `regcred` as the default (rejected: installs fail without a secret, and the name points at the old private image).

## 7. Icon font

- **Decision**: Move the existing `html/iconoir.css` to `helm/files/iconoir.css` and publish `helm/files/iconoir.css.gz` on the ConfigMap. Nginx serves `/iconoir.css` with `gzip_static` for clients that accept gzip. The `index.html` link stays unchanged.
- **Rationale**: The stylesheet is already in the repository (about 2.8MB) and the current image copies it with the page. A ConfigMap cannot hold the uncompressed file. The gzip copy is about 249KB, so the same ConfigMap can still serve the icons. Local preview serves the uncompressed file directly.
- **Alternatives considered**: Omit the stylesheet (rejected: the deployed page would lose its icons). A second volume or a custom image for this one file (rejected: one attachment path, no project image).

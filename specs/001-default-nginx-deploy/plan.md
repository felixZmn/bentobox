# Implementation Plan: Default Nginx Image

**Branch**: `001-default-nginx-deploy` | **Date**: 2026-10-26 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `/specs/001-default-nginx-deploy/spec.md`

## Summary

Ship the current landing page on the official nginx image `docker.io/library/nginx:1.31.8-alpine-slim`, pinned in the Helm chart. Delete the project image build. Attach the page and server settings through the existing ConfigMap, mounted read-only, so a server upgrade is an image-tag change and a page change is a chart upgrade.

The canonical page and server files move into `helm/files/` because Helm can only package files inside the chart. `server.conf` becomes the full main nginx config for a non-root, read-only start: listen on `8080`, temp files and the pid under `/tmp`, and no load of the image's stock site. One size-limited `emptyDir` at `/tmp` is the only writable mount. `fsGroup` and `runAsGroup` `1000` let that non-root user write it. Chart defaults otherwise stay as locked down as they are now, and `imagePullSecrets` defaults to empty.

## Technical Context

**Language/Version**: Static HTML, CSS, and JavaScript. Helm chart. Official nginx `1.31.8-alpine-slim`.

**Primary Dependencies**: `docker.io/library/nginx:1.31.8-alpine-slim`. No new libraries. The existing Iconoir stylesheet moves with the page and is published gzip-compressed.

**Storage**: One ConfigMap for the page, visitor config, and server settings. One `emptyDir` at `/tmp` for nginx temp files. No database.

**Testing**: Manual. Local static server, `helm template` checks in [quickstart.md](quickstart.md), and an optional cluster check. No new test framework.

**Target Platform**: The existing Kubernetes Helm release.

**Project Type**: Static website delivered by one Helm chart.

**Performance Goals**: Unchanged. One replica serves one small page. Existing liveness and readiness checks stay on `/`.

**Constraints**: Unmodified pinned nginx image. No project image. One read-only attachment path. Non-root, no added capabilities, read-only root filesystem, ClusterIP, TLS on the published hostname. No scanner, mesh, policy engine, extra pipeline, debug image, or second chart. New files only where Helm cannot read the current paths.

**Scale/Scope**: One personal landing page and one chart. Files touched are listed in the structure decision below.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Gate | Before research | After design |
| --- | --- | --- |
| One pinned official nginx image; no project build; tag is not `latest` | Pass | Pass. `1.31.8-alpine-slim` is explicit. Dockerfile and `.dockerignore` are removed. |
| Page and server settings supplied at deploy time, read-only, by one mechanism | Pass | Pass. One ConfigMap. `/tmp` is scratch, not a second attachment path. |
| Non-root, drop capabilities, read-only root, no host path, host network, or extra capabilities | Pass | Pass. `fsGroup` / `runAsGroup` `1000` only make the temp volume writable. |
| No secrets in git; public config stays in values; no secrets workflow | Pass | Pass. `imagePullSecrets` defaults to empty. `config.json` stays a ConfigMap key. |
| ClusterIP and TLS on the published hostname | Pass | Pass. Service, ingress, and HTTPRoute stay. |
| Smallest change; no second chart, image, or attachment path | Pass | Pass. New `helm/files/` copies are the justified exception below. |
| No scanner, mesh, policy engine, extra pipeline, or debug image | Pass | Pass. Local preview remains the Python server in the README. |
| Vulnerability fix is a tag bump | Pass | Pass. Image tag and chart version are independent. |

## Project Structure

### Documentation (this feature)

```text
specs/001-default-nginx-deploy/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   ├── page.md
│   └── deploy.md
└── tasks.md             # /speckit-tasks, not created here
```

### Source Code (repository root)

```text
helm/
├── Chart.yaml
├── values.yaml
├── files/
│   ├── index.html
│   ├── style.css
│   ├── script.js
│   ├── config.json
│   └── server.conf
└── templates/
    ├── config.yaml
    ├── deployment.yaml
    ├── service.yaml
    ├── ingress.yaml
    ├── httproute.yaml
    └── _helpers.tpl
README.md
```

Removed by this feature: `Dockerfile`, `.dockerignore`, `html/`, and the root `server.conf`.

**Structure Decision**: Keep the single Helm chart. Move the page and server settings into `helm/files/` and load them from `helm/templates/config.yaml` with `.Files.Get`. `helm/templates/deployment.yaml` pins the official image, mounts the ConfigMap keys read-only, mounts `/tmp`, and checksums the ConfigMap so a file change rolls the pod. `helm/values.yaml` holds the image pin, empty pull secrets, and the security defaults. `helm/Chart.yaml` version moves to `2.3.0` with `appVersion` `2.3.0`, independent of the nginx tag. `README.md` drops the image build and points local preview at `helm/files/`. `helm/templates/service.yaml`, ingress, HTTPRoute, and `_helpers.tpl` stay as they are. Port `8080` already matches the listener.

`helm/files/` is new because `html/` and the root `server.conf` sit outside the chart, and Helm cannot package or read them. Inlining a second copy in `values.yaml` would duplicate the page. The spec allows a new file only with that reason. No other new files.

## Complexity Tracking

No constitution violations. The new `helm/files/` paths are the justified file move recorded in [research.md](research.md).

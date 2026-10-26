---

description: "Task list for shipping Bento-Box on a pinned official nginx image"
---

# Tasks: Default Nginx Image

**Input**: Design documents from `/specs/001-default-nginx-deploy/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/

**Tests**: Not requested. Do not add a test framework. Validation is the manual quickstart in the polish phase.

**Organization**: Tasks are grouped by user story so each story can be implemented and checked on its own.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

- Helm chart: `helm/`
- Page and server files: `helm/files/`
- Feature docs: `specs/001-default-nginx-deploy/`

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Create the chart directory that will hold the only copy of the page

- [x] T001 Create the `helm/files/` directory described in `specs/001-default-nginx-deploy/plan.md`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Place the page and the non-root server settings where the chart can package them

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [x] T002 [P] Move `html/index.html` to `helm/files/index.html` with the current markup unchanged, including the existing `iconoir.css` link. Do not add `iconoir.css`. Constraint: "The only document served at `/`. Current markup stays."
- [x] T003 [P] Move `html/style.css` to `helm/files/style.css` unchanged. Constraint: "Stylesheet linked from the page, including dark mode and the phone/desktop layout."
- [x] T004 [P] Move `html/script.js` to `helm/files/script.js` unchanged. Constraint: "Loads `config.json` and fills the title, subtitle, and links."
- [x] T005 [P] Move `html/config.json` to `helm/files/config.json` unchanged for local preview. Constraint: "The example file `helm/files/config.json` is for local preview. The running site uses the `config` object in `helm/values.yaml`."
- [x] T006 [P] Write `helm/files/server.conf` as the full main nginx config and delete the root `server.conf`. Mount target is `/etc/nginx/nginx.conf`. Required rules: listen port `8080`; site root `/usr/share/nginx/html`; unknown path `404`; process id and temp files under `/tmp` only (`pid /tmp/nginx.pid`, `client_body_temp_path`, `proxy_temp_path`, `fastcgi_temp_path`, `uwsgi_temp_path`, `scgi_temp_path`); logs to stdout and stderr; stock `conf.d` not included; `user` directive absent; include the image file `/etc/nginx/mime.types`
- [x] T007 Remove the emptied `html/` directory after T002–T005 so the page has one copy under `helm/files/`

**Checkpoint**: Page files and server settings live only in `helm/files/`

---

## Phase 3: User Story 1 - Ship the site on unmodified nginx (Priority: P1) 🎯 MVP

**Goal**: An operator deploys the current landing page with official nginx and the chart files. No custom image is built.

**Independent Test**: Render or deploy with only `docker.io/library/nginx:1.31.8-alpine-slim` and the chart files. `/` returns the project page, not the nginx welcome page.

### Implementation for User Story 1

- [x] T008 [P] [US1] Load the site into the existing ConfigMap in `helm/templates/config.yaml`: `index.html`, `style.css`, `script.js`, and `server.conf` via `.Files.Get` from `helm/files/`, and `config.json` from `{{ .Values.config | toJson }}`. `config.json` is not a Secret. `title` is a string, `subtitle` is a string, and `links` is a list of `{ url, icon }`
- [x] T009 [P] [US1] Set the server release and locked-down defaults in `helm/values.yaml`: `image.repository` `docker.io/library/nginx`, `image.tag` `1.31.8-alpine-slim`, `imagePullSecrets` empty, `podSecurityContext.fsGroup` `1000`, `runAsNonRoot: true`, `runAsUser: 1000`, `runAsGroup: 1000`, drop every capability, and `readOnlyRootFilesystem: true`. Keep the existing `config` object. Do not put a registry credential in the file
- [x] T010 [P] [US1] Delete `Dockerfile` and `.dockerignore` so shipping the site does not build an image
- [x] T011 [P] [US1] Leave `helm/templates/service.yaml` as `ClusterIP` port `8080`, and do not edit `helm/templates/ingress.yaml` or `helm/templates/httproute.yaml`, so the published hostname stays TLS-only
- [x] T012 [US1] Serve that ConfigMap from `helm/templates/deployment.yaml` using `{{ .Values.image.repository }}:{{ .Values.image.tag }}`. Mount `index.html`, `style.css`, `script.js`, and `config.json` read-only under `/usr/share/nginx/html/`, and mount `server.conf` read-only at `/etc/nginx/nginx.conf`. Replace the `/var/cache/nginx` and `/run` volumes with one `emptyDir` at `/tmp` with `sizeLimit: 64Mi`. Keep the `/` liveness and readiness probes. Add no container, host path, or host network

**Checkpoint**: User Story 1 is deployable without a project image

---

## Phase 4: User Story 2 - Upgrade nginx without rebuilding the site (Priority: P2)

**Goal**: Changing the pinned nginx tag and redeploying upgrades the server. The page files stay mounted. No image is built.

**Independent Test**: Change only `image.tag` to another specific nginx tag and render again. The ConfigMap page files stay the same, and an empty or `latest` tag fails the render.

### Implementation for User Story 2

- [x] T013 [US2] In `helm/templates/deployment.yaml`, fail the render when `image.tag` is empty or `latest`, and do not default the tag from `.Chart.AppVersion`. Constraint: "A specific nginx tag. Initial value `1.31.8-alpine-slim`. Empty and `latest` are invalid."
- [x] T014 [P] [US2] Set `version` and `appVersion` in `helm/Chart.yaml` to `2.3.0` together. They must not track `image.tag` `1.31.8-alpine-slim`
- [x] T015 [US2] Rewrite the build and release sections of `README.md` so shipping and upgrading use the chart and `image.tag` in `helm/values.yaml`. Remove the `docker build` and `docker push` commands for `ghcr.io/felixzmn/docker/bentobox`

**Checkpoint**: A server upgrade is one tag change and one redeploy

---

## Phase 5: User Story 3 - Change the page without a new server image (Priority: P3)

**Goal**: A page, visitor-config, or server-setting change publishes on the same nginx tag.

**Independent Test**: Change `config.title` or a file in `helm/files/` and render again. `image.tag` stays `1.31.8-alpine-slim`, and the pod-template checksum changes.

### Implementation for User Story 3

- [x] T016 [US3] Add a pod-template checksum annotation in `helm/templates/deployment.yaml` over `helm/templates/config.yaml` (the packaged `helm/files/` content and `.Values.config`) so a content change rolls the pod. `subPath` mounts do not refresh a running pod
- [x] T017 [US3] Document in `README.md` that local preview is `python3 -m http.server` from `helm/files/`, and that editing `helm/files/` or `config.title`, `config.subtitle`, and `config.links` in `helm/values.yaml` is published with a chart upgrade without changing `image.tag`

**Checkpoint**: Page updates and server upgrades are independent

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Check the finished chart against the quickstart

- [x] T018 Run sections 1–3 of `specs/001-default-nginx-deploy/quickstart.md`. Section 4 stays optional

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies
- **Foundational (Phase 2)**: Depends on T001. Blocks all user stories
- **User Story 1 (Phase 3)**: Depends on Phase 2. No dependency on US2 or US3
- **User Story 2 (Phase 4)**: Depends on T012 because it edits `helm/templates/deployment.yaml`
- **User Story 3 (Phase 5)**: Depends on T013 and T015 because it edits `helm/templates/deployment.yaml` and `README.md` again
- **Polish (Phase 6)**: Depends on T017

### User Story Dependencies

- **User Story 1 (P1)**: Starts after Phase 2. Delivers the running site
- **User Story 2 (P2)**: Starts after US1. Independently testable by a tag-only render
- **User Story 3 (P3)**: Starts after US2. Independently testable by a content-only render

### Within Each User Story

- T002–T006 can run together after T001. T007 waits for T002–T005
- T008, T009, T010, and T011 can run together. T012 waits for T008 and T009
- T013 and T014 can run together. T015 waits for T013
- T016 completes before T017

### Parallel Opportunities

- T002, T003, T004, T005, and T006 are different files
- T008, T009, T010, and T011 are different files
- T013 (`helm/templates/deployment.yaml`) and T014 (`helm/Chart.yaml`) are different files
- US2 and US3 are sequential: both edit `helm/templates/deployment.yaml` and `README.md`

---

## Parallel Example: User Story 1

```bash
# After Phase 2, launch together:
Task: "T008 ConfigMap keys in helm/templates/config.yaml"
Task: "T009 Image pin and security defaults in helm/values.yaml"
Task: "T010 Delete Dockerfile and .dockerignore"
Task: "T011 Confirm service, ingress, and HTTPRoute stay unchanged"

# Then:
Task: "T012 Mount the ConfigMap and /tmp in helm/templates/deployment.yaml"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1 and Phase 2
2. Complete Phase 3 (T008–T012)
3. Stop and render the chart: image `docker.io/library/nginx:1.31.8-alpine-slim`, five ConfigMap keys, read-only site mounts, no `Dockerfile`

### Incremental Delivery

1. Setup and foundation move the page into `helm/files/`
2. User Story 1 ships that page on official nginx
3. User Story 2 makes a tag change the only server upgrade
4. User Story 3 makes a page change roll the pod without a new tag
5. Phase 6 runs `specs/001-default-nginx-deploy/quickstart.md`

### Parallel Team Strategy

1. Finish Phase 1 and Phase 2 together
2. Split T008, T009, T010, and T011 across people, then one person completes T012
3. Do User Story 2 and User Story 3 in order; they share `helm/templates/deployment.yaml` and `README.md`

---

## Notes

- [P] tasks use different files and do not wait on each other
- Tests were not requested
- Commit after each phase
- Stop at a checkpoint to validate that story before starting the next

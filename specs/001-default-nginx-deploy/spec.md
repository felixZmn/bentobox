# Feature Specification: Default Nginx Image

**Feature Branch**: `001-default-nginx-deploy`

**Created**: 2026-10-26

**Status**: Draft

**Input**: User description: "please refactor the implementation. exchange the custom docker image with an default nginx, so that it is easy to upgrade. the files should be mounted into the deployment via a configmap or a pre-confgured volume or something like that. main goal should be that a default image is enough to ship the website"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Ship the site on unmodified nginx (Priority: P1)

An operator publishes the existing landing page with an official, unmodified
nginx release. The page files and the settings that control how they are
served are supplied when the site is deployed. Visitors see the same page
they see today. No custom server build is required to ship the site.

**Why this priority**: This is the main goal. Until the site runs on a
default nginx release, upgrades still depend on a project-built image.

**Independent Test**: Deploy the current page using only a pinned official
nginx release and the project's existing site files. Open the published
address and confirm the landing page, not a generic server placeholder.

**Acceptance Scenarios**:

1. **Given** the current page files and server settings, **When** an
   operator deploys the site with a pinned official nginx release and no
   custom server build, **Then** the published address serves the Bento-Box
   landing page.
2. **Given** a healthy deploy, **When** a visitor opens the page on a phone
   and on a desktop, **Then** the configured title, subtitle, and links are
   shown, the layout fits both widths, and dark mode follows the device
   preference.
3. **Given** a healthy deploy, **When** a visitor loads the page,
   **Then** they do not see the placeholder page that ships with nginx.
4. **Given** a deploy with page files or server settings missing,
   **When** the operator checks deploy status and a visitor opens the
   address, **Then** the deploy is unhealthy and the visitor is not shown
   the nginx placeholder page as if it were the site.
5. **Given** the site as it is deployed today, **When** this feature is
   deployed, **Then** the site has the same privilege limits, cannot modify
   its own program, the page files, or the server settings, and has the
   same network exposure as before. No scanner, mesh, policy engine, extra
   release pipeline, or debug image is added.
6. **Given** the finished change, **When** the changed project files and
   the deployed site are reviewed, **Then** only the named in-scope files
   differ, page files and server settings are attached in exactly one
   read-only way, and the project contains no registry credential or
   secrets workflow for the public page.

---

### User Story 2 - Upgrade nginx without rebuilding the site (Priority: P2)

An operator moves to a newer nginx release by changing the pinned server
version and redeploying. The same page files and server settings stay in
place. The operator does not build or publish a server image.

**Why this priority**: Easy upgrades are the reason for dropping the custom
image. A default image that still requires a project rebuild does not meet
the request.

**Independent Test**: With the site already running from story 1, change
only the pinned nginx version, redeploy, and confirm the same landing page
is served by the new version.

**Acceptance Scenarios**:

1. **Given** a running site pinned to a specific nginx version, **When**
   the operator sets a newer specific version and redeploys, **Then** the
   site is available again, serves the same title, subtitle, and links,
   and is not tracking a floating latest release.
2. **Given** a running site, **When** the operator upgrades nginx,
   **Then** no custom server image is built or published as part of that
   upgrade.
3. **Given** the project release instructions, **When** the operator follows
   them to ship or upgrade the site, **Then** those instructions do not
   require a custom server build.

---

### User Story 3 - Change the page without a new server image (Priority: P3)

An operator changes the landing page, its visitor-facing settings, or the
server settings, then publishes that change without building a server image.
The nginx version stays the same.

**Why this priority**: Page updates are already separate from server
upgrades for the visitor-facing configuration. The rest of the page and the
server settings need the same treatment so one default image can keep
serving the site.

**Independent Test**: Change the title or a link, redeploy without changing
the nginx version, and confirm the new content appears on reload.

**Acceptance Scenarios**:

1. **Given** a running site, **When** the operator changes the title,
   subtitle, or a link and redeploys without changing the nginx version,
   **Then** the next page load shows the change.
2. **Given** a running site, **When** the operator changes a page file or
   a server setting and redeploys, **Then** the running server uses that
   change and no custom server image is produced.
3. **Given** a content-only change and a server-only upgrade, **When** each
   is published on its own, **Then** neither change forces the other to be
   republished.

---

### Edge Cases

- Site files or server settings are missing at deploy time. Visitors MUST
  NOT see nginx's placeholder page presented as Bento-Box. The operator can
  tell the deploy is unhealthy.
- The selected nginx release cannot run under the current privilege limits.
  The deploy fails closed. Privilege, filesystem, or exposure limits are
  not relaxed to make that release start.
- Page content and the nginx version change in the same deploy. The site
  serves the new content on the new version.
- Visitor-facing configuration is empty or invalid. Behavior stays as it is
  today. This feature does not add a new error page.
- The nginx release's built-in default site is present in the image. A
  healthy deploy still serves only the project page.
- A known vulnerability in the server is fixed by changing the pinned
  version only. No project image, tool, or wrapper is added.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The deployed site MUST be served by an official, unmodified
  nginx image. Shipping the website MUST NOT require a custom-built image.
- **FR-002**: Page files and the settings that control how those files are
  served MUST be supplied at deployment time, read-only, through one
  attachment mechanism. They MUST NOT be packaged inside the nginx image.
  A second attachment mechanism MUST NOT be added.
- **FR-003**: The running nginx release MUST be pinned to a specific
  version. The deployment MUST NOT follow a floating latest release.
- **FR-004**: Changing that pinned version and redeploying MUST be
  sufficient to upgrade nginx. Existing page files and server settings MUST
  remain in use across that upgrade.
- **FR-005**: A change to page files, visitor-facing page settings, or
  server settings MUST be publishable without building or publishing a
  server image, and without changing the pinned nginx version.
- **FR-006**: Visitors MUST receive the current landing page: the configured
  title, subtitle, and links, the current layout at phone and desktop
  width, and dark mode that follows the device preference.
- **FR-007**: A healthy deploy MUST NOT serve the placeholder page shipped
  with nginx. If the project files or server settings are not in effect,
  the deploy MUST be visibly unhealthy to the operator.
- **FR-008**: The site MUST stay as locked down and as narrowly exposed as
  it is today. It MUST NOT gain administrator rights, extra privileges, the
  ability to modify its own program, the page files, or the server settings,
  an unencrypted public address, an additional runnable component, a
  scanner, a mesh, a policy engine, or an extra release pipeline. The
  chart's own defaults MUST stay at least as locked down as today. A
  default is overridden only for a documented environment need.
- **FR-009**: The nginx version and the site content MUST be releasable
  independently. Publishing one MUST NOT require republishing the other.
- **FR-010**: Release instructions MUST describe shipping and upgrading the
  site with the unmodified nginx image, and MUST NOT instruct the operator
  to build or publish a custom image.
- **FR-011**: Public page content and visitor settings MUST remain ordinary
  project data. The project MUST NOT gain a registry credential or a
  secrets workflow for that data. If a pull credential is still required,
  it MUST be a name that points to a secret outside the project.
- **FR-012**: The only project files this feature may change are
  `Dockerfile`, `.dockerignore`, `README.md`, `server.conf`,
  `html/index.html`, `html/style.css`, `html/script.js`, `html/config.json`,
  `helm/Chart.yaml`, `helm/values.yaml`, `helm/templates/deployment.yaml`,
  `helm/templates/config.yaml`, and `helm/templates/service.yaml`.
  `Dockerfile` and `.dockerignore` MUST cease to be required to ship the
  site. Page files keep their current content unless a change is required
  for them to be served when supplied at deploy time. `server.conf` and
  `helm/templates/service.yaml` change only to keep the existing listener
  and published service aligned under the current privilege limits.
  `helm/templates/config.yaml` changes only when the single attachment
  mechanism is configuration supplied with the release. No other file is
  added unless the plan states why none of these files can hold the change.

### Key Entities

- **Site content**: The landing page and its visitor-facing settings
  (title, subtitle, and links). Supplied at deployment time and served as
  the only public page.
- **Server settings**: The project's rules for how that page is served.
  Supplied at deployment time with the site content. Replaces the server's
  built-in default site.
- **Server release**: The pinned official nginx version used to serve the
  site. Independent from site content. Changed only when the operator
  chooses to upgrade the server.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: An operator can put the current landing page on its existing
  address with one deploy and zero custom server builds.
- **SC-002**: An operator can upgrade the server by editing one version pin
  and redeploying once. No other release step is required, and the same
  site content stays in place.
- **SC-003**: After a server-only upgrade, the page shows the same title,
  subtitle, and links as before. It follows the device dark-mode preference
  and remains usable at a typical phone width and a typical desktop width.
- **SC-004**: An operator can change the title, subtitle, or a link and see
  that change on the next page load after one redeploy, without a new
  server build and without changing the server version.
- **SC-005**: When site files or server settings are missing, visitors are
  not shown the server's built-in placeholder page. The operator can tell
  the deploy is unhealthy from one status check.
- **SC-006**: Relative to the site immediately before this change, the
  deployed site has no new administrator rights, no new network exposure,
  and no additional runnable component.

## Assumptions

- The official nginx image is the default server. No other web server is
  introduced, and the custom project image is not kept as a second option.
- Page files and server settings are attached at deploy time by one
  existing mechanism: either configuration supplied with the release, or a
  volume prepared beforehand. Planning picks the smaller option that can
  carry the current page and server settings. Both mechanisms MUST NOT be
  implemented.
- The current page is small enough to ship with the deployment. This
  feature does not add external storage, a file service, or a build step
  for assets.
- Visitor behavior of the landing page does not change. Debugging stays
  the local static server documented in `README.md`. This feature does not
  add a debug image or in-cluster debug tooling. It changes how the site
  is deployed, not the page design.
- Hostnames, certificates, and who can reach the site stay as they are.
  The public site remains encrypted. The service remains internal except
  for that existing published address.
- Security limits stay in force: the server is not an administrator, gains
  no extra privileges, and cannot modify its own program, the site files,
  or the server settings.
  Temporary writable space is limited to what the server needs in order to
  start. A newer nginx release that cannot meet those limits is not made
  to fit by weakening them.
- Constitution 2.0.0 already permits one pinned, unmodified nginx image
  with page files and server settings supplied at deploy time. No
  governance exception is required. Least privilege, version pinning, no
  secrets in the project, and no extra components still apply.
- Empty or invalid visitor-facing configuration keeps today's behavior.
  No new error page or validation flow is added.
- No runtime or second deployable is added. The file list in FR-012 is the
  complete set of files this feature may change.

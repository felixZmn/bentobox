# Bento-Box Constitution

## Core Principles

### I. Secure Delivery

Bento-Box is a static landing page shipped with one Helm chart and one
pinned, unmodified nginx image. A release MUST NOT depend on a project-built
image. Delivery MUST use least privilege, least exposure, and a pinned
supply chain. Those controls MUST live in the chart. MUST NOT add scanners,
meshes, policy engines, or extra pipelines when the rules below already
cover the risk.

- The site MUST be served by one official, unmodified nginx image pinned to
  a specific version. A deployment MUST NOT track `latest`.
- Page files and server settings MUST be supplied at deployment time, using
  one attachment mechanism. They MUST NOT be packaged into an image.
- The container MUST run as non-root, drop all capabilities, and use a
  read-only root filesystem. Writable paths MUST be explicit volumes limited
  to what nginx needs. Site files and server settings MUST be mounted
  read-only.
- The container MUST NOT run privileged, use host networking, mount host
  paths, or add capabilities.
- The project MUST NOT wrap the nginx image to add packages, shells, debug
  tools, or site files.
- Secrets MUST NOT be committed, stored in published chart values, or
  packaged into an image. Public page config is not a secret and MUST stay
  in `config.json` or Helm values. MUST NOT add a secrets workflow for data
  that is not secret.
- The Service MUST be ClusterIP. A published hostname MUST be served over TLS.
- A change that widens network exposure, privileges, or dependencies MUST
  record why the current default is insufficient.

Rationale: the server can be upgraded by changing a version pin. The chart
still carries the locked-down runtime defaults, without a project image
build or a separate security stack.

### II. Simplicity

Every change MUST be the smallest implementation that meets the requirement.
The stack is static HTML, one pinned upstream nginx image, and one Helm
chart. MUST NOT add a project image build. MUST NOT add a dependency,
service, workflow, abstraction, or config flag that the requirement does
not use.

- Prefer editing an existing file over adding a new one.
- MUST NOT introduce a second config path, image, chart, or file-attachment
  mechanism for the same behavior.
- MUST NOT add a library, sidecar, or framework when the current stack can
  do the job.
- A new file or dependency MUST state, in the change, why the existing stack
  cannot meet the requirement.
- Copy, markup, and chart values MUST stay limited to what the page and
  deploy actually use.

Rationale: unused machinery becomes attack surface and maintenance. The
product is a minimal start page, so the implementation stays minimal too.

## Security Requirements

Reviews of the chart MUST confirm:

- `securityContext` sets `runAsNonRoot: true`, a fixed `runAsUser`,
  drops every capability, and sets `readOnlyRootFilesystem: true`.
- Writable mounts are `emptyDir` volumes with a size limit, only for nginx
  paths that must be writable. Site files, server settings, and config are
  mounted read-only.
- The chart pins one unmodified nginx image to a specific version. The site
  content and that pin are releasable independently. A chart change MUST NOT
  require a project image build.
- `imagePullSecrets` only name a secret that exists outside this repo.
  Registry credentials MUST NOT appear in git.
- Ingress or HTTPRoute publishes a hostname only with TLS. No extra ports.

Fix a known nginx vulnerability by bumping the pinned image version.
MUST NOT add a project image, tool, or wrapper to compensate.

## Implementation Constraints

- Feature work MUST satisfy both principles before it is considered done.
- Specs and plans MUST name the files they will change. They MUST NOT plan a
  new component when an existing file can hold the change. They MUST NOT
  plan a project image build.
- Helm values in this chart MUST keep the secure defaults above. An
  environment MAY override a value only for a documented need. The chart's
  own defaults MUST stay secure.
- Debugging MUST use the local static server documented in `README.md`.
  MUST NOT add a debug image or in-cluster debug tooling for routine checks.

## Governance

This constitution supersedes conflicting habits for how Bento-Box is changed
and shipped. Specs, plans, and implementation MUST comply with it.
`README.md` remains the setup and release guide.

Amendments:

- Change this file only. Do not edit constitution templates.
- Version policy: MAJOR for removing or redefining a principle; MINOR for a
  new principle or a material expansion of obligations; PATCH for wording
  that does not change obligations.
- Keep **Ratified** at the original date. Set **Last Amended** to the date
  of the change.
- If an amendment changes a chart obligation, including the image pin,
  update those defaults in the same change, or record a follow-up in the
  Sync Impact Report.

Compliance:

- Changes to the page, the image pin, or the chart MUST be checked against
  Secure Delivery and Simplicity.
- An exception MUST be written in the change: what was added, why the
  simpler secure option fails, and what will be removed when it is no
  longer needed.
- Unjustified complexity or privilege fails review.

**Version**: 2.0.0 | **Ratified**: 2026-10-26 | **Last Amended**: 2026-10-26

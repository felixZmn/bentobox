# Contract: Deploy

Shipping and upgrading the site is a Helm release of the existing chart. No project image is built or pushed.

## Image

| Input | Rule |
| --- | --- |
| `image.repository` | `docker.io/library/nginx` unless an environment documents another registry for the same official image. |
| `image.tag` | Required. A specific nginx version. `latest` and an empty tag fail chart render. |
| `imagePullSecrets` | Empty by default. An override may only name a secret that exists outside this repo. |

Changing `image.tag` and redeploying is the whole server upgrade. Site files stay mounted.

## Visitor config

`config` in `helm/values.yaml` is the deployed `config.json`. Fields are `title`, `subtitle`, and `links` (`url`, `icon`). This data is not a secret and is not stored as a Secret.

## Runtime defaults

The chart defaults keep:

- `runAsNonRoot: true`, `runAsUser: 1000`, `runAsGroup: 1000`
- `fsGroup: 1000` so the temp volume is writable by that user
- every capability dropped
- `readOnlyRootFilesystem: true`
- Service type `ClusterIP` on port `8080`
- the current ingress and HTTPRoute publication, including TLS on the published hostname

An environment may override a default only for a documented need. The chart's own defaults stay as above.

## Attached files

One ConfigMap, same name as the release, with keys `index.html`, `style.css`, `script.js`, `config.json`, and `server.conf`. Page and server keys are mounted read-only. The only writable mount is an `emptyDir` at `/tmp` with a size limit.

## Release independence

| Change | What is republished |
| --- | --- |
| Page or visitor config | Chart release only |
| `image.tag` | The same chart, new tag |
| Both | One chart release with the new tag |

No custom image repository is part of the release.

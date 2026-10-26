# Data Model: Default Nginx Image

No stored records and no lifecycle states. Two releases change independently: the server release (image tag) and the site content (chart files plus visitor config).

## Site content

The landing page supplied to the server at deploy time.

| Field | Rules |
| --- | --- |
| `index.html` | The only document served at `/`. Current markup stays. |
| `style.css` | Stylesheet linked from the page, including dark mode and the phone/desktop layout. |
| `script.js` | Loads `config.json` and fills the title, subtitle, and links. |
| `config.json` | JSON object rendered from chart values. Not a secret. |

`config.json` fields:

| Field | Rules |
| --- | --- |
| `title` | String shown as the document title and the page heading. |
| `subtitle` | String shown under the heading. |
| `links` | List of `{ url, icon }`. `url` is the link target. `icon` is the Iconoir class name already used by the page. |

The example file `helm/files/config.json` is for local preview. The running site uses the `config` object in `helm/values.yaml`.

## Server settings

The file `helm/files/server.conf`, mounted read-only as `/etc/nginx/nginx.conf`.

| Rule | Value |
| --- | --- |
| Listen port | `8080` |
| Site root | `/usr/share/nginx/html` |
| Unknown path | `404` |
| Process id and temp files | Under `/tmp` only |
| Logs | stdout and stderr |
| Stock `conf.d` | Not included |
| `user` directive | Absent |

## Server release

| Field | Rules |
| --- | --- |
| `image.repository` | `docker.io/library/nginx` |
| `image.tag` | A specific nginx tag. Initial value `1.31.3-alpine-slim`. Empty and `latest` are invalid. |
| Chart `version` / `appVersion` | Move together when the chart or site defaults change. They do not track `image.tag`. |

## Relationships

- One server release serves one site content.
- Changing `image.tag` does not change site content.
- Changing site content does not change `image.tag`.
- Server settings and site content are mounted read-only from the same ConfigMap.
- `/tmp` is writable scratch for the server release and holds no site content.

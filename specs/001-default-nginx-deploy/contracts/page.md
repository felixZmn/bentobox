# Contract: Public page

The deployed site serves the existing landing page over the current address. No new paths are added.

## Requests

| Request | Result |
| --- | --- |
| `GET /` | `200` and the project `index.html`. The body is not the nginx welcome page. |
| `GET /style.css` | `200` and the project stylesheet. |
| `GET /script.js` | `200` and the project script. |
| `GET /config.json` | `200` and JSON with `title`, `subtitle`, and `links`. |
| `GET /iconoir.css` | `200` and the project icon stylesheet for a client that accepts gzip. |
| Any other path | `404`. The body is not the nginx welcome page. |

## Visitor result

After the script runs, the document shows `title` and `subtitle`, and one link per `links` entry. Dark mode follows the device preference. The layout fits a phone width and a desktop width.

## Health

The existing readiness and liveness checks request `/` and expect success. A missing page file or a server that is not running leaves the deploy unready. A `404` is not success.

The icon stylesheet is the existing `helm/files/iconoir.css`. The release attaches the gzip-compressed copy because the uncompressed file does not fit in the page configuration object.

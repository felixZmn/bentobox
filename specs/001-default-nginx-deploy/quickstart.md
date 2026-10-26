# Quickstart: Default Nginx Image

Validate the finished change. Commands assume the repository root. Details of the page and the deploy inputs are in [contracts/page.md](contracts/page.md), [contracts/deploy.md](contracts/deploy.md), and [data-model.md](data-model.md).

## Prerequisites

- Python 3 for local preview
- Helm 3
- A cluster only for the optional live check

## 1. Local page

```shell
cd helm/files
python3 -m http.server
```

Open `http://localhost:8000/`. The example `config.json` title and subtitle appear, and the links match that file. Narrow the window and toggle the system dark mode. There is no project image build in this path.

## 2. Chart render

From the repository root:

```shell
helm template bentobox helm
```

Confirm the render:

- Image is `docker.io/library/nginx:1.31.8-alpine-slim`.
- Rendering fails if `image.tag` is empty or `latest`.
- The container is non-root, user and group `1000`, read-only root, all capabilities dropped, and `fsGroup` is `1000`.
- One ConfigMap holds `index.html`, `style.css`, `script.js`, `config.json`, and `server.conf`.
- Those keys mount read-only. The only writable mount is `/tmp`.
- The Service is `ClusterIP` on port `8080`.
- No host path, host network, or extra container.

```shell
test ! -f Dockerfile && test ! -f .dockerignore
```

## 3. Independent updates

Render once, then change only `image.tag` to another specific nginx tag and render again. The ConfigMap page files stay the same.

Change only `config.title` and render again. The image tag stays the same, and the pod-template checksum changes.

## 4. Optional live check

Install or upgrade the chart against a cluster you already use. Open the existing published address.

- `/` shows the landing page and does not show the nginx welcome page.
- A server-only tag change keeps the same title, subtitle, and links.
- Removing the `index.html` key from a throwaway render leaves `/` unready and does not serve the welcome page. Do not upgrade the real release with that render.

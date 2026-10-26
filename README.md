# Bento-Box

<center>
    <img src="./docs/bentobox.png" alt="Bento-Box"/>
</center>

## Intro

Bento-Box is a small web application that serves as a personal landing page. Goal is to provide a customizable and minimalistic starting point when opening a new browser tab.

Dark mode is supported and switches automatically, based on system preference. Additionally, the layout is fully responsive, so it works well on both desktop and mobile devices.

## Setup

Visitor settings live in the `config` object in `helm/values.yaml`: `title`, `subtitle`, and `links`. An example for local preview is `helm/files/config.json`. Icons are provided via [Iconoir](https://iconoir.com/). To choose one, select the name of the desired icon and put it together with the prefix `iconoir-`. For example, to use the "github" icon, you would specify `iconoir-github` in the configuration.

The icon stylesheet is `helm/files/iconoir.css`. It is published as `helm/files/iconoir.css.gz` because the uncompressed file is too large to attach to the release. After changing the stylesheet, regenerate the compressed file:

```shell
gzip -n -9 -c helm/files/iconoir.css > helm/files/iconoir.css.gz
```

## Release

The site runs on the official nginx image pinned by `image.tag` in `helm/values.yaml`. The chart version does not track that tag. Upgrade nginx by setting `image.tag` to a specific version and upgrading the release. Do not use `latest`. No custom image is built or pushed.

Change the page by editing `helm/files/` or `config.title`, `config.subtitle`, and `config.links` in `helm/values.yaml`, then upgrade the chart. Leave `image.tag` unchanged for a content-only release.

```shell
cd helm
helm package .
helm push bentobox-*.tgz oci://ghcr.io/felixzmn/helm
```

## Debugging

```shell
cd helm/files
python3 -m http.server
```

Then open `http://localhost:8000/` in your browser.

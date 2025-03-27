# Explore Local Statistics

> This readme needs further information.

## Developing

To work with ONSdigital, you need to have completed Steps 1-3 from the ONSdigital [setup guide](https://github.com/ONSdigital/dp/blob/main/guides/GETTING_STARTED.md) in order to be able to make _signed commits_.

Install dependencies with `npm install`, then start a development server:

    npm run dev

When developing new features, please create a feature branch and complete a code review before merging to dev.

## Data

See `scripts/insights/README.md` to learn about how data is managed and updated.

## ONSvisual/svelte-components

This project uses a Svelte port of the ONS Design System components.

It's possible to use `npm link` to work locally with the components, without having to publish the components to npm during development.

- In svelte-components, run `npm link` and them `npm run build`.
- In explore-local-statistics, run `npm link @onsvisual/svelte-components`.
- Verify with `npm ls @onsvisual/svelte-components` that the package is symlink'd to your local location of the library.
- With explore-local-statistics running, the Svelte library components should live update each time you run `npm run build`.
- To unlink, run `npm unlink @onsvisual/svelte-components`.

## Dockerised production build

The app can be run using Docker for production, for which we use the SvelteKit Node adapter. You can run a production build locally like so:

    docker build -t els .
    docker run -p 3000:3000 els

Or you can parameterise the image with `--build-arg`s:

    docker build -t els --build-arg SVELTEKIT_BASE_PATH=/explore-local-statistics --build-arg SVELTEKIT_ASSETS_PATH=http://localhost:8080/some-path .

### Hosting assets in a bucket

In production we host the SvelteVit assets (i.e. the app's files, including the built `.js`, `.css` files and everything in `/static`) in a bucket to reduce the disk costs in the container. This bucket is on the CND domain `cdn.ons.gov.uk`. We copy the built assets during deployment.

To simulate this locally, copy the client build output from the container to a local HTTP server for example running at `../liveserv` (we used `live-server` with the `--cors` option):

    docker cp (container-name):/app/build/client/explore-local-statistics ../liveserv/some-path

The app's assets will be available at `http://localhost:8080/some-path/`.

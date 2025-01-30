# Explore Local Statistics

> This readme needs further information.

## Developing

To work with ONSdigital, you need to have completed Steps 1-3 from the ONSdigital [setup guide](https://github.com/ONSdigital/dp/blob/main/guides/GETTING_STARTED.md) in order to be able to make _signed commits_.

Install dependencies with `npm install`, then start a development server:

    npm run dev

## Data

See `scripts\insights\README.md` to learn about how data is managed and updated.

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

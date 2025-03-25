# Deploying ELS assets from a bucket

- Why? ELS has no database but instead uses a 'file' API where data files are loaded from the app.
- We don't want to serve large files or numerous files from the container, for performance and cost reasons.
- The files will only get bigger as more stats are added to the app.
- ONS website has an existing pattern using `cdn.ons.gov.uk`.

1. Route asset traffic invisibly to a bucket.
   - This is what's done now by SvelteKit platform adapter (Vercel, Netlify, SST)
     - /explore-local-statistics/img --> bucket
     - /explore-local-statistics/page --> lambda
   - COMPLICATED to implement
2. All assets on separate domain
   - Existing ONS pattern
   - Application framework support via SvelteKit
   - Easiest to implement correctly
   - 'Assets' include all file css, js chunks, as well as data files
   - CORS issues?
3. Data files only on a separate domain
   - Manual maintenance - developer is required to know about this and prefix paths as appropriate
   - Possible but not ideal - ongoing dev 'debt' going forward
   - Would get around potential CORS issues since js loaded from the app's path
   - Container serves css and js, which is unecessary load
   - Why bother if we can offload all assets successfully ?
4. No nothing and cache

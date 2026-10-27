# Room Edit on Railway

Standalone export of Room Edit, including the photo matcher, style planner, room boards, and demonstration marketplace API. The Node HTTP adapter runs the existing application on Railway's PORT and 0.0.0.0. No API keys or database are required.

## Deploy through GitHub

1. Create a GitHub repository and upload the CONTENTS of this folder to its root (Dockerfile and railway.json should be at the repository root).
2. In Railway, create a project from that GitHub repository.
3. Railway builds the Dockerfile and checks /healthz. No custom build/start commands are needed.
4. When deployment is healthy, generate a domain in the service's networking settings if you want public access.

## Or deploy from your computer using the Railway CLI

Install Node.js 22+ first, then open a terminal in this folder:

```sh
npm install -g @railway/cli
railway login
railway init
railway up
```

For an existing Railway project, use `railway link` instead of `railway init`. If prompted, select/create the service for Room Edit. After deployment, run `railway domain` to expose it publicly.

## Local check

```sh
npm ci
npm run build
npm test
npm start
```

Open http://localhost:3000. Set PORT to override the default. /healthz returns 200 when the server is running.

## Access and data

- Railway does not inherit the Sites/UT login restriction. This export has no authentication. A generated public domain allows public access.
- Existing Sites publication remains separate. This is a snapshot, not a continuous connection to Sites. Redeploy source changes to update Railway.
- Room boards are stored in each browser, not on the server. Export a board on the old Site and import it on the Railway address to move it; local storage does not cross domains.
- Marketplace listings remain fictional demo data, not a live Facebook/OfferUp/Craigslist integration. Pickup choices do not make bookings.
- Retailer prices remain dated catalog snapshots. Remote images and the in-browser image model require internet access; photo uploads are analyzed on the device.
- No credentials, Sites identity, user room boards or Git history are included in this export.

## Main files

- railway-server.mjs: Node server adapter
- server.mjs: shared application request handler
- build.mjs: bundles client assets and listing data into dist/server/index.js
- dist/: editable client source files
- Dockerfile / railway.json: deployment settings

Railway documentation:
https://docs.railway.com/cli/deploying
https://docs.railway.com/cli
https://docs.railway.com/builds/dockerfiles
https://docs.railway.com/deployments/healthchecks

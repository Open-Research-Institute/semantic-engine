# ORI Semantic Engine

The ORI semantic engine is a modular pipeline for ingesting, embedding and visualizing diverse documents and their relationships to each-other

## Getting started

### Prerequisites

You need to have `uv` installed to run python scripts
Install guide: https://docs.astral.sh/uv/getting-started/installation/

You can use any js package manager to run the scripts: `bun`, `npm`, `yarn`, `pnpm`

copy `.env.template` to `.env` and fill in with the API keys you intend to use

### Quickstart

Install js dependencies

```
pnpm i
```

Initialize the DB

```
pnpm init-db
```

this will create a semantic-engine.sqlite (or whatever you named DB_URL in your .env) file

Fetch Defender's tweets from the community archive

```
pnpm do scripts/fetch-user-tweets.mts DefenderOfBasic
```

Embed them with Google text-embedding-004
(Requires GOOGLE_GENERATIVE_AI_API_KEY on .env; grab one from https://aistudio.google.com/app/apikey)

```
pnpm do scripts/embed-documents.mts
```

Sign in to nomic account:
Create account/sign in, then go to https://atlas.nomic.ai/cli-login to generate an API key, then run

```
pnpm login:nomic <api-key>
```

Push dataset (all embedded documents) to nomic atlas

```
pnpm do scripts/push-to-nomic-atlas.py <name-for-the-dataset>
```

Then open your nomic dashboard to see the map

### Scripts

you can check the available scripts in the `scripts` folder
some are written in typescript, and some in python

you can run any of them using:

```
pnpm do <script> <params>
```

works for both ts and python scripts

e.g.:

```
pnpm do scripts/fetch-user-tweets.mts DefenderOfBasic
```

```
pnpm do scripts/push-to-nomic-atlas.py semantic-engine
```

Check the scripts for more info. Better docs soon

## Database GUI

You can quickly browse and query your local database without installing anything by using [Outerbase Studio](https://studio.outerbase.com/playground/client?s=087fedce-0e74-4f6e-8fb1-1d4f94f6d2d1) or [SQLime](https://sqlime.org/). Just open in your browser and use to open semantic-engine.sqlite (or whatever you named DB_URL in your .env)

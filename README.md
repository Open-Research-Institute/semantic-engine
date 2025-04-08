# ORI Semantic Engine

The ORI semantic engine is a modular pipeline for ingesting, embedding and visualizing diverse documents and their relationships to each-other

## Getting started

### Prerequisites

You need to have `uv` installed to run python scripts
Install guide: https://docs.astral.sh/uv/getting-started/installation/

And `bun` to run the js ones

copy `.env.template` to `.env` and fill in with the API keys you intend to use

### Quickstart

Install js dependencies

```
bun i
```

Initialize the DB

```
bun init-db
```

this will create a semantic-engine.sqlite (or whatever you named DATASET_ID in your .env) file

Fetch Defender's tweets from the community archive

```
bun scripts/fetch-user-tweets.mts DefenderOfBasic
```

Embed them with Google text-embedding-004
(Requires GOOGLE_GENERATIVE_AI_API_KEY on .env; grab one from https://aistudio.google.com/app/apikey)

```
bun scripts/embed-documents.mts
```

Sign in to nomic account:
Create account/sign in, then go to https://atlas.nomic.ai/cli-login to generate an API key, then run

```
bun login:nomic <api-key>
```

Push dataset (all embedded documents) to nomic atlas

```
bun scripts/push-to-nomic-atlas.py <name-for-the-dataset>
```

Then open your nomic dashboard to see the map

### Scripts

you can check the available scripts in the `scripts` folder
some are written in typescript, and some in python

you can run any of them using:

```
bun <script> <params>
```

works for both ts and python scripts

e.g.:

```
bun scripts/fetch-user-tweets.mts DefenderOfBasic
```

```
bun scripts/push-to-nomic-atlas.py semantic-engine
```

Check the scripts for more info. Better docs soon

## Database GUI

```
bun drizzle-kit studio
```

You can then quickly browse and query your local database on https://local.drizzle.studio
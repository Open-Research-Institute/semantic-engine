# ORI Semantic Engine

The ORI semantic engine is a modular pipeline for ingesting, embedding and visualizing diverse documents and their relationships to each-other

## Getting started

### Prerequisites

You need to have `uv` installed to run python scripts
Install guide: https://docs.astral.sh/uv/getting-started/installation/

And `bun` to run the js ones

And [LMStudio](https://lmstudio.ai/) for local embeddings

copy `.env.template` to `.env`

### Quickstart (RAG on tweets from community archive)

Install js dependencies

```
bun i
```

Initialize the DB

```
bun init-db
```

this will create a semantic-engine.sqlite (or whatever you named DATASET_ID in your .env) file

Download an twitter archive from community archive

```
# you can provide multiple usernames, or omit them to download all archives
bun scripts/download-archives.mts DefenderOfBasic
```

Load up the tweets from an user archive on the local db:

```
# you can provide multiple archives, or use a glob like archives/* to load them all
bun scripts/load-archives.mts archives/defenderofbasic.json
```

Embed them using LMStudio:

Start LMStudio
Download this model: https://model.lmstudio.ai/download/limcheekin/snowflake-arctic-embed-l-v2.0-GGUF
Go to Developer tab on the left pane (if it's not showing up, make sure you're in `Power User` or `Developer` mode rather than `User` on the bottom left status bar)
Start the server by toggling the top left switch that says `Status: Stopped`
Either click on `Select a model to load` on the topbar and load `Snowflake Arctic Embed L v2.0` or Click on Settings and make sure `Just-in-Time Model Loading` is enabled

Embed them (can take a while)

```
bun scripts/embed-documents.mts
```

Query your dataset:

```
bun scripts/query-documents.mts "query: what is the meaning of memetics?"
```

### Pushing data to Nomic Atlas

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

## Datasets

Data is stored in a local sqlite db
You can use different files by specifying a different `DATASET_ID` on `.env`

## Scripts

you can check the available scripts in the `scripts` folder
some are written in typescript, and some in python

you can run any of them using:

```
bun <script> <params>
```

e.g.:

```
bun scripts/download-archives.mts DefenderOfBasic
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

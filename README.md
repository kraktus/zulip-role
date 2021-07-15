# Zulip Role

**Not functional for the moment**

Zulip bot used to mimic discord roles to automatically add users to relevant private streams.

Based on: https://github.com/ornicar/zulip-remind.

## Usage

...

## Setup

**You need to be at least Administrator**

In Zulip, go to Settings -> Api key, view or create a new one, download its `zuliprc` file and put it at the root of this project.

```
yarn install
yarn dev
```

And you're set, try using it from your Zulip instance.

## Redis configuration

To set a redis port, password, or database, use these environment variables:

```
REDIS_PORT
REDIS_PASSWORD
REDIS_DB
```

Example:

```
REDIS_PORT=9379 REDIS_DB=5 yarn dev
```

## Production

Build a prod release:

```
yarn build
```

Deploy it to a server:

```
rsync -av zuliprc dist node_modules user@server:/home/zulip-remind/
```

Start it on the server:

```
node dist/index.js
```

### Systemd service definition

```
[Unit]
Description=Zulip remind bot
After=network.target

[Service]
User=root
Group=root
WorkingDirectory=/home/zulip-remind
Environment="REDIS_PASSWORD="
Environment="REDIS_PORT=6379"
ExecStart=/usr/bin/node dist/index.js
Restart=always

[Install]
WantedBy=multi-user.target
```

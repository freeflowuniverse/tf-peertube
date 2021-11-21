# Deployment

These are the setup steps to expose a peertube instance over http://0.0.0.0:9000. A separate reverse proxy should be created with the domain speciied in the config below forwarding the traffic to the peretube instance endpoint.

docker compose file typical [setup](./docker-compose-without-reverse-proxy.yml). Should be copied over `docker-compose.yml`

Peertube environment file variables (can be found in `.env` file). Also replace all `<MY DOMAIN>` with the domain name and `<MY EMAIL ADDRESS>` with any email address, it doesn't work now anyway:

```yaml 
POSTGRES_USER=postgres
POSTGRES_PASSWORD=supersecurepassword
POSTGRES_DB=peertube

PEERTUBE_DB_USERNAME=postgres
PEERTUBE_DB_PASSWORD=supersecurepassword

PEERTUBE_WEBSERVER_HOSTNAME=tube.freeflow.life # the domain which will be used to access the website (and to configure the reverse proxy)
PEERTUBE_WEBSERVER_PORT=443
PEERTUBE_WEBSERVER_HTTPS=true
PEERTUBE_SIGNUP_ENABLED=true
```

Installation command:

```bash
docker-compose up -d
```

To change the root password:

```bash
docker-compose exec -u peertube peertube.com npm run reset-password -- -u root
```

Currently the mail doesn't work which affects only the contact form afaik.

# Update

```bash
docker-compose up -d
docker volume rm production_assets # in case the ui changes of the new image doesn't reflect, you might need to remove the assets volume
```

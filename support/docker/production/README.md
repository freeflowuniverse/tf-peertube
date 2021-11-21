# Deployment

This is the setup steps to expose a peertube instance over http://0.0.0.0:9000. A separate reverse proxy should be created with the domain speciied in the config below forwarding the traffic to the peretube instance endpoint.

docker compose file typical [setup](./docker-compose-without-reverse-proxy.yml)

Peertube webserver info:

```yaml 
POSTGRES_USER=postgres
POSTGRES_PASSWORD=supersecurepassword
POSTGRES_DB=peertube

PEERTUBE_DB_USERNAME=postgres
PEERTUBE_DB_PASSWORD=supersecurepassword

PEERTUBE_WEBSERVER_HOSTNAME=tube.freeflow.life # the domain which will be used to access the website (and to configure the reverse proxy)
PEERTUBE_WEBSERVER_PORT=443
PEERTUBE_WEBSERVER_HTTPS=true

```

To change the root password:

```bash
docker-compose exec -u peertube peertube.com npm run reset-password -- -u root
```

Currently the mail doesn't work which affects only the contact form afaik.

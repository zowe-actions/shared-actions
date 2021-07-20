FROM alpine

RUN apk add --update --no-cache openssh sshpass

COPY entrypoint.sh /entrypoint.sh

RUN chmod +x /entrypoint.sh

ENTRYPOINT ["/entrypoint.sh"]
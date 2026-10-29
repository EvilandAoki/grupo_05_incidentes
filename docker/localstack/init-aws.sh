#!/bin/bash
# Se ejecuta cuando LocalStack está listo (montado en /etc/localstack/init/ready.d/).
# Crea el topic de eventos del servicio y una cola de prueba suscrita con raw message
# delivery, para poder leer los eventos publicados tal como los recibiría otro microservicio.
set -euo pipefail

TOPIC_NAME="fleetops_incident_events"
QUEUE_NAME="incident_events_test_queue"

TOPIC_ARN=$(awslocal sns create-topic --name "$TOPIC_NAME" --query TopicArn --output text)
QUEUE_URL=$(awslocal sqs create-queue --queue-name "$QUEUE_NAME" --query QueueUrl --output text)
QUEUE_ARN=$(awslocal sqs get-queue-attributes \
  --queue-url "$QUEUE_URL" \
  --attribute-names QueueArn \
  --query Attributes.QueueArn --output text)

awslocal sns subscribe \
  --topic-arn "$TOPIC_ARN" \
  --protocol sqs \
  --notification-endpoint "$QUEUE_ARN" \
  --attributes RawMessageDelivery=true >/dev/null

echo "LocalStack listo: topic=$TOPIC_ARN queue=$QUEUE_URL"

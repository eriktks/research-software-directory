#!/usr/bin/env bash

set -o errexit
set -o pipefail
set -o nounset


#celery -A seedorf.taskapp beat -l INFO
celery beat -l INFO

job "explore-local-statistics" {
  datacenters = ["eu-west-2"]
  region      = "eu"
  type        = "service"

  update {
    stagger          = "60s"
    min_healthy_time = "60s"
    healthy_deadline = "2m"
    max_parallel     = 1
    auto_revert      = true
  }

  group "web" {
    count = "{{WEB_TASK_COUNT}}"

    constraint {
      attribute = "${node.class}"
      value     = "web"
    }

    restart {
      attempts = 3
      delay    = "15s"
      interval = "1m"
      mode     = "delay"
    }

    task "explore-local-statistics" {
      driver = "docker"

      artifact {
        source = "s3::https://s3-eu-west-2.amazonaws.com/{{DEPLOYMENT_BUCKET}}/explore-local-statistics/{{PROFILE}}/{{RELEASE}}.tar.gz"
      }

      config {
        command = "${NOMAD_TASK_DIR}/start-task"

        args = ["node", "build"]

        image = "{{ECR_URL}}:concourse-{{REVISION}}"

        port_map {
          http = "${NOMAD_PORT_http}"
        }
      }

      service {
        name = "explore-local-statistics"
        port = "http"
        tags = ["web"]
        check {
          type     = "http"
          path     = "/explore-local-statistics/api/alive"
          interval = "10s"
          timeout  = "2s"
        }
      }

      resources {
        cpu    = "{{WEB_RESOURCE_CPU}}"
        memory = "{{WEB_RESOURCE_MEM}}"

        network {
          port "http" {}
        }
      }

      template {
        data = <<EODATA
        export PORT="${NOMAD_PORT_http}"
        AWS_PROFILE="dp-{{PROFILE}}"

        # keep all below in-sync with Makefile
        export SVELTEKIT_BASE_PATH=/explore-local-statistics
        export SVELTEKIT_ADAPTER=node
        export SVELTEKIT_APP_VERSION="{{REVISION}}"

        S3_PREFIX="explore-local-statistics-assets/{{REVISION}}"
        if   [[ $AWS_PROFILE = dp-sandbox ]]; then
          export SVELTEKIT_ASSETS_PATH="https://ons-$AWS_PROFILE-cdn.s3.eu-west-2.amazonaws.com/$S3_PREFIX"
        elif [[ $AWS_PROFILE = dp-staging ]]; then
          export SVELTEKIT_ASSETS_PATH="https://cdn.staging.onsdigital.co.uk/$S3_PREFIX"
        elif [[ $AWS_PROFILE = dp-prod    ]]; then
          export SVELTEKIT_ASSETS_PATH="https://cdn.ons.gov.uk/$S3_PREFIX"
        fi
        EODATA
        destination = "${NOMAD_TASK_DIR}/vars"
      }

      # template {
      # source      = "${NOMAD_TASK_DIR}/vars-template"
      # destination = "${NOMAD_TASK_DIR}/vars"
      # }

      # vault {
      # policies = ["explore-local-statistics-web"]
      # }
    }
  }
}

# This file is responsible for configuring your application
# and its dependencies with the aid of the Mix.Config module.
#
# This configuration file is loaded before any dependency and
# is restricted to this project.

# General application configuration
use Mix.Config

config :hop_stop,
  ecto_repos: [HopStop.Repo]

# Configures the endpoint
config :hop_stop, HopStopWeb.Endpoint,
  url: [host: "localhost"],
  secret_key_base: "PEyzd/g2czQfZLy4OdgS9sk8KCL58JyCVLxVhCGODPD1MVbUNUOFi9bEBRFLOl5r",
  render_errors: [view: HopStopWeb.ErrorView, accepts: ~w(html json), layout: false],
  pubsub_server: HopStop.PubSub,
  live_view: [signing_salt: "OENSlv6D"]

# Configures Elixir's Logger
config :logger, :console,
  format: "$time $metadata[$level] $message\n",
  metadata: [:request_id]

# Use Jason for JSON parsing in Phoenix
config :phoenix, :json_library, Jason

# Import environment specific config. This must remain at the bottom
# of this file so it overrides the configuration defined above.
import_config "#{Mix.env()}.exs"
